const cron = require('node-cron');
const { Op } = require('sequelize');
const { EmailTask, EmailTemplate } = require('../../../models');
const { logger } = require('../../../config/logger');
const emailService = require('./email.service');

/**
 * 邮件任务服务
 * 负责邮件发送任务的管理、调度和执行
 */
class EmailTaskService {
  constructor() {
    // 存储定时任务的 Map: taskId -> cronJob
    this.scheduledJobs = new Map();
    // 任务执行锁，防止并发执行
    this.executingTasks = new Set();
  }

  /**
   * 初始化所有启用的任务
   */
  async initializeTasks() {
    try {
      const tasks = await EmailTask.findAll({
        where: { enabled: true, deleted_at: null },
      });

      logger.info(`[EmailTask] 初始化 ${tasks.length} 个邮件任务`);

      for (const task of tasks) {
        this.scheduleTask(task);
      }
    } catch (error) {
      logger.error('[EmailTask] 初始化任务失败:', error);
    }
  }

  /**
   * 根据频率生成 cron 表达式
   */
  getCronExpression(frequency) {
    const cronMap = {
      hourly: '0 * * * *', // 每小时的第0分钟
      daily: '0 9 * * *', // 每天9点
      weekly: '0 9 * * 1', // 每周一9点
      monthly: '0 9 1 * *', // 每月1号9点
    };
    return cronMap[frequency] || null;
  }

  /**
   * 为任务安排定时执行
   */
  scheduleTask(task) {
    if (task.frequency === 'once' || !task.enabled) {
      return; // 一次性任务或禁用任务不调度
    }

    if (this.scheduledJobs.has(task.id)) {
      logger.warn(`[EmailTask] 任务 ${task.id} 已经被调度`);
      return;
    }

    const cronExpression = this.getCronExpression(task.frequency);

    if (!cronExpression) {
      logger.warn(`[EmailTask] 任务 ${task.id} 的频率配置无效: ${task.frequency}`);
      return;
    }

    try {
      const job = cron.schedule(cronExpression, async () => {
        await this.executeTask(task.id);
      }, {
        scheduled: true,
        timezone: 'Asia/Shanghai',
      });

      this.scheduledJobs.set(task.id, job);
      logger.info(`[EmailTask] 任务 ${task.name} (${task.id}) 已调度`);
    } catch (error) {
      logger.error(`[EmailTask] 调度任务 ${task.id} 失败:`, error);
    }
  }

  /**
   * 取消任务的定时执行
   */
  unscheduleTask(taskId) {
    const job = this.scheduledJobs.get(taskId);
    if (job) {
      job.stop();
      this.scheduledJobs.delete(taskId);
      logger.info(`[EmailTask] 任务 ${taskId} 已取消调度`);
    }
  }

  /**
   * 验证邮箱格式
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 解析收件人列表
   */
  parseRecipients(recipientsText) {
    return recipientsText
      .split(',')
      .map(email => email.trim())
      .filter(email => email && this.isValidEmail(email));
  }

  /**
   * 执行邮件任务
   */
  async executeTask(taskId, isManualTrigger = false) {
    // 防止并发执行
    if (this.executingTasks.has(taskId)) {
      logger.warn(`[EmailTask] 任务 ${taskId} 正在执行，跳过本次调度`);
      return;
    }

    this.executingTasks.add(taskId);

    try {
      const task = await EmailTask.findByPk(taskId);

      if (!task) {
        logger.error(`[EmailTask] 任务不存在: ${taskId}`);
        return;
      }

      if (!task.enabled && !isManualTrigger) {
        logger.warn(`[EmailTask] 任务未启用: ${task.name}`);
        return;
      }

      // 获取邮件模板
      const template = await EmailTemplate.findByPk(task.template_id);

      if (!template) {
        logger.error(`[EmailTask] 模板不存在: ${task.template_id}`);
        await this.updateTaskStatus(taskId, 'failed', '邮件模板不存在');
        return;
      }

      // 解析收件人
      const recipients = this.parseRecipients(task.recipients);

      if (recipients.length === 0) {
        logger.error(`[EmailTask] 任务 ${task.name} 没有有效的收件人`);
        await this.updateTaskStatus(taskId, 'failed', '没有有效的收件人邮箱');
        return;
      }

      // 发送邮件
      const result = await emailService.sendEmailByTemplate(
        task.template_id,
        recipients,
        task.template_variables || {}
      );

      // 更新任务执行状态
      const status = result.failedCount === 0 ? 'success' : 'failed';
      const errorMessage = result.failedCount > 0
        ? `发送失败: ${result.failedCount}/${recipients.length}`
        : null;

      await this.updateTaskStatus(taskId, status, errorMessage);

      logger.info(`[EmailTask] 任务 ${task.name} 执行完成: ${result.successCount}/${recipients.length} 成功`);
    } catch (error) {
      logger.error(`[EmailTask] 任务 ${taskId} 执行失败:`, error);
      await this.updateTaskStatus(taskId, 'failed', error.message);
    } finally {
      this.executingTasks.delete(taskId);
    }
  }

  /**
   * 更新任务执行状态
   */
  async updateTaskStatus(taskId, status, errorMessage = null) {
    try {
      await EmailTask.update(
        {
          last_executed_at: new Date(),
          last_status: status,
          last_error: errorMessage,
          execution_count: EmailTask.sequelize.literal('execution_count + 1'),
        },
        { where: { id: taskId } }
      );
    } catch (error) {
      logger.error(`[EmailTask] 更新任务状态失败: ${taskId}`, error);
    }
  }

  /**
   * 获取所有任务
   */
  async getAllTasks(filters = {}) {
    try {
      const { page = 1, limit = 20, enabled, keyword } = filters;
      const offset = (page - 1) * limit;

      const where = { deleted_at: null };
      if (enabled !== undefined) {
        where.enabled = enabled;
      }
      if (keyword) where.name = { [Op.iLike]: `%${keyword}%` };

      const { count, rows } = await EmailTask.findAndCountAll({
        where,
        limit,
        offset,
        order: [['created_at', 'DESC']],
      });

      return {
        total: count,
        items: rows,
        page: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      throw new Error(`获取邮件任务列表失败: ${error.message}`);
    }
  }

  /**
   * 获取任务详情
   */
  async getTaskById(id) {
    try {
      const task = await EmailTask.findByPk(id);

      if (!task) {
        throw new Error('邮件任务不存在');
      }

      return task;
    } catch (error) {
      throw new Error(`获取邮件任务详情失败: ${error.message}`);
    }
  }

  /**
   * 创建新任务
   */
  async createTask(data, userId) {
    try {
      // 验证收件人格式
      const recipients = this.parseRecipients(data.recipients);
      if (recipients.length === 0) {
        throw new Error('请填写至少一个有效的收件人邮箱');
      }

      const task = await EmailTask.create({
        ...data,
        created_by: userId,
      });

      // 如果启用了，立即调度
      if (task.enabled) {
        this.scheduleTask(task);
      }

      return task;
    } catch (error) {
      throw new Error(`创建邮件任务失败: ${error.message}`);
    }
  }

  /**
   * 更新任务
   */
  async updateTask(id, data, userId) {
    try {
      const task = await this.getTaskById(id);

      // 验证收件人格式
      if (data.recipients) {
        const recipients = this.parseRecipients(data.recipients);
        if (recipients.length === 0) {
          throw new Error('请填写至少一个有效的收件人邮箱');
        }
      }

      // 如果频率或启用状态改变，需要重新调度
      const needsReschedule = data.frequency !== task.frequency || data.enabled !== task.enabled;

      if (needsReschedule) {
        this.unscheduleTask(id);
      }

      const updated = await task.update({
        ...data,
        updated_by: userId,
      });

      // 重新调度
      if (updated.enabled && needsReschedule) {
        this.scheduleTask(updated);
      }

      return updated;
    } catch (error) {
      throw new Error(`更新邮件任务失败: ${error.message}`);
    }
  }

  /**
   * 删除任务
   */
  async deleteTask(id, userId) {
    try {
      const task = await this.getTaskById(id);

      // 取消调度
      this.unscheduleTask(id);

      // 软删除
      await task.update({
        deleted_at: new Date(),
        deleted_by: userId,
      });
    } catch (error) {
      throw new Error(`删除邮件任务失败: ${error.message}`);
    }
  }

  /**
   * 启用任务
   */
  async enableTask(id) {
    try {
      const task = await this.getTaskById(id);
      await task.update({ enabled: true });
      this.scheduleTask(task);
      return task;
    } catch (error) {
      throw new Error(`启用邮件任务失败: ${error.message}`);
    }
  }

  /**
   * 禁用任务
   */
  async disableTask(id) {
    try {
      const task = await this.getTaskById(id);
      await task.update({ enabled: false });
      this.unscheduleTask(id);
      return task;
    } catch (error) {
      throw new Error(`禁用邮件任务失败: ${error.message}`);
    }
  }

  /**
   * 手动执行任务
   */
  async manualExecuteTask(id) {
    try {
      await this.executeTask(id, true);
    } catch (error) {
      throw new Error(`手动执行邮件任务失败: ${error.message}`);
    }
  }
}

module.exports = new EmailTaskService();

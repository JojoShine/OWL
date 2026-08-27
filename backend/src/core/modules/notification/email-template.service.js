const { EmailTemplate } = require('../../../models');
const { Op } = require('sequelize');
const handlebars = require('handlebars');

/**
 * 邮件模板服务
 * 负责邮件模板的CRUD操作和模板渲染
 */
class EmailTemplateService {
  /**
   * 获取所有邮件模板
   * @param {Object} options - 查询选项
   * @param {Number} options.page - 页码
   * @param {Number} options.limit - 每页数量
   * @returns {Promise<Object>} { templates, total, page, limit }
   */
  async getAllTemplates(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        keyword,
      } = options;

      const offset = (page - 1) * limit;

      const { rows: templates, count: total } = await EmailTemplate.findAndCountAll({
        where: keyword ? { name: { [Op.iLike]: `%${keyword}%` } } : undefined,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return {
        templates,
        total,
        page: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`获取邮件模板列表失败: ${error.message}`);
    }
  }

  /**
   * 根据ID获取邮件模板
   * @param {String} templateId - 模板ID
   * @returns {Promise<Object>} 模板详情
   */
  async getTemplateById(templateId) {
    try {
      const template = await EmailTemplate.findByPk(templateId);

      if (!template) {
        throw new Error('邮件模板不存在');
      }

      return template;
    } catch (error) {
      throw new Error(`获取邮件模板详情失败: ${error.message}`);
    }
  }

  /**
   * 根据名称获取邮件模板
   * @param {String} templateName - 模板名称
   * @returns {Promise<Object>} 模板详情
   */
  async getTemplateByName(templateName) {
    try {
      const template = await EmailTemplate.findOne({
        where: { name: templateName },
      });

      if (!template) {
        throw new Error(`邮件模板不存在: ${templateName}`);
      }

      return template;
    } catch (error) {
      throw new Error(`获取邮件模板失败: ${error.message}`);
    }
  }

  /**
   * 创建邮件模板
   * @param {Object} templateData - 模板数据
   * @param {String} templateData.name - 模板名称（唯一）
   * @param {String} templateData.subject - 邮件主题
   * @param {String} templateData.content - HTML模板内容
   * @param {Array} templateData.tags - 标签列表 (可选)
   * @param {String} templateData.description - 模板描述 (可选)
   * @returns {Promise<Object>} 创建的模板
   */
  async createTemplate(templateData) {
    try {
      // 验证模板名称是否已存在
      const existingTemplate = await EmailTemplate.findOne({
        where: { name: templateData.name },
      });

      if (existingTemplate) {
        throw new Error(`模板名称已存在: ${templateData.name}`);
      }

      // 创建模板
      const template = await EmailTemplate.create({
        name: templateData.name,
        subject: templateData.subject,
        content: templateData.content,
        variables: {},
        variable_schema: [],
        tags: templateData.tags || [],
        description: templateData.description || null,
      });

      return template;
    } catch (error) {
      throw new Error(`创建邮件模板失败: ${error.message}`);
    }
  }

  /**
   * 更新邮件模板
   * @param {String} templateId - 模板ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的模板
   */
  async updateTemplate(templateId, updateData) {
    try {
      const template = await EmailTemplate.findByPk(templateId);

      if (!template) {
        throw new Error('邮件模板不存在');
      }

      // 如果更新名称，验证新名称是否已存在
      if (updateData.name && updateData.name !== template.name) {
        const existingTemplate = await EmailTemplate.findOne({
          where: { name: updateData.name },
        });

        if (existingTemplate) {
          throw new Error(`模板名称已存在: ${updateData.name}`);
        }
      }

      // 更新模板
      await template.update(updateData);

      return template;
    } catch (error) {
      throw new Error(`更新邮件模板失败: ${error.message}`);
    }
  }

  /**
   * 删除邮件模板
   * @param {String} templateId - 模板ID
   * @returns {Promise<Boolean>} 是否删除成功
   */
  async deleteTemplate(templateId) {
    try {
      const result = await EmailTemplate.destroy({
        where: { id: templateId },
      });

      if (result === 0) {
        throw new Error('邮件模板不存在');
      }

      return true;
    } catch (error) {
      throw new Error(`删除邮件模板失败: ${error.message}`);
    }
  }

  /**
   * 渲染模板
   * @param {String} templateId - 模板ID
   * @param {Object} variables - 模板变量
   * @returns {Promise<Object>} { subject, content } 渲染后的主题和内容
   */
  async renderTemplate(templateId, variables = {}) {
    try {
      const template = await this.getTemplateById(templateId);

      const mergedVariables = {
        title: variables.title || '系统告警通知',
        content: variables.content || '<p>暂无详细内容</p>',
      };

      const subjectTemplate = handlebars.compile(template.subject);
      const subject = subjectTemplate(mergedVariables);

      const contentTemplate = handlebars.compile(template.content);
      const content = contentTemplate(mergedVariables);

      return {
        subject,
        content,
      };
    } catch (error) {
      throw new Error(`渲染邮件模板失败: ${error.message}`);
    }
  }

  /**
   * 根据名称渲染模板
   * @param {String} templateName - 模板名称
   * @param {Object} variables - 模板变量
   * @returns {Promise<Object>} { subject, content } 渲染后的主题和内容
   */
  async renderTemplateByName(templateName, variables = {}) {
    try {
      const template = await this.getTemplateByName(templateName);

      // 编译并渲染主题
      const subjectTemplate = handlebars.compile(template.subject);
      const subject = subjectTemplate(variables);

      // 编译并渲染内容
      const contentTemplate = handlebars.compile(template.content);
      const content = contentTemplate(variables);

      return {
        subject,
        content,
      };
    } catch (error) {
      throw new Error(`渲染邮件模板失败: ${error.message}`);
    }
  }

  /**
   * 验证模板语法
   * @param {String} subject - 邮件主题模板
   * @param {String} content - 邮件内容模板
   * @throws {Error} 模板语法错误
   */
  validateTemplateSyntax(subject, content) {
    try {
      // 尝试编译主题模板
      handlebars.compile(subject);

      // 尝试编译内容模板
      handlebars.compile(content);

      return true;
    } catch (error) {
      throw new Error(`模板语法错误: ${error.message}`);
    }
  }

  /**
   * 校验模板中使用的变量占位符
   * 仅允许 {{title}} 与 {{content}}
   */
  ensureAllowedPlaceholders(subject, content) {
    const allowed = new Set(['title', 'content']);
    const templates = [subject, content];

    templates.forEach((tpl) => {
      const ast = handlebars.parse(tpl);
      this.walkTemplateAst(ast, allowed);
    });
  }

  walkTemplateAst(node, allowed) {
    if (!node) {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((child) => this.walkTemplateAst(child, allowed));
      return;
    }

    if (node.type === 'MustacheStatement' || node.type === 'TripleStatement') {
      const name = node.path?.original;
      if (!allowed.has(name)) {
        throw new Error('邮件模板仅支持 {{title}} 和 {{content}} 变量');
      }
    }

    if (node.type === 'BlockStatement' || node.type === 'PartialStatement' || node.type === 'PartialBlockStatement') {
      throw new Error('邮件模板暂不支持条件、循环等高级语法');
    }

    Object.keys(node).forEach((key) => {
      if (['type', 'path', 'original'].includes(key)) {
        return;
      }
      const value = node[key];
      if (value && typeof value === 'object') {
        this.walkTemplateAst(value, allowed);
      }
    });
  }

  /**
   * 验证模板变量
   * @param {String} templateId - 模板ID
   * @param {Object} variables - 待验证的变量
   * @returns {Promise<Object>} { valid, missingVariables } 验证结果
   */
  async validateTemplateVariables(templateId, variables = {}) {
    try {
      await this.getTemplateById(templateId);

      const missing = [];
      if (!variables.title) {
        missing.push('title');
      }
      if (!variables.content) {
        missing.push('content');
      }

      return {
        valid: missing.length === 0,
        missingVariables: missing,
      };
    } catch (error) {
      throw new Error(`验证模板变量失败: ${error.message}`);
    }
  }

  /**
   * 预览模板
   * @param {String} templateId - 模板ID
   * @param {Object} sampleVariables - 示例变量
   * @returns {Promise<Object>} { subject, content, html } 预览结果
   */
  async previewTemplate(templateId, sampleVariables = {}) {
    try {
      const template = await this.getTemplateById(templateId);

      const variables = {
        title: sampleVariables.title || '接口监控告警示例',
        content: sampleVariables.content || '<p>这里展示告警详情内容示例。</p>',
      };

      const rendered = await this.renderTemplate(templateId, variables);

      return {
        subject: rendered.subject,
        content: rendered.content,
        html: rendered.content, // HTML预览
      };
    } catch (error) {
      throw new Error(`预览邮件模板失败: ${error.message}`);
    }
  }
}

module.exports = new EmailTemplateService();

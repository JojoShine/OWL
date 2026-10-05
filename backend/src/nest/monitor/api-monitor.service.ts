import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { live } from '../identity/identity.helpers';
import { deleted } from '../storage/storage.helpers';
import { shared } from '../compatibility/shared';
import { EmailService } from '../notification/email.service';
const axios: any = require('axios');
/**
 * 接口监控服务
 * 负责管理接口监控配置、执行定时检测、记录监控日志
 */
@Injectable()
export class ApiMonitorService {
    [key: string]: any;
    private stopping = false;
    private waits = new Map<any, () => void>();
    constructor(private readonly db: PrismaService, private readonly email: EmailService) {
        // 存储定时任务的 Map: monitorId -> cronJob
        this.scheduledJobs = new Map();
        // 存储最后告警时间的 Map: monitorId -> timestamp
        this.lastAlertTime = new Map();
        // 存储监控最后状态的 Map: monitorId -> status ('success' | 'failed' | 'timeout')
        this.lastMonitorStatus = new Map();
        // 存储监控执行队列，确保单次串行执行
        this.executionQueues = new Map();
        // 记录最后执行时间（包含手动触发）
        this.lastExecutionAt = new Map();
        // 动态退避信息（监控ID -> 当前退避时长）
        this.backoffDelays = new Map();
        // 退避截止时间戳
        this.backoffUntil = new Map();
        // 最小执行间隔（毫秒，用于兜底）
        this.minIntervalMs = 10 * 1000;
    }
    /**
     * 获取所有监控配置列表
     */
    async getAllMonitors(filters: any = {}): Promise<any> {
        const { page = 1, limit = 20, enabled }: any = filters;
        const offset: any = (page - 1) * limit;
        const where: any = {};
        if (enabled !== undefined) {
            where.enabled = enabled === true || enabled === 'true';
        }
        const { count, rows }: any = await Promise.all([this.db.owl_api_monitors.count({ where: { ...(where), ...live } }), this.db.owl_api_monitors.findMany({ where: { ...(where), ...live }, take: Number(limit), skip: Number(offset), orderBy: [{ "createdAt": "desc" }] })]).then(([count, rows]: any) => ({ count, rows }));
        // 获取所有监控的最新日志（批量查询，而非串行）
        const monitorIds: any = rows.map((m: any) => m.id);
        const latestLogs: any = {};
        if (monitorIds.length > 0) {
            // 使用子查询优化：一次查询获取所有监控的最新日志
            const logs: any = await this.db.owl_api_monitor_logs.findMany({ where: { ...({
                        monitor_id: { in: monitorIds }
                    }), ...live }, orderBy: [{ "createdAt": "desc" }], select: { 'monitor_id': true, 'status': true, 'status_code': true, 'response_time': true, 'error_message': true, 'createdAt': true } });
            // 构建最新日志映射（每个monitor只保留最新的一条）
            logs.forEach((log: any) => {
                if (!latestLogs[log.monitor_id]) {
                    latestLogs[log.monitor_id] = log;
                }
            });
        }
        // 关联最新日志
        const monitorsWithLastLog: any = rows.map((monitor: any) => ({
            ...monitor,
            lastLog: latestLogs[monitor.id] || null,
        }));
        return {
            total: count,
            items: monitorsWithLastLog,
            page: parseInt(page),
            pageSize: parseInt(limit),
        };
    }
    /**
     * 根据 ID 获取监控配置
     */
    async getMonitorById(id: any): Promise<any> {
        const monitor: any = await this.db.owl_api_monitors.findFirst({ where: { id: id, ...live } });
        if (!monitor) {
            throw new Error('监控配置不存在');
        }
        return monitor;
    }
    /**
     * 创建监控配置
     */
    async createMonitor(data: any): Promise<any> {
        const monitor: any = await this.db.owl_api_monitors.create({ data: data });
        // 如果启用，则启动定时任务
        if (monitor.enabled) {
            this.startScheduledJob(monitor);
        }
        return monitor;
    }
    /**
     * 更新监控配置
     */
    async updateMonitor(id: any, data: any): Promise<any> {
        const monitor: any = await this.getMonitorById(id);
        // 过滤掉不应该被更新的字段（保护字段）
        const { id: _, created_by, created_at, updated_at, ...updateData }: any = data;
        // 处理 UUID 字段：将空字符串转换为 null
        // PostgreSQL 的 UUID 类型不接受空字符串，必须是有效的 UUID 或 null
        if (updateData.alert_template_id === '') {
            updateData.alert_template_id = null;
        }
        try {
            // 更新配置
            await Promise.resolve(this.db.owl_api_monitors.update({ where: { id: monitor.id }, data: { ...(updateData), updatedAt: new Date() } })).then((row: any) => Object.assign(monitor, row));
            // 重新加载以获取最新数据
            // 停止旧的定时任务
            this.stopScheduledJob(id);
            // 如果启用，则启动新的定时任务
            if (monitor.enabled) {
                this.startScheduledJob(monitor);
            }
            return monitor;
        }
        catch (error: any) {
            console.error(`[API Monitor] Error updating monitor ${id}:`, error);
            throw error;
        }
    }
    /**
     * 删除监控配置
     */
    async deleteMonitor(id: any): Promise<any> {
        const monitor: any = await this.getMonitorById(id);
        // 停止定时任务
        this.stopScheduledJob(id);
        this.lastExecutionAt.delete(id);
        this.backoffDelays.delete(id);
        this.backoffUntil.delete(id);
        this.lastAlertTime.delete(id);
        this.lastMonitorStatus.delete(id);
        // 删除监控配置（级联删除日志）
        await this.db.owl_api_monitors.update({ where: { id: monitor.id }, data: deleted() });
        return { message: '监控配置已删除' };
    }
    /**
     * 立即测试接口
     */
    async testApi(id: any): Promise<any> {
        const monitor: any = await this.getMonitorById(id);
        const result: any = await this.queueMonitorExecution(monitor, {
            reason: 'manual-test',
            allowDisabled: true,
        });
        return result?.log || null;
    }
    /**
     * 执行单次监控检测
     */
    async executeMonitor(monitor: any): Promise<any> {
        const startTime: any = Date.now();
        let logData: any = {
            monitor_id: monitor.id,
            status: 'success',
            status_code: null,
            response_time: null,
            response_body: null,
            error_message: null,
        };
        try {
            // 解析 headers
            const headers: any = monitor.headers || {};
            // 构建请求配置
            const config: any = {
                method: monitor.method.toLowerCase(),
                url: monitor.url,
                headers,
                timeout: (monitor.timeout || 30) * 1000, // 转换为毫秒
            };
            // 添加请求体（如果是 POST/PUT/PATCH）
            if (['POST', 'PUT', 'PATCH'].includes(monitor.method.toUpperCase()) && monitor.body) {
                try {
                    config.data = JSON.parse(monitor.body);
                }
                catch (e: any) {
                    config.data = monitor.body; // 如果不是 JSON，直接使用原始字符串
                }
            }
            // 执行请求
            const response: any = await axios(config);
            const responseTime: any = Date.now() - startTime;
            // 记录成功结果
            logData.status_code = response.status;
            logData.response_time = responseTime;
            logData.response_body = JSON.stringify(response.data).substring(0, 5000); // 限制响应体大小
            // 验证期望的状态码
            if (monitor.expect_status && response.status !== monitor.expect_status) {
                logData.status = 'failed';
                logData.error_message = `期望状态码 ${monitor.expect_status}，实际 ${response.status}`;
            }
            // 验证期望的响应内容
            if (monitor.expect_response && !JSON.stringify(response.data).includes(monitor.expect_response)) {
                logData.status = 'failed';
                logData.error_message = '响应内容不匹配期望值';
            }
        }
        catch (error: any) {
            const responseTime: any = Date.now() - startTime;
            logData.response_time = responseTime;
            // 判断是超时还是其他错误
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                logData.status = 'timeout';
                logData.error_message = '请求超时';
            }
            else {
                logData.status = 'failed';
                logData.status_code = error.response?.status || null;
                logData.error_message = error.message;
                if (error.response) {
                    logData.response_body = JSON.stringify(error.response.data).substring(0, 5000);
                }
            }
        }
        // 保存日志
        const log: any = await this.db.owl_api_monitor_logs.create({ data: logData });
        // 获取之前的监控状态
        const previousStatus: any = this.lastMonitorStatus.get(monitor.id);
        const currentStatus: any = logData.status;
        // 更新当前状态
        this.lastMonitorStatus.set(monitor.id, currentStatus);
        // 如果监控失败且启用了告警，发送告警邮件
        if (currentStatus !== 'success' && monitor.alert_enabled && monitor.alert_template_id) {
            await this.sendAlert(monitor, logData);
        }
        // 如果从失败状态恢复到成功，清除告警时间记录
        if (previousStatus && previousStatus !== 'success' && currentStatus === 'success') {
            this.lastAlertTime.delete(monitor.id);
            console.log(`[API Monitor] Monitor ${monitor.name} recovered, cleared alert cooldown`);
        }
        return log;
    }
    /**
     * 发送告警邮件
     */
    async sendAlert(monitor: any, logData: any): Promise<any> {
        try {
            // 检查是否在冷却期内（避免重复告警）
            if (!this.shouldSendAlert(monitor)) {
                const alertIntervalSeconds: any = monitor.alert_interval || 1800;
                console.log(`[API Monitor] Alert for ${monitor.name} is in cooldown period (interval: ${alertIntervalSeconds}s), skipping...`);
                return;
            }
            // 检查是否有接收人
            if (!monitor.alert_recipients || monitor.alert_recipients.length === 0) {
                console.warn(`[API Monitor] No alert recipients configured for monitor: ${monitor.name}`);
                return;
            }
            // 准备完整数据对象
            const dataObject: any = {
                ...monitor,
                lastLog: logData,
            };
            const alertTitle: any = `【接口告警】${monitor.name}`;
            const alertContent: any = this.buildAlertContent(monitor, logData);
            // 使用邮件服务发送告警
            await this.email.sendAlertEmail({
                templateId: monitor.alert_template_id,
                recipients: monitor.alert_recipients,
                title: alertTitle,
                content: alertContent,
            });
            // 记录告警发送时间
            this.lastAlertTime.set(monitor.id, Date.now());
            console.log(`[API Monitor] Alert sent for monitor: ${monitor.name}`);
        }
        catch (error: any) {
            console.error(`[API Monitor] Failed to send alert for monitor ${monitor.name}:`, error);
        }
    }
    /**
     * 检查是否应该发送告警（使用配置的告警间隔）
     * @param {Object} monitor - 监控配置对象
     * @returns {boolean} - 是否应该发送告警
     */
    shouldSendAlert(monitor: any): any {
        const lastTime: any = this.lastAlertTime.get(monitor.id);
        if (!lastTime) {
            return true; // 从未发送过告警，应该发送
        }
        const now: any = Date.now();
        const elapsed: any = now - lastTime;
        // 使用监控配置中的告警间隔（秒），转换为毫秒
        const alertIntervalMs: any = (monitor.alert_interval || 1800) * 1000;
        return elapsed >= alertIntervalMs; // 超过配置的告警间隔才发送
    }
    /**
     * 启动定时任务
     */
    startScheduledJob(monitor: any): any {
        if (this.stopping)
            return;
        // 如果已经存在定时任务，先停止
        if (this.scheduledJobs.has(monitor.id)) {
            this.stopScheduledJob(monitor.id);
        }
        const job: any = {
            cancelled: false,
            timer: null,
        };
        const run: any = async () => {
            if (job.cancelled) {
                return;
            }
            let freshMonitor: any;
            try {
                freshMonitor = await this.getMonitorById(monitor.id);
            }
            catch (error: any) {
                console.error(`[API Monitor] Failed to reload monitor ${monitor.id}:`, error);
                const fallbackMs: any = this.getIntervalMs(monitor);
                job.timer = setTimeout(run, fallbackMs);
                return;
            }
            if (!freshMonitor.enabled) {
                console.log(`[API Monitor] Monitor ${monitor.id} disabled, stopping scheduled job`);
                this.stopScheduledJob(monitor.id);
                return;
            }
            let executionResult: any;
            try {
                executionResult = await this.queueMonitorExecution(freshMonitor, { reason: 'scheduled' });
            }
            catch (error: any) {
                console.error(`[API Monitor] Error executing monitor ${monitor.id}:`, error);
            }
            if (job.cancelled) {
                return;
            }
            const nextMonitor: any = executionResult?.monitor || freshMonitor;
            if (executionResult?.skipped && executionResult?.monitor && !executionResult.monitor.enabled) {
                console.log(`[API Monitor] Monitor ${monitor.id} disabled during execution, stopping job`);
                this.stopScheduledJob(monitor.id);
                return;
            }
            const nextInterval: any = this.getIntervalMs(nextMonitor);
            job.timer = setTimeout(run, nextInterval);
        };
        this.scheduledJobs.set(monitor.id, job);
        run();
        console.log(`[API Monitor] Started scheduled job for monitor: ${monitor.name} (${monitor.id}), interval: ${monitor.interval || 60}s`);
    }
    /**
     * 停止定时任务
     */
    stopScheduledJob(monitorId: any): any {
        const job: any = this.scheduledJobs.get(monitorId);
        if (job) {
            job.cancelled = true;
            if (job.timer) {
                clearTimeout(job.timer);
            }
            this.scheduledJobs.delete(monitorId);
            this.lastExecutionAt.delete(monitorId);
            this.backoffDelays.delete(monitorId);
            this.backoffUntil.delete(monitorId);
            console.log(`[API Monitor] Stopped scheduled job for monitor: ${monitorId}`);
        }
    }
    /**
     * 获取监控日志
     */
    async getMonitorLogs(monitorId: any, filters: any = {}): Promise<any> {
        const { page = 1, limit = 50, status, startDate, endDate }: any = filters;
        // 限制最大每页100条
        const actualLimit: any = Math.min(parseInt(limit), 100);
        const offset: any = (page - 1) * actualLimit;
        const where: any = { monitor_id: monitorId };
        // 状态过滤
        if (status) {
            where.status = status;
        }
        // 时间范围过滤
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }
        const { count, rows }: any = await Promise.all([this.db.owl_api_monitor_logs.count({ where: { ...(where), ...live } }), this.db.owl_api_monitor_logs.findMany({ where: { ...(where), ...live }, take: Number(actualLimit), skip: Number(offset), orderBy: [{ "createdAt": "desc" }] })]).then(([count, rows]: any) => ({ count, rows }));
        return {
            total: count,
            items: rows,
            page: parseInt(page),
            limit: actualLimit,
        };
    }
    /**
     * 获取监控统计信息
     */
    async getMonitorStats(monitorId: any, hours: any = 24): Promise<any> {
        const since: any = new Date(Date.now() - hours * 60 * 60 * 1000);
        const logs: any = await this.db.owl_api_monitor_logs.findMany({ where: { ...({
                    monitor_id: monitorId,
                    createdAt: {
                        gte: since,
                    },
                }), ...live }, orderBy: [{ "createdAt": "asc" }] });
        const total: any = logs.length;
        const success: any = logs.filter((l: any) => l.status === 'success').length;
        const failed: any = logs.filter((l: any) => l.status === 'failed').length;
        const timeout: any = logs.filter((l: any) => l.status === 'timeout').length;
        // 计算平均响应时间
        const responseTimes: any = logs.filter((l: any) => l.response_time).map((l: any) => l.response_time);
        const avgResponseTime: any = responseTimes.length > 0
            ? responseTimes.reduce((a: any, b: any) => a + b, 0) / responseTimes.length
            : 0;
        // 可用率
        const availability: any = total > 0 ? (success / total) * 100 : 100;
        return {
            total,
            success,
            failed,
            timeout,
            availability: parseFloat(availability.toFixed(2)),
            avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
            period: `${hours}h`,
        };
    }
    /**
     * 初始化所有启用的监控任务
     */
    async initializeScheduledJobs(): Promise<any> {
        this.stopping = false;
        try {
            const monitors: any = await this.db.owl_api_monitors.findMany({ where: { ...({ enabled: true }), ...live } });
            console.log(`[API Monitor] Initializing ${monitors.length} enabled monitors...`);
            monitors.forEach((monitor: any) => {
                this.startScheduledJob(monitor);
            });
            console.log(`[API Monitor] All scheduled jobs initialized`);
        }
        catch (error: any) {
            console.error('[API Monitor] Error initializing scheduled jobs:', error);
        }
    }
    /**
     * 停止所有定时任务
     */
    stopAllScheduledJobs(): any {
        this.stopping = true;
        for (const [timer, resolve] of this.waits) {
            clearTimeout(timer);
            resolve();
        }
        this.waits.clear();
        console.log(`[API Monitor] Stopping all ${this.scheduledJobs.size} scheduled jobs...`);
        this.scheduledJobs.forEach((job: any, monitorId: any) => {
            job.cancelled = true;
            if (job.timer) {
                clearTimeout(job.timer);
            }
        });
        this.scheduledJobs.clear();
        console.log('[API Monitor] All scheduled jobs stopped');
    }
    /**
     * 将监控加入串行执行队列
     */
    queueMonitorExecution(monitor: any, options: any = {}): any {
        if (this.stopping)
            return Promise.resolve(null);
        const monitorId: any = monitor.id;
        const previous: any = this.executionQueues.get(monitorId) || Promise.resolve();
        const run: any = previous.then(() => this.runMonitorWithGuards(monitor, options));
        const tracked = run.catch((error: any) => { console.error(`[API Monitor] Queue execution error for ${monitorId}:`, error); }).finally(() => { if (this.executionQueues.get(monitorId) === tracked)
            this.executionQueues.delete(monitorId); });
        this.executionQueues.set(monitorId, tracked);
        return run;
    }
    /**
     * 在执行前应用节流与退避策略
     */
    async runMonitorWithGuards(monitor: any, options: any = {}): Promise<any> {
        if (this.stopping)
            return null;
        const { skipThrottle = false, allowDisabled = false }: any = options;
        const monitorId: any = monitor.id;
        const intervalMs: any = this.getIntervalMs(monitor);
        if (!skipThrottle) {
            await this.waitForThrottleWindow(monitorId, intervalMs);
        }
        if (this.stopping)
            return null;
        // 执行前再次加载最新配置，避免使用过期数据
        let freshMonitor: any;
        try {
            freshMonitor = await this.getMonitorById(monitorId);
        }
        catch (error: any) {
            console.error(`[API Monitor] Monitor ${monitorId} not found before execution:`, error.message);
            return { monitor, log: null, skipped: true };
        }
        if (!freshMonitor.enabled && !allowDisabled) {
            console.log(`[API Monitor] Monitor ${monitorId} disabled before execution, skipping`);
            return { monitor: freshMonitor, log: null, skipped: true };
        }
        const log: any = await this.executeMonitor(freshMonitor);
        this.lastExecutionAt.set(monitorId, Date.now());
        this.applyBackoffStrategy(freshMonitor, log);
        return { monitor: freshMonitor, log, skipped: false };
    }
    /**
     * 等待下一个执行窗口
     */
    async waitForThrottleWindow(monitorId: any, intervalMs: any): Promise<any> {
        const now: any = Date.now();
        let waitUntil: any = now;
        const lastRan: any = this.lastExecutionAt.get(monitorId);
        if (lastRan) {
            waitUntil = Math.max(waitUntil, lastRan + intervalMs);
        }
        const backoffDeadline: any = this.backoffUntil.get(monitorId);
        if (backoffDeadline) {
            waitUntil = Math.max(waitUntil, backoffDeadline);
        }
        if (waitUntil > now) {
            await this.delay(waitUntil - now);
        }
    }
    /**
     * 动态退避策略
     */
    applyBackoffStrategy(monitor: any, log: any): any {
        if (!log) {
            return;
        }
        const monitorId: any = monitor.id;
        const statusCode: any = log.status_code;
        const is429: any = statusCode === 429;
        const isServerError: any = statusCode >= 500 && statusCode < 600;
        if (is429 || isServerError) {
            const baseDelay: any = this.getIntervalMs(monitor);
            const previousDelay: any = this.backoffDelays.get(monitorId) || baseDelay;
            const nextDelay: any = Math.min(previousDelay * 2, 30 * 60 * 1000); // 最长退避30分钟
            this.backoffDelays.set(monitorId, nextDelay);
            this.backoffUntil.set(monitorId, Date.now() + nextDelay);
            console.warn(`[API Monitor] Monitor ${monitor.name} encountered ${statusCode}, applying backoff ${Math.round(nextDelay / 1000)}s`);
            return;
        }
        // 正常恢复后清除退避信息
        this.backoffDelays.delete(monitorId);
        this.backoffUntil.delete(monitorId);
    }
    /**
     * 构建告警内容 HTML
     */
    buildAlertContent(monitor: any, logData: any): any {
        const statusCode: any = logData.status_code || 'N/A';
        const responseTime: any = logData.response_time ? `${logData.response_time}ms` : 'N/A';
        const timestamp: any = new Date().toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        const errorMessage: any = logData.error_message || '无';
        return [
            `<p>接口监控 <strong>${monitor.name}</strong> 发生异常，请及时关注。</p>`,
            '<ul>',
            `<li><strong>请求地址：</strong>${monitor.url}</li>`,
            `<li><strong>请求方法：</strong>${monitor.method}</li>`,
            `<li><strong>当前状态：</strong>${logData.status}</li>`,
            `<li><strong>状态码：</strong>${statusCode}</li>`,
            `<li><strong>响应时间：</strong>${responseTime}</li>`,
            `<li><strong>错误详情：</strong>${errorMessage}</li>`,
            `<li><strong>检测时间：</strong>${timestamp}</li>`,
            '</ul>',
        ].join('');
    }
    /**
     * 工具方法：根据监控配置获取毫秒间隔
     */
    getIntervalMs(monitor: any): any {
        const raw: any = parseInt(monitor.interval, 10);
        const fallbackSeconds: any = Number.isFinite(raw) && raw > 0 ? raw : 60;
        const intervalSeconds: any = Math.max(fallbackSeconds, this.minIntervalMs / 1000);
        return intervalSeconds * 1000;
    }
    /**
     * Promise 形式的延迟
     */
    async drain() { await Promise.allSettled(this.executionQueues.values()); }
    delay(ms: any): any {
        if (this.stopping)
            return Promise.resolve();
        return new Promise<void>(resolve => { const timer = setTimeout(() => { this.waits.delete(timer); resolve(); }, ms); this.waits.set(timer, resolve); });
    }
}

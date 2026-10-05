import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { live } from '../identity/identity.helpers';
import { deleted } from '../storage/storage.helpers';
import { shared } from '../compatibility/shared';
import { EmailService } from '../notification/email.service';
const { Client }: any = require('ssh2');
const net: any = require('net');
/**
 * 服务器监控服务
 * 通过SSH采集远程服务器指标 + TCP端口探测
 */
@Injectable()
export class ServerMonitorService {
    [key: string]: any;
    private stopping = false;
    private executions = new Map<string, Promise<any>>();
    private portChecks = new Set<Promise<any>>();
    constructor(private readonly db: PrismaService, private readonly email: EmailService) {
        this.scheduledJobs = new Map(); // serverId -> intervalId
        this.lastAlertTime = new Map(); // serverId -> timestamp
    }
    /**
     * 获取所有服务器列表（带分页）
     */
    async getAllServers(filters: any = {}): Promise<any> {
        const { page = 1, limit = 20, enabled, status }: any = filters;
        const offset: any = (page - 1) * limit;
        const where: any = {};
        if (enabled !== undefined)
            where.enabled = enabled;
        if (status)
            where.status = status;
        const { count, rows }: any = await Promise.all([this.db.owl_server_monitors.count({ where: { ...(where), ...live } }), this.db.owl_server_monitors.findMany({ where: { ...(where), ...live }, take: Number(limit), skip: Number(offset), orderBy: [{ "createdAt": "desc" }] })]).then(([count, rows]: any) => ({ count, rows }));
        return {
            servers: await Promise.all(rows.map(async (server: any) => ({ ...server, ports: await this.db.owl_server_monitor_ports.findMany({ where: { server_id: server.id, ...live } }) }))),
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit),
            },
        };
    }
    /**
     * 根据ID获取服务器详情
     */
    async getServerById(id: any): Promise<any> {
        const server: any = await this.db.owl_server_monitors.findFirst({ where: { id: id, ...live } });
        return server ? { ...server, ports: await this.db.owl_server_monitor_ports.findMany({ where: { server_id: id, ...live } }), logs: await this.db.owl_server_monitor_logs.findMany({ where: { server_id: id, ...live }, take: 10, orderBy: { checked_at: 'desc' } }) } : null;
    }
    /**
     * 创建服务器监控配置
     */
    async createServer(data: any, userId: any): Promise<any> {
        const server: any = await this.db.owl_server_monitors.create({ data: {
                ...data,
                created_by: userId,
            } });
        return server;
    }
    /**
     * 更新服务器监控配置
     */
    async updateServer(id: any, data: any, userId: any): Promise<any> {
        const server: any = await this.db.owl_server_monitors.findFirst({ where: { id: id, ...live } });
        if (!server)
            throw new Error('服务器不存在');
        await Promise.resolve(this.db.owl_server_monitors.update({ where: { id: server.id }, data: { ...({
                    ...data,
                    updated_by: userId,
                }), updatedAt: new Date() } })).then((row: any) => Object.assign(server, row));
        return server;
    }
    /**
     * 删除服务器监控配置（软删除）
     */
    async deleteServer(id: any, userId: any): Promise<any> {
        const server: any = await this.db.owl_server_monitors.findFirst({ where: { id: id, ...live } });
        if (!server)
            throw new Error('服务器不存在');
        // 停止定时任务
        this.stopMonitoring(id);
        // 使用 Sequelize 软删除，同时记录 deleted_by
        await Promise.resolve(this.db.owl_server_monitors.update({ where: { id: server.id }, data: { ...({ deleted_by: userId }), updatedAt: new Date() } })).then((row: any) => Object.assign(server, row));
        await this.db.owl_server_monitors.update({ where: { id: server.id }, data: deleted() }); // paranoid: true 时会设置 deleted_at
        return true;
    }
    /**
     * 测试SSH连接
     */
    async testConnection(serverId: any): Promise<any> {
        const server: any = await this.db.owl_server_monitors.findFirst({ where: { id: serverId, ...live } });
        if (!server)
            throw new Error('服务器不存在');
        return new Promise((resolve: any, reject: any) => {
            const conn: any = new Client();
            const timeout: any = setTimeout(() => {
                conn.end();
                reject(new Error('连接超时'));
            }, (server.timeout || 30) * 1000);
            conn.on('ready', () => {
                clearTimeout(timeout);
                conn.end();
                resolve({ success: true, message: 'SSH连接成功' });
            });
            conn.on('error', (err: any) => {
                clearTimeout(timeout);
                reject(err);
            });
            const connectConfig: any = {
                host: server.ip_address,
                port: server.port || 22,
                username: server.username,
                readyTimeout: (server.timeout || 30) * 1000,
            };
            if (server.auth_type === 'password') {
                connectConfig.password = server.password;
            }
            else if (server.auth_type === 'key' && server.private_key) {
                connectConfig.privateKey = server.private_key;
            }
            conn.connect(connectConfig);
        });
    }
    /**
     * 通过SSH执行命令并返回结果
     */
    _execCommand(conn: any, command: any): any {
        return new Promise((resolve: any, reject: any) => {
            conn.exec(command, (err: any, stream: any) => {
                if (err)
                    return reject(err);
                let stdout: any = '';
                let stderr: any = '';
                stream.on('close', (code: any) => {
                    if (code !== 0 && stderr) {
                        reject(new Error(stderr));
                    }
                    else {
                        resolve(stdout.trim());
                    }
                });
                stream.on('data', (data: any) => {
                    stdout += data.toString();
                });
                stream.stderr.on('data', (data: any) => {
                    stderr += data.toString();
                });
            });
        });
    }
    /**
     * 采集服务器指标
     */
    async collectMetrics(server: any): Promise<any> {
        return new Promise(async (resolve: any, reject: any) => {
            const conn: any = new Client();
            const timeout: any = setTimeout(() => {
                conn.end();
                reject(new Error('采集超时'));
            }, (server.timeout || 30) * 1000);
            conn.on('ready', async () => {
                try {
                    // CPU使用率
                    const cpuOutput: any = await this._execCommand(conn, "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'");
                    const cpuUsage: any = parseFloat(cpuOutput) || 0;
                    // 内存信息
                    const memOutput: any = await this._execCommand(conn, "free -m | grep Mem");
                    const memParts: any = memOutput.split(/\s+/);
                    const memoryTotalMb: any = parseFloat(memParts[1]) || 0;
                    const memoryUsedMb: any = parseFloat(memParts[2]) || 0;
                    const memoryUsage: any = memoryTotalMb > 0 ? ((memoryUsedMb / memoryTotalMb) * 100).toFixed(2) : 0;
                    // 磁盘使用率
                    const diskOutput: any = await this._execCommand(conn, "df -BG / | tail -1 | awk '{print $5}'");
                    const diskUsage: any = parseFloat(diskOutput.replace('%', '')) || 0;
                    const diskTotalGb: any = parseFloat((await this._execCommand(conn, "df -BG / | tail -1 | awk '{print $2}'")).replace('G', '')) || 0;
                    const diskUsedGb: any = parseFloat((await this._execCommand(conn, "df -BG / | tail -1 | awk '{print $3}'")).replace('G', '')) || 0;
                    // 负载
                    const loadOutput: any = await this._execCommand(conn, "cat /proc/loadavg");
                    const loadParts: any = loadOutput.split(' ');
                    const loadAvg1m: any = parseFloat(loadParts[0]) || 0;
                    const loadAvg5m: any = parseFloat(loadParts[1]) || 0;
                    const loadAvg15m: any = parseFloat(loadParts[2]) || 0;
                    clearTimeout(timeout);
                    conn.end();
                    const metrics: any = {
                        cpuUsage,
                        memoryUsage: parseFloat(memoryUsage),
                        memoryUsedMb,
                        memoryTotalMb,
                        diskUsage,
                        diskUsedGb,
                        diskTotalGb,
                        loadAvg1m,
                        loadAvg5m,
                        loadAvg15m,
                    };
                    resolve(metrics);
                }
                catch (err: any) {
                    clearTimeout(timeout);
                    conn.end();
                    reject(err);
                }
            });
            conn.on('error', (err: any) => {
                clearTimeout(timeout);
                reject(err);
            });
            const connectConfig: any = {
                host: server.ip_address,
                port: server.port || 22,
                username: server.username,
                readyTimeout: (server.timeout || 30) * 1000,
            };
            if (server.auth_type === 'password') {
                connectConfig.password = server.password;
            }
            else if (server.auth_type === 'key' && server.private_key) {
                connectConfig.privateKey = server.private_key;
            }
            conn.connect(connectConfig);
        });
    }
    /**
     * 探测TCP端口是否畅通
     */
    async checkPort(host: any, port: any, timeout: any = 5000): Promise<any> {
        return new Promise((resolve: any) => {
            const socket: any = new net.Socket();
            const timer: any = setTimeout(() => {
                socket.destroy();
                resolve('timeout');
            }, timeout);
            socket.on('connect', () => {
                clearTimeout(timer);
                socket.destroy();
                resolve('open');
            });
            socket.on('error', () => {
                clearTimeout(timer);
                resolve('closed');
            });
            socket.connect(port, host);
        });
    }
    /**
     * 检查单个服务器
     */
    checkServer(serverId: string): Promise<any> {
        if (this.stopping)
            return Promise.resolve();
        if (this.executions.has(serverId))
            return this.executions.get(serverId)!;
        const work = this.runServerCheck(serverId).finally(() => this.executions.delete(serverId));
        this.executions.set(serverId, work);
        return work;
    }
    async runServerCheck(serverId: any): Promise<any> {
        const server: any = await this.db.owl_server_monitors.findFirst({ where: { id: serverId, ...live } });
        if (!server || !server.enabled)
            return;
        server.ports = await this.db.owl_server_monitor_ports.findMany({ where: { server_id: serverId, enabled: true, ...live } });
        const logData: any = {
            server_id: serverId,
            check_status: 'success',
            checked_at: new Date(),
        };
        try {
            // 采集指标
            const metrics: any = await this.collectMetrics(server);
            // 将指标数据转换为数据库字段格式（蛇形命名）
            Object.assign(logData, {
                cpu_usage: metrics.cpuUsage,
                memory_usage: metrics.memoryUsage,
                memory_used_mb: metrics.memoryUsedMb,
                memory_total_mb: metrics.memoryTotalMb,
                disk_usage: metrics.diskUsage,
                disk_used_gb: metrics.diskUsedGb,
                disk_total_gb: metrics.diskTotalGb,
                load_avg_1m: metrics.loadAvg1m,
                load_avg_5m: metrics.loadAvg5m,
                load_avg_15m: metrics.loadAvg15m,
            });
            // 更新状态和最新指标
            await Promise.resolve(this.db.owl_server_monitors.update({ where: { id: server.id }, data: { ...({
                        status: 'online',
                        last_check_at: new Date(),
                        last_metrics: {
                            cpu_usage: metrics.cpuUsage,
                            memory_usage: metrics.memoryUsage,
                            memory_used_mb: metrics.memoryUsedMb,
                            memory_total_mb: metrics.memoryTotalMb,
                            disk_usage: metrics.diskUsage,
                            disk_used_gb: metrics.diskUsedGb,
                            disk_total_gb: metrics.diskTotalGb,
                            load_avg_1m: metrics.loadAvg1m,
                            load_avg_5m: metrics.loadAvg5m,
                            load_avg_15m: metrics.loadAvg15m,
                        },
                    }), updatedAt: new Date() } })).then((row: any) => Object.assign(server, row));
            // 检查告警阈值
            const alerts: any = [];
            if (metrics.cpuUsage > parseFloat(server.cpu_threshold)) {
                alerts.push(`CPU使用率 ${metrics.cpuUsage}% 超过阈值 ${server.cpu_threshold}%`);
            }
            if (metrics.memoryUsage > parseFloat(server.memory_threshold)) {
                alerts.push(`内存使用率 ${metrics.memoryUsage}% 超过阈值 ${server.memory_threshold}%`);
            }
            if (metrics.diskUsage > parseFloat(server.disk_threshold)) {
                alerts.push(`磁盘使用率 ${metrics.diskUsage}% 超过阈值 ${server.disk_threshold}%`);
            }
            // 检查端口
            if (server.ports && server.ports.length > 0) {
                for (const portConfig of server.ports) {
                    const portStatus: any = await this.checkPort(server.ip_address, portConfig.port, server.timeout * 1000);
                    // 更新端口状态（checkPort 返回 'open'/'closed'/'timeout'）
                    await Promise.resolve(this.db.owl_server_monitor_ports.update({ where: { id: portConfig.id }, data: { ...({
                                last_check_status: portStatus,
                                last_checked_at: new Date(),
                            }), updatedAt: new Date() } })).then((row: any) => Object.assign(portConfig, row));
                    if (portStatus !== 'open') {
                        alerts.push(`${portConfig.service_name || '服务'} 端口 ${portConfig.port} 无法访问（${portStatus}）`);
                    }
                }
            }
            // 发送告警邮件
            if (alerts.length > 0 && server.alert_enabled) {
                await this.sendAlert(server, alerts);
            }
        }
        catch (err: any) {
            logData.check_status = 'failed';
            logData.error_message = err.message;
            await Promise.resolve(this.db.owl_server_monitors.update({ where: { id: server.id }, data: { ...({
                        status: 'error',
                        last_check_at: new Date(),
                    }), updatedAt: new Date() } })).then((row: any) => Object.assign(server, row));
            // 连接失败也发送告警
            if (server.alert_enabled) {
                await this.sendAlert(server, [`服务器连接失败: ${err.message}`]);
            }
        }
        finally {
            // 保存日志
            await this.db.owl_server_monitor_logs.create({ data: logData });
        }
    }
    /**
     * 发送告警邮件
     * 模块归属：服务器监控 | 使用场景：指标超阈值或端口不通时发送告警
     */
    async sendAlert(server: any, alerts: any): Promise<any> {
        if (!server.alert_recipients || !Array.isArray(server.alert_recipients) || server.alert_recipients.length === 0) {
            return;
        }
        const now: any = new Date();
        const lastAlert: any = this.lastAlertTime.get(server.id);
        const alertInterval: any = (server.alert_interval || 1800) * 1000;
        // 检查告警间隔
        if (lastAlert && (now - lastAlert) < alertInterval) {
            return;
        }
        this.lastAlertTime.set(server.id, now);
        const subject: any = `[监控告警] ${server.name} (${server.ip_address})`;
        const content: any = alerts.join('\n');
        try {
            await this.email.sendAlertEmail({
                templateId: server.alert_template_id || null,
                recipients: server.alert_recipients,
                title: subject,
                content,
            });
        }
        catch (err: any) {
            console.error('发送告警邮件失败:', err);
        }
    }
    /**
     * 启动单个服务器的定时监控
     */
    startMonitoring(serverId: any): any {
        if (this.stopping)
            return;
        if (this.scheduledJobs.has(serverId)) {
            this.stopMonitoring(serverId);
        }
        const job: any = setInterval(() => {
            this.checkServer(serverId).catch(console.error);
        }, 60 * 1000); // 默认每分钟检查一次
        this.scheduledJobs.set(serverId, job);
    }
    /**
     * 停止单个服务器的定时监控
     */
    stopMonitoring(serverId: any): any {
        const job: any = this.scheduledJobs.get(serverId);
        if (job) {
            clearInterval(job);
            this.scheduledJobs.delete(serverId);
        }
    }
    /**
     * 启动所有启用服务器的定时监控
     */
    async startAllMonitoring(): Promise<any> {
        const servers: any = await this.db.owl_server_monitors.findMany({ where: { ...({ enabled: true }), ...live } });
        for (const server of servers) {
            this.startMonitoring(server.id);
        }
    }
    /**
     * 停止所有定时监控
     */
    stopAllMonitoring(): any {
        this.stopping = true;
        for (const [serverId] of this.scheduledJobs) {
            this.stopMonitoring(serverId);
        }
    }
    /**
     * 获取服务器监控日志
     */
    async getServerLogs(serverId: any, filters: any = {}): Promise<any> {
        const { page = 1, limit = 10 }: any = filters;
        const offset: any = (page - 1) * limit;
        const { count, rows }: any = await Promise.all([this.db.owl_server_monitor_logs.count({ where: { ...({ server_id: serverId }), ...live } }), this.db.owl_server_monitor_logs.findMany({ where: { ...({ server_id: serverId }), ...live }, take: Number(limit), skip: Number(offset), orderBy: [{ "createdAt": "desc" }] })]).then(([count, rows]: any) => ({ count, rows }));
        return {
            items: rows,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit),
            },
        };
    }
    /**
     * 启动/停止服务器监控
     */
    async toggleMonitoring(serverId: any): Promise<any> {
        const server: any = await this.db.owl_server_monitors.findFirst({ where: { id: serverId, ...live } });
        if (!server)
            throw new Error('服务器不存在');
        const newEnabled: any = !server.enabled;
        await Promise.resolve(this.db.owl_server_monitors.update({ where: { id: server.id }, data: { ...({ enabled: newEnabled }), updatedAt: new Date() } })).then((row: any) => Object.assign(server, row));
        if (newEnabled) {
            this.startMonitoring(serverId);
        }
        else {
            this.stopMonitoring(serverId);
        }
        return server;
    }
    /**
     * 初始化调度器（应用启动时调用）
     */
    async drain() { await Promise.allSettled([...this.executions.values(), ...this.portChecks]); }
    async initializeScheduledJobs(): Promise<any> {
        this.stopping = false;
        await this.startAllMonitoring();
        console.log('✅ 服务器监控调度器已启动');
    }
    /**
     * 添加服务端口
     */
    async addPort(serverId: any, data: any): Promise<any> {
        const server: any = await this.db.owl_server_monitors.findFirst({ where: { id: serverId, ...live } });
        if (!server)
            throw new Error('服务器不存在');
        const port: any = await this.db.owl_server_monitor_ports.create({ data: {
                ...data,
                server_id: serverId,
            } });
        // 后台执行端口检测，不阻塞返回
        if (port.enabled) {
            const check = this._runInitialPortCheck(server, port).finally(() => this.portChecks.delete(check));
            this.portChecks.add(check);
        }
        return port;
    }
    /**
     * 后台执行端口初始检测（不阻塞主流程）
     */
    async _runInitialPortCheck(server: any, port: any): Promise<any> {
        try {
            const portStatus: any = await this.checkPort(server.ip_address, port.port, server.timeout * 1000);
            await Promise.resolve(this.db.owl_server_monitor_ports.update({ where: { id: port.id }, data: { ...({
                        last_check_status: portStatus,
                        last_checked_at: new Date(),
                    }), updatedAt: new Date() } })).then((row: any) => Object.assign(port, row));
        }
        catch (err: any) {
            // 检测异常时标记为closed，不影响端口已添加的事实
            try {
                await Promise.resolve(this.db.owl_server_monitor_ports.update({ where: { id: port.id }, data: { ...({
                            last_check_status: 'closed',
                            last_checked_at: new Date(),
                        }), updatedAt: new Date() } })).then((row: any) => Object.assign(port, row));
            }
            catch (e: any) {
                // ignore
            }
        }
    }
    /**
     * 更新服务端口
     */
    async updatePort(portId: any, data: any): Promise<any> {
        const port: any = await this.db.owl_server_monitor_ports.findFirst({ where: { id: portId, ...live } });
        if (!port)
            throw new Error('端口配置不存在');
        await Promise.resolve(this.db.owl_server_monitor_ports.update({ where: { id: port.id }, data: { ...(data), updatedAt: new Date() } })).then((row: any) => Object.assign(port, row));
        return port;
    }
    /**
     * 删除服务端口
     */
    async deletePort(portId: any): Promise<any> {
        const port: any = await this.db.owl_server_monitor_ports.findFirst({ where: { id: portId, ...live } });
        if (!port)
            throw new Error('端口配置不存在');
        await this.db.owl_server_monitor_ports.update({ where: { id: port.id }, data: deleted() }); // 软删除
        return true;
    }
}

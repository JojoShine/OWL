import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { live } from '../identity/identity.helpers';
import { shared } from '../compatibility/shared';
const jwt = require('jsonwebtoken');
@Injectable()
export class NotificationSocket {
    constructor(private readonly db: PrismaService) { }
    private get transport() { return shared('notification/socket'); }
    initialize(server: any) { return this.transport.initialize(server, this.authenticateSocket.bind(this)); }
    async authenticateSocket(socket: any, next: (error?: Error) => void) {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token)
                return next(new Error('未提供认证令牌'));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (typeof decoded.id !== 'string' || !decoded.id)
                return next(new Error('认证失败'));
            const user = await this.db.owl_users.findFirst({ where: { id: decoded.id, status: 'active', ...live }, select: { id: true, username: true } });
            if (!user)
                return next(new Error('用户不存在或已被禁用'));
            socket.userId = user.id;
            socket.username = user.username;
            next();
        }
        catch {
            next(new Error('认证失败'));
        }
    }
    isUserOnline(id: string) { return this.transport.isUserOnline(id); }
    pushNotification(id: string, data: any) { return this.transport.pushNotification(id, data); }
    broadcast(event: string, data: any) { return this.transport.broadcast(event, data); }
    async close() { const transport = this.transport; if (transport.io)
        await new Promise<void>(resolve => transport.io.close(() => resolve())); transport.io = null; transport.userSockets.clear(); transport.socketUsers.clear(); }
}

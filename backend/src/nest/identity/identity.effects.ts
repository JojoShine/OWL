import { Injectable } from '@nestjs/common';
import { shared } from '../compatibility/shared';
@Injectable()
export class IdentityEffects {
    private readonly sms = new (shared('utils/sms-verification'))();
    sendSms(phone: string, ip: string) { return this.sms.sendVerificationCode(phone, ip); }
    verifyCaptcha(id: string, code: string) { return shared('auth/captcha').verifyCaptcha(id, code); }
    verifyToken(token: string) { return shared('utils/jwt.util').verifyToken(token); }
    generateToken(user: any) { return shared('utils/jwt.util').generateToken({ id: user.id, username: user.username, email: user.email }); }
    verifySms(phone: string, code: string) { return this.sms.verifyCode(phone, code); }
    location(ip: string) { return shared('utils/geo-ip').getLocationFromIP(ip); }
    kicked(id: string, info: any) {
        try {
            shared('utils/session-handler').notifyKickedSessions(id, info);
        }
        catch (error) {
            shared('config/logger').logger.error('Error notifying kicked sessions', error);
        }
    }
    log(message: string) { shared('config/logger').logger.info(message); }
}

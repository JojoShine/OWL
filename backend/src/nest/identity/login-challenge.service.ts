import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import Joi from 'joi';
import { authRedis, unavailable } from './login-security.service';
const { sm2 } = require('sm-crypto-v2');
const envelopeSchema = Joi.object({
    challengeId: Joi.string().hex().length(64).required(),
    keyId: Joi.string().max(100).required(),
    ciphertext: Joi.string().hex().min(196).max(8192).pattern(/^04/).required(),
    captchaId: Joi.string().max(200).required(),
    captchaCode: Joi.string().max(3).pattern(/^-?\d+$/).required(),
}).unknown(false);
const credentialsSchema = Joi.object({
    username: Joi.string().max(50).required(), password: Joi.string().max(256).required(),
    nonce: Joi.string().hex().length(64).required(), challengeId: Joi.string().hex().length(64).required(),
    purpose: Joi.string().valid('password-login').required(),
}).unknown(false);
function invalid() { return new BadRequestException({errorCode:'AUTH_CHALLENGE_INVALID',message:'登录验证已失效，请重新尝试'}); }
@Injectable()
export class LoginChallengeService {
    private keys() {
        const privateKey = process.env.LOGIN_SM2_PRIVATE_KEY || '';
        const keyId = process.env.LOGIN_SM2_KEY_ID || '';
        if (!/^[a-fA-F0-9]{64}$/.test(privateKey) || !keyId || keyId.length > 100) throw unavailable();
        const value = BigInt(`0x${privateKey}`);
        if (value <= 0n || value >= BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54123')) throw unavailable();
        try { return { privateKey, keyId, publicKey: sm2.getPublicKeyFromPrivateKey(privateKey) }; }
        catch { throw unavailable(); }
    }
    async issue() {
        const { publicKey, keyId } = this.keys();
        const challengeId = randomBytes(32).toString('hex');
        const nonce = randomBytes(32).toString('hex');
        const expiresAt = Date.now() + 60_000;
        const result = await authRedis(client => client.set(`owl:login:challenge:${challengeId}`, JSON.stringify({nonce,keyId,expiresAt}), {NX:true,EX:60}));
        if (result !== 'OK') throw unavailable();
        return {challengeId,nonce,publicKey,keyId,expiresAt};
    }
    async consume(body: any): Promise<{username:string;password:string}> {
        if (body && (Object.hasOwn(body,'username') || Object.hasOwn(body,'password'))) {
            throw new BadRequestException({errorCode:'AUTH_UPGRADE_REQUIRED',message:'登录方式已升级，请刷新页面后重试'});
        }
        if (envelopeSchema.validate(body, {convert:false}).error || !body || body.ciphertext.length % 2) throw invalid();
        const { privateKey, keyId } = this.keys();
        const stored = await authRedis<string | null>(client => client.getDel(`owl:login:challenge:${body.challengeId}`));
        if (!stored) throw invalid();
        try {
            const challenge = JSON.parse(stored);
            if (challenge.expiresAt <= Date.now() || challenge.keyId !== keyId || body.keyId !== keyId) throw invalid();
            const plaintext = sm2.doDecrypt(body.ciphertext.slice(2), privateKey, 1);
            if (!plaintext || Buffer.byteLength(plaintext,'utf8') > 2048) throw invalid();
            const decoded = JSON.parse(plaintext);
            if (credentialsSchema.validate(decoded, {convert:false}).error || decoded.nonce !== challenge.nonce || decoded.challengeId !== body.challengeId) throw invalid();
            return {username:decoded.username,password:decoded.password};
        } catch { throw invalid(); }
    }
}

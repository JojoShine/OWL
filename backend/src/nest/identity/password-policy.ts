import { BadRequestException } from '@nestjs/common';

export function validatePassword(password: string, policy: string) {
    const minimum = { basic: 8, standard: 10, strict: 12 }[policy];
    const categories = typeof password === 'string' ? [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9\s]/u].filter(pattern => pattern.test(password)).length : 0;
    const length = typeof password === 'string' ? [...password].length : 0;
    if (!minimum || length < minimum || length > 50 || Buffer.byteLength(password, 'utf8') > 72 || categories < ({ basic: 0, standard: 2, strict: 3 }[policy] ?? 4)) {
        throw new BadRequestException({ errorCode: 'PASSWORD_POLICY_VIOLATION', message: '密码不符合当前安全规则，请按提示重新设置' });
    }
}


import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { smsAuthApi } from '@/lib/api';
import { useAuth } from '@/lib/utils/auth';
import { getStorageKey } from '@/lib/utils/storage-key';

// 表单验证规则 - 只做最基本的非空检查
const smsLoginSchema = z.object({
  phone: z.string(),
  code: z.string(),
});

export default function SmsLoginForm({ onSuccess }) {
  const { login: authLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [phoneSent, setPhoneSent] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(smsLoginSchema),
  });

  const phone = watch('phone');

  // 发送验证码
  const handleSendCode = async () => {
    try {
      // 先验证手机号格式
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        setError('请输入正确的手机号');
        return;
      }

      setIsLoading(true);
      setError('');

      await smsAuthApi.sendCode(phone);
      
      setPhoneSent(phone);
      setCountdown(60);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setError('');
    } catch (err) {
      console.error('发送验证码失败:', err);
      setError(err.response?.data?.message || '发送失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 短信登录
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');

      const result = await smsAuthApi.login(data);

      if (result.success && result.data) {
        localStorage.setItem(getStorageKey('token'), result.data.token);
        localStorage.setItem(getStorageKey('user'), JSON.stringify(result.data.user));

        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.error || '登录失败，请重试');
      }
    } catch (err) {
      console.error('短信登录错误:', err);
      setError(err.response?.data?.message || '登录失败，请检查验证码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sms-phone">手机号</Label>
          <Controller name={'phone'} control={control} render={({ field: controlledField }) => (
            <Input
              id="sms-phone"
              type="tel"
              placeholder="请输入手机号"
              maxLength={11}
              {...controlledField} value={controlledField.value ?? ""}
              disabled={isLoading || countdown > 0}
            />
          )} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sms-code">验证码</Label>
          <div className="flex gap-2">
            <Controller name={'code'} control={control} render={({ field: controlledField }) => (
              <Input
                id="sms-code"
                type="text"
                placeholder="请输入6位验证码"
                maxLength={6}
                {...controlledField} value={controlledField.value ?? ""}
                disabled={isLoading || !phoneSent}
              />
            )} />
            <Button
              type="button"
              variant="outline"
              onClick={handleSendCode}
              disabled={countdown > 0 || isLoading || !phone}
              className="whitespace-nowrap min-w-[120px] h-10"
            >
              {countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !phoneSent}
        >
          {isLoading ? '登录中...' : '登 录'}
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        首次登录将自动注册账号
      </p>
    </div>
  );
}

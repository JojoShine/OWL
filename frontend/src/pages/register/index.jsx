import { getBasePath } from '@/lib/config/runtime';

import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/navigation';
import { Link } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthShell } from '@/components/auth/auth-shell';
import { authApi, systemConfigApi } from '@/lib/api';
import { getFileUrl } from '@/lib/utils/image';

// 表单验证规则
const registerSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(20, '用户名最多20个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符'),
  confirmPassword: z.string().min(6, '请确认密码'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

const basePath = getBasePath();

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showTechStack, setShowTechStack] = useState(true);
  const [systemName, setSystemName] = useState('Owl管理平台');
  const [logoUrl, setLogoUrl] = useState(`${basePath}/logo.png`);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  // 获取系统配置
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await systemConfigApi.getConfig();
        if (response?.success) {
          setShowTechStack(response.data?.show_tech_stack ?? true);
          setSystemName(response.data?.system_name || 'Owl管理平台');
          // 处理 logo - 支持 Minio 路径和本地路径，空值回退到默认 logo
          setLogoUrl(
            (response.data?.logo_url && getFileUrl(response.data.logo_url)) ||
            `${basePath}/logo.png`
          );
        }
      } catch (error) {
        console.error('Failed to fetch system config:', error);
      }
    };

    fetchConfig();
  }, []);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // 移除confirmPassword字段，只发送必要的数据
      const { confirmPassword, ...registerData } = data;
      const response = await authApi.register(registerData);

      if (response.data) {
        setSuccess(true);
        // 注册成功后，2秒后跳转到登录页
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError('注册失败，请重试');
      }
    } catch (err) {
      console.error('注册错误:', err);
      setError(err.response?.data?.message || '注册失败，请检查输入信息');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      systemName={systemName}
      logoUrl={logoUrl}
      description="创建账号以使用管理平台"
      footer={showTechStack ? 'Powered by TBTParent' : null}
    >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="success">
                <AlertDescription>注册成功，正在跳转到登录页。</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="username">用户名</Label>
              <Controller name={'username'} control={control} render={({ field: controlledField }) => (
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  {...controlledField} value={controlledField.value ?? ""}
                  disabled={isLoading}
                />
              )} />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="email">邮箱</Label>
              <Controller name={'email'} control={control} render={({ field: controlledField }) => (
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱地址"
                  {...controlledField} value={controlledField.value ?? ""}
                  disabled={isLoading}
                />
              )} />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password">密码</Label>
              <Controller name={'password'} control={control} render={({ field: controlledField }) => (
                <PasswordInput
                  id="password"
                  placeholder="请输入密码"
                  {...controlledField} value={controlledField.value ?? ""}
                  disabled={isLoading}
                />
              )} />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Controller name={'confirmPassword'} control={control} render={({ field: controlledField }) => (
                <PasswordInput
                  id="confirmPassword"
                  placeholder="请再次输入密码"
                  {...controlledField} value={controlledField.value ?? ""}
                  disabled={isLoading}
                />
              )} />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || success}
            >
              {isLoading ? '注册中...' : success ? '注册成功' : '注册'}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm">
            <span className="text-muted-foreground">已有账号？</span>
            <Link to="/login" className="text-primary hover:underline ml-1">
              立即登录
            </Link>
          </div>
    </AuthShell>
  );
}

'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { CaptchaInput } from '@/components/ui/captcha-input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loading } from '@/components/ui/loading';
import { AuthShell } from '@/components/auth/auth-shell';
import SmsLoginForm from '@/components/auth/sms-login-form';
import { monitorApi, systemConfigApi } from '@/lib/api';
import { useAuth } from '@/lib/utils/auth';
import { getFileUrl } from '@/lib/utils/image';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: authLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [systemStatus, setSystemStatus] = useState(null);
  const [showTechStack, setShowTechStack] = useState(true);
  const [systemName, setSystemName] = useState('Owl管理平台');
  const [logoUrl, setLogoUrl] = useState(`${basePath}/logo.png`);
  const [loginBgUrl, setLoginBgUrl] = useState('');
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [loginMethod, setLoginMethod] = useState('both'); // 登录方式：password|sms|both
  const [loginLayout, setLoginLayout] = useState('center');
  const [loginTab, setLoginTab] = useState('sms'); // 默认短信登录
  const captchaInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const watchedUsername = watch('username');
  const watchedPassword = watch('password');

  // 获取系统状态和配置
  useEffect(() => {
    const fetchData = async () => {
      try {
        const statusResponse = await monitorApi.getSystemStatus();
        if (statusResponse?.data) {
          setSystemStatus(statusResponse.data);
        }

        const configResponse = await systemConfigApi.getConfig();
        if (configResponse?.success) {
          setShowTechStack(configResponse.data?.show_tech_stack ?? true);
          setSystemName(configResponse.data?.system_name || 'Owl管理平台');
          setRegistrationEnabled(configResponse.data?.registration_enabled ?? true);
          setLoginMethod(configResponse.data?.login_method || 'both');
          setLoginLayout(configResponse.data?.login_layout || 'center');
          // 处理 logo - 支持 Minio 路径和本地路径，空值回退到默认 logo
          setLogoUrl(
            (configResponse.data?.logo_url && getFileUrl(configResponse.data.logo_url)) ||
            `${basePath}/logo.png`
          );
          // 处理登录背景 - 支持 Minio 路径和本地路径
          if (configResponse.data?.login_bg_url) {
            setLoginBgUrl(getFileUrl(configResponse.data.login_bg_url));
          }
          
          // 根据配置的登录方式设置默认Tab
          if (configResponse.data?.login_method === 'password') {
            setLoginTab('password');
          } else if (configResponse.data?.login_method === 'sms') {
            setLoginTab('sms');
          }
        }
      } catch (error) {
        console.error('获取系统信息失败:', error);
      }
    };

    fetchData();
  }, []);

  // 验证码变化回调
  const handleCaptchaChange = (id, code) => {
    setCaptchaId(id);
    setCaptchaCode(code);
    setValue('captchaCode', code);
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');

      // 检查验证码是否已加载
      if (!captchaId) {
        setError('验证码未加载完成，请稍候重试');
        setIsLoading(false);
        return;
      }

      // 添加验证码信息
      const loginData = {
        ...data,
        captchaId,
        captchaCode,
      };

      // 使用AuthProvider的login方法（会自动保存token和更新状态）
      const result = await authLogin(loginData);

      if (result.success) {
        const rawRedirect = searchParams.get('redirect') || '/dashboard';
        const redirectPath = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
          ? rawRedirect
          : '/dashboard';
        router.push(redirectPath);
      } else {
        setError(result.error || '登录失败，请重试');
        setIsLoading(false);
        // 登录失败后刷新验证码
        captchaInputRef.current?.refresh();
      }
    } catch (err) {
      console.error('登录错误:', err);
      setError(err.response?.data?.message || '登录失败，请检查用户名和密码');
      setIsLoading(false);
      // 登录失败后刷新验证码
      captchaInputRef.current?.refresh();
    }
  };

  return (
    <AuthShell
      systemName={systemName}
      logoUrl={logoUrl}
      description="请输入您的账号信息登录系统"
      backgroundUrl={loginBgUrl}
      layout={loginLayout}
      footer={showTechStack ? 'Powered by TBTParent' : null}
    >
        {systemStatus && !systemStatus.redis?.available && (
          <Alert className="mb-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
            <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
              ℹ️ {systemStatus.redis.message}
            </AlertDescription>
          </Alert>
        )}
        
        {/* 登录方式Tab切换 */}
        <Tabs value={loginTab} onValueChange={setLoginTab} className="w-full">
          {/* 根据配置显示Tab */}
          {loginMethod === 'both' && (
            <TabsList stretch className="mb-6">
              <TabsTrigger value="sms">短信登录</TabsTrigger>
              <TabsTrigger value="password">密码登录</TabsTrigger>
            </TabsList>
          )}
          
          {/* 短信登录 */}
          {(loginMethod === 'sms' || loginMethod === 'both') && (
            <TabsContent value="sms">
              <SmsLoginForm onSuccess={() => {
                const rawRedirect = searchParams.get('redirect') || '/dashboard';
                const redirectPath = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
                  ? rawRedirect
                  : '/dashboard';
                window.location.href = `${basePath}${redirectPath}`;
              }} />
            </TabsContent>
          )}
          
          {/* 密码登录 */}
          {(loginMethod === 'password' || loginMethod === 'both') && (
            <TabsContent value="password">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2.5">
                  <Label htmlFor="username">用户名或邮箱</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名或邮箱"
                    {...register('username')}
                    disabled={isLoading}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500">{errors.username.message}</p>
                  )}
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="password">密码</Label>
                  <PasswordInput
                    id="password"
                    placeholder="请输入密码"
                    showStrength={true}
                    {...register('password')}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>
                <CaptchaInput
                  ref={captchaInputRef}
                  onCaptchaChange={handleCaptchaChange}
                  error={errors.captchaCode?.message}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !watchedUsername || !watchedPassword}
                >
                  {isLoading ? '登录中...' : '登录'}
                </Button>
              </form>
              {registrationEnabled && (
                <div className="mt-4 text-center text-sm">
                  <span className="text-muted-foreground">还没有账号？</span>
                  <Link href="/register" className="text-primary hover:underline ml-1">
                    立即注册
                  </Link>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loading size="lg" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

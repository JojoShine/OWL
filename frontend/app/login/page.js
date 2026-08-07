'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { CaptchaInput } from '@/components/ui/captcha-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/layout/theme/theme-toggle';
import SmsLoginForm from '@/components/auth/sms-login-form';
import { authApi, monitorApi, systemConfigApi } from '@/lib/api';
import { useAuth } from '@/lib/utils/auth';
import { getFileUrl } from '@/lib/utils/image';
import { getPath } from '@/lib/utils/api-url';

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

  const isSplitLayout = loginLayout === 'left-image' || loginLayout === 'right-image';

  const loginCard = (
    <Card className={`w-full max-w-md bg-[#fafafa] dark:bg-[#1a1a1a] border-0 shadow-none ${loginBgUrl && loginLayout === 'center' ? 'bg-opacity-90' : ''} ${isSplitLayout ? 'border-0 shadow-none' : ''}`}>
      <CardHeader className="space-y-4">
        <div className="flex justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              width={64}
              height={64}
              className="rounded-lg dark:invert"
            />
          ) : null}
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          {systemName}
        </CardTitle>
        <CardDescription className="text-center">
          请输入您的账号信息登录系统
        </CardDescription>
        {showTechStack && (
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Badge variant="secondary">Next.js</Badge>
            <Badge variant="secondary">React</Badge>
            <Badge variant="secondary">Tailwind CSS</Badge>
            <Badge variant="secondary">Node.js</Badge>
            <Badge variant="secondary">PostgreSQL</Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
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
            <TabsList className="grid w-full grid-cols-2 mb-6">
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
                    {error}
                  </div>
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
      </CardContent>
    </Card>
  );

  // 左右布局：图片区域
  const imagePanel = loginBgUrl ? (
    <div
      className="h-full bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBgUrl})` }}
    />
  ) : (
    <div className="h-full bg-gradient-to-br from-primary/20 to-primary/5" />
  );

  if (loginLayout === 'left-image' || loginLayout === 'right-image') {
    return (
      <div className="min-h-screen flex bg-background">
        <div className="absolute right-6 top-6 z-10">
          <ThemeToggle />
        </div>
        {loginLayout === 'left-image' ? (
          <>
            <div className="w-1/3 min-h-screen">{imagePanel}</div>
            <div className="w-2/3 flex items-center justify-center p-8">{loginCard}</div>
          </>
        ) : (
          <>
            <div className="w-2/3 flex items-center justify-center p-8">{loginCard}</div>
            <div className="w-1/3 min-h-screen">{imagePanel}</div>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background p-4 relative"
      style={{
        backgroundImage: loginBgUrl ? `url(${loginBgUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      {loginCard}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

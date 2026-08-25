'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const PasswordInput = React.forwardRef(
  ({ className, showStrength = false, onChange, value: propValue, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState('');
    const [strength, setStrength] = React.useState(0);

    // 获取当前值（优先使用外部传入的value）
    const currentValue = propValue !== undefined ? propValue : internalValue;

    // 计算密码强度
    React.useEffect(() => {
      if (!currentValue || currentValue.length === 0) {
        setStrength(0);
        return;
      }

      let score = 0;
      const hasLower = /[a-z]/.test(currentValue);
      const hasUpper = /[A-Z]/.test(currentValue);
      const hasDigit = /\d/.test(currentValue);
      const hasSpecial = /[^A-Za-z0-9]/.test(currentValue);
      const length = currentValue.length;

      // 长度评分（更严格）
      if (length >= 8) score += 1;
      if (length >= 12) score += 1;
      if (length >= 16) score += 1;

      // 字符类型组合评分（更严格）
      const typeCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
      
      if (typeCount >= 2) score += 1;  // 至少2种类型
      if (typeCount >= 3) score += 1;  // 至少3种类型
      if (typeCount === 4 && length >= 12) score += 1;  // 4种类型且长度>=12

      // 归一化到 1-4，但至少为1（只要有输入就显示强度）
      setStrength(Math.max(1, Math.min(score, 4)));
    }, [currentValue]);

    // 获取强度对应的颜色
    const getStrengthColor = () => {
      if (strength === 0) return '';
      if (strength <= 1) return 'focus-visible:border-red-500 border-red-500';
      if (strength === 2) return 'focus-visible:border-orange-500 border-orange-500';
      if (strength === 3) return 'focus-visible:border-yellow-500 border-yellow-500';
      return 'focus-visible:border-green-500 border-green-500';
    };

    // 获取强度对应的文本
    const getStrengthText = () => {
      if (strength === 0) return '';
      if (strength <= 1) return '弱';
      if (strength === 2) return '一般';
      if (strength === 3) return '较强';
      return '强';
    };

    // 获取强度对应的颜色类
    const getStrengthTextColor = () => {
      if (strength === 0) return '';
      if (strength <= 1) return 'text-red-500';
      if (strength === 2) return 'text-orange-500';
      if (strength === 3) return 'text-yellow-500';
      return 'text-green-500';
    };

    // 处理输入变化
    const handleChange = (e) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className={cn(
              'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-10 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 pr-10 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
              'focus-visible:border-primary focus-visible:ring-0',
              'aria-invalid:border-destructive',
              currentValue && strength > 0 && getStrengthColor(),
              className
            )}
            ref={ref}
            {...props}
            value={propValue !== undefined ? propValue : internalValue}
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
          >
            {showPassword ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {/* 密码强度提示 */}
        {showStrength && currentValue && currentValue.length > 0 && (
          <div className="mt-1.5 flex gap-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  level <= strength
                    ? strength <= 1
                      ? 'bg-red-500'
                      : strength === 2
                      ? 'bg-orange-500'
                      : strength === 3
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                    : 'bg-muted'
                )}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };

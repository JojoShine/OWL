
import * as React from 'react';
import { Input as AntInput, Button as AntButton } from 'antd';
import './antd-controls.css';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const PasswordInput = React.forwardRef(
  ({ className, showStrength = false, onChange, value: propValue, defaultValue = '', ...props }, ref) => {
    const nativeRef = React.useCallback((instance) => {
      const element = instance?.input ?? null;
      const cleanup = typeof ref === 'function' ? ref(element) : undefined;
      if (ref && typeof ref !== 'function') ref.current = element;
      return cleanup;
    }, [ref]);
    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(defaultValue);
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

    const strengthId = React.useId();
    const strengthLabels = ['', '弱', '一般', '较强', '强'];
    const strengthColors = ['', 'bg-rose-500/75', 'bg-amber-500/75', 'bg-teal-600/65 dark:bg-teal-400/65', 'bg-teal-600/80 dark:bg-teal-400/80'];
    const showStrengthHint = showStrength && currentValue?.length > 0;

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
          <AntInput
            type={showPassword ? 'text' : 'password'}
            className={cn(
              'owl-input owl-password-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-10 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 pr-10 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
              'focus-visible:border-primary focus-visible:ring-0 dark:focus-visible:border-ring',
              'aria-invalid:border-destructive',
              className
            )}
            ref={nativeRef}
            {...props}
            aria-describedby={[props['aria-describedby'], showStrengthHint ? strengthId : null].filter(Boolean).join(' ') || undefined}
            value={propValue !== undefined ? propValue : internalValue}
            onChange={handleChange}
          />
          <AntButton
            type="text" htmlType="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            className="owl-password-toggle absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
          >
            {showPassword ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </AntButton>
        </div>
        
        {showStrengthHint && (
          <div id={strengthId} className="mt-2 flex items-center gap-2 text-xs leading-5 text-muted-foreground">
            <span>密码强度</span>
            <div
              role="meter"
              aria-label="密码强度"
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={strength}
              aria-valuetext={strengthLabels[strength]}
              className="h-1 w-20 overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn('h-full rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none', strengthColors[strength])}
                style={{ width: `${strength * 25}%` }}
              />
            </div>
            <span className="font-medium text-foreground/75">{strengthLabels[strength]}</span>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };

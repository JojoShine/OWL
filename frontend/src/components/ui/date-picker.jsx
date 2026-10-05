import * as React from 'react';
import { DatePicker as AntDatePicker } from 'antd';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/zh_CN';
import { cn } from '@/lib/utils';
import './antd-controls.css';

export function DatePicker({ value, onChange, placeholder = '选择日期', className, ...props }) {
  const date = value ? dayjs(value) : null;
  return <AntDatePicker locale={locale} className={cn('owl-date-picker w-full h-10', className)} value={date?.isValid() ? date : null} format="YYYY-MM-DD" placeholder={placeholder} onChange={(_, text) => onChange?.({ target: { value: text || '' } })} {...props} />;
}

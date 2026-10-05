import * as React from 'react';
import { DatePicker as AntDatePicker } from 'antd';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/zh_CN';
import { cn } from '@/lib/utils';
import './antd-controls.css';

export function DateTimePicker({ value, onChange, placeholder = '选择日期和时间', className, showTime = true, ...props }) {
  const date = value ? dayjs(value) : null;
  return <AntDatePicker locale={locale} className={cn('owl-date-picker w-full h-10', className)} value={date?.isValid() ? date : null} showTime={showTime ? { format: 'HH:mm' } : false} format={showTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'} placeholder={placeholder} onChange={(next) => onChange?.({ target: { value: next ? next.second(0).format('YYYY-MM-DD HH:mm:ss') : '' } })} {...props} />;
}

import * as React from 'react';
import { Calendar as AntCalendar } from 'antd';
import dayjs from 'dayjs';
import locale from 'antd/es/calendar/locale/zh_CN';
import { cn } from '@/lib/utils';

function Calendar({ className, selected, onSelect, disabled, mode, classNames, showOutsideDays, initialFocus, locale: ignoredLocale, ...props }) {
  return <AntCalendar fullscreen={false} locale={locale} className={cn('w-72', className)} value={selected ? dayjs(selected) : undefined} disabledDate={typeof disabled === 'function' ? (date) => disabled(date.toDate()) : disabled === true ? () => true : undefined} onSelect={(date, info) => { if (info.source === 'date') onSelect?.(date.toDate()); }} {...props} />;
}
export { Calendar };

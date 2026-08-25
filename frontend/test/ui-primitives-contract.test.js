import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}));

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const h = React.createElement;

describe('neutral UI primitive contract', () => {
  it('renders form controls with a 40px default and a single primary focus border', () => {
    render(
      h(
        React.Fragment,
        null,
        h(Input, { 'aria-label': '用户名' }),
        h(PasswordInput, { 'aria-label': '密码' }),
        h(Textarea, { 'aria-label': '说明' }),
        h(
          Select,
          null,
          h(SelectTrigger, { 'aria-label': '角色' }, h(SelectValue, { placeholder: '选择角色' }))
        )
      )
    );

    const controls = [
      screen.getByRole('textbox', { name: '用户名' }),
      screen.getByLabelText('密码'),
      screen.getByRole('textbox', { name: '说明' }),
      screen.getByRole('combobox', { name: '角色' }),
    ];

    expect(controls[0]).toHaveClass('h-10');
    expect(controls[1]).toHaveClass('h-10');
    expect(controls[3]).toHaveClass('data-[size=default]:h-10');

    for (const control of controls) {
      expect(control).toHaveClass('focus-visible:border-primary', 'focus-visible:ring-0');
      expect(control.className).not.toMatch(/focus-visible:ring-(?:\[3px\]|2)/);
      expect(control).not.toHaveClass('focus-visible:border-foreground');
    }
  });

  it('renders cards and tabs as restrained neutral surfaces', () => {
    render(
      h(
        React.Fragment,
        null,
        h(Card, null, '内容'),
        h(
          Tabs,
          { defaultValue: 'first' },
          h(
            TabsList,
            null,
            h(TabsTrigger, { value: 'first' }, '第一项'),
            h(TabsTrigger, { value: 'second' }, '第二项')
          )
        )
      )
    );

    expect(screen.getByText('内容')).toHaveClass('gap-5', 'rounded-lg', 'border', 'py-5');
    expect(screen.getByText('内容')).not.toHaveClass('shadow-sm');

    const tabsList = screen.getByRole('tablist');
    const activeTab = screen.getByRole('tab', { name: '第一项' });
    expect(tabsList).toHaveClass('bg-muted', 'h-10', 'rounded-lg');
    expect(activeTab).toHaveClass(
      'data-[state=active]:bg-background',
      'data-[state=active]:text-foreground',
      'data-[state=active]:shadow-[0_1px_2px_rgba(16,24,40,0.06)]'
    );
    expect(activeTab).not.toHaveClass('data-[state=active]:bg-primary');
  });

  it('uses the softened overlay while preserving non-input focus affordances', () => {
    render(
      h(
        React.Fragment,
        null,
        h(
          Dialog,
          { open: true },
          h(
            DialogContent,
            null,
            h(DialogTitle, null, '编辑用户'),
            h(DialogDescription, null, '更新用户资料。')
          )
        ),
        h(Button, null, '保存'),
        h(Checkbox, { 'aria-label': '同意条款' }),
        h(RadioGroup, { defaultValue: 'first' }, h(RadioGroupItem, { value: 'first', 'aria-label': '选项一' })),
        h(Slider, { 'aria-label': '音量', defaultValue: [50] })
      )
    );

    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass(
      'bg-slate-950/35',
      'backdrop-blur-[1px]'
    );
    expect(document.querySelector('[data-slot="button"]')).toHaveClass(
      'duration-150',
      'active:translate-y-px',
      'focus-visible:ring-[3px]'
    );
    expect(document.querySelector('[role="checkbox"]')).toHaveClass('focus-visible:ring-2');
    expect(document.querySelector('[role="radio"]')).toHaveClass('focus-visible:ring-2');
    expect(document.querySelector('[role="slider"]')).toHaveClass('focus-visible:ring-2');
  });

  it('keeps semantic badge variants distinct', () => {
    render(
      h(
        React.Fragment,
        null,
        h(Badge, { variant: 'success' }, '成功'),
        h(Badge, { variant: 'warning' }, '警告'),
        h(Badge, { variant: 'info' }, '信息'),
        h(Badge, { variant: 'destructive' }, '危险'),
        h(Badge, { variant: 'neutral' }, '中性')
      )
    );

    expect(screen.getByText('成功')).toHaveClass('bg-emerald-50');
    expect(screen.getByText('警告')).toHaveClass('bg-amber-50');
    expect(screen.getByText('信息')).toHaveClass('bg-blue-50');
    expect(screen.getByText('危险')).toHaveClass('bg-destructive');
    expect(screen.getByText('中性')).toHaveClass('bg-muted');
  });

  it('keeps the password visibility toggle in the keyboard tab order with visible focus', async () => {
    const user = userEvent.setup();

    render(h(PasswordInput, { 'aria-label': '密码' }));

    const password = screen.getByLabelText('密码');
    const toggle = screen.getByRole('button');

    await user.tab();
    expect(password).toHaveFocus();

    await user.tab();
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-ring/50');
  });
});

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import ZabbixInstallGuide from './ZabbixInstallGuide';

beforeAll(() => vi.stubGlobal('React', React));
afterAll(() => vi.unstubAllGlobals());

vi.mock('@/lib/utils', async () => {
  const { cn } = await import('@/lib/utils/cn');
  return { cn };
});

describe('ZabbixInstallGuide category navigation', () => {
  it('uses shrinking grid tracks and keeps category selection working', async () => {
    const user = userEvent.setup();
    render(<ZabbixInstallGuide open onOpenChange={() => {}} />);

    const labels = ['Server', 'Agent', '中间件'];
    const buttons = labels.map((label) => screen.getByRole('button', { name: label }));
    const categoryNavigation = buttons[0].parentElement;

    expect(categoryNavigation).toHaveClass('grid', 'w-full', 'grid-cols-3');
    buttons.forEach((button, index) => {
      expect(button).toHaveClass('min-w-0');
      expect(within(button).getByText(labels[index])).toHaveClass('truncate');
    });

    await user.click(buttons[2]);
    expect(screen.getByRole('heading', { name: '中间件/服务监控配置' })).toBeInTheDocument();
  });
});

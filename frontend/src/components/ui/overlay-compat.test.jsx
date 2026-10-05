import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from './dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
vi.mock('@/lib/utils', async () => { const { cn } = await import('@/lib/utils/cn'); return { cn }; });
describe('Ant compound overlays', () => {
  it('selects a radio menu item and closes the dropdown', async () => {
    const change = vi.fn();
    render(<DropdownMenu><DropdownMenuTrigger>Theme</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuRadioGroup value="light" onValueChange={change}><DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>);
    fireEvent.click(screen.getByText('Theme'));
    fireEvent.click(await screen.findByText('Dark'));
    expect(change).toHaveBeenCalledWith('dark');
    await waitFor(() => expect(screen.queryByText('Dark')).not.toBeInTheDocument());
  });
  it('keeps menu items actionable inside a scrolling layout wrapper', async () => {
    const select = vi.fn();
    render(<DropdownMenu><DropdownMenuTrigger>Notifications</DropdownMenuTrigger><DropdownMenuContent><div className="max-h-[400px]"><DropdownMenuItem onSelect={select}>Read notification</DropdownMenuItem></div></DropdownMenuContent></DropdownMenu>);
    fireEvent.click(screen.getByText('Notifications'));
    fireEvent.click(await screen.findByText('Read notification'));
    expect(select).toHaveBeenCalledTimes(1);
  });
  it('retains a dropdown when selection prevents closing', async () => {
    render(<DropdownMenu><DropdownMenuTrigger>Actions</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={(e) => e.preventDefault()}>Keep open</DropdownMenuItem></DropdownMenuContent></DropdownMenu>);
    fireEvent.click(screen.getByText('Actions'));
    fireEvent.click(await screen.findByText('Keep open'));
    await waitFor(() => expect(screen.getByText('Keep open')).toBeVisible());
  });
  it('switches panels when the tab list is nested in layout markup', () => {
    render(<Tabs defaultValue="one"><header><TabsList><TabsTrigger value="one">One</TabsTrigger><TabsTrigger value="two">Two</TabsTrigger></TabsList></header><TabsContent value="one">First panel</TabsContent><TabsContent value="two">Second panel</TabsContent></Tabs>);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('First panel');
    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Second panel');
  });
  it('keeps a popover open while interacting with its content', async () => {
    render(<Popover><PopoverTrigger>Calendar</PopoverTrigger><PopoverContent><button>Pick date</button></PopoverContent></Popover>);
    fireEvent.click(screen.getByText('Calendar'));
    fireEvent.click(await screen.findByText('Pick date'));
    await waitFor(() => expect(screen.getByText('Pick date')).toBeVisible());
    fireEvent.keyDown(screen.getByText('Pick date'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByText('Pick date')).not.toBeInTheDocument());
  });
});

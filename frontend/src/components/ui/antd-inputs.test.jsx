import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './input';
import { Checkbox } from './checkbox';
import { Switch } from './switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';
import { PasswordInput } from './password-input';
import { Button } from './button';
import { MemoryRouter, Link, useLocation } from 'react-router-dom';
import { DatePicker } from './date-picker';
import { DateTimePicker } from './date-time-picker';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './table';
describe('Ant Design input compatibility', () => {
  it('uses Ant inputs while forwarding native input changes', () => {
    const change = vi.fn(); render(<Input aria-label="Name" onChange={change} />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveClass('ant-input');
    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(change.mock.calls[0][0].target.value).toBe('Alice');
  });
  it('adapts boolean checked callbacks', () => {
    const check = vi.fn(); const toggle = vi.fn();
    render(<><Checkbox aria-label="Check" onCheckedChange={check} /><Switch aria-label="Toggle" onCheckedChange={toggle} /></>);
    fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('switch'));
    expect(check).toHaveBeenCalledWith(true); expect(toggle).toHaveBeenCalledWith(true);
  });
  it('renders compound select options through Ant Select', () => {
    render(<Select value="a"><SelectTrigger aria-label="Choice"><SelectValue placeholder="Choose" /></SelectTrigger><SelectContent><SelectItem value="a">Alpha</SelectItem></SelectContent></Select>);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Choice');
    expect(screen.getByText('Alpha').closest('.ant-select')).not.toBeNull();
  });
  it('keeps password visibility and subtle strength accessible', () => {
    render(<PasswordInput aria-label="Password" value="abc" showStrength />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: '显示密码' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '1');
  });
  it('renders asChild anchors without nesting interactive elements', () => {
    render(<Button asChild><a href="/dashboard">Home</a></Button>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/dashboard');
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Ant Design data control compatibility', () => {
  it('changes compound select values through the options popup', () => {
    const change = vi.fn();
    render(<Select onValueChange={change}><SelectTrigger aria-label="Selection"><SelectValue placeholder="Choose" /></SelectTrigger><SelectContent><SelectItem value="a">Alpha</SelectItem><SelectItem value="b">Beta</SelectItem></SelectContent></Select>);
    const combo = screen.getByRole('combobox');
    fireEvent.mouseDown(combo);
    fireEvent.click(screen.getByText('Beta'));
    expect(change).toHaveBeenCalledWith('b');
  });
  it('preserves date input values and emits the existing event shape on clear', () => {
    const change = vi.fn();
    render(<DatePicker value="2026-10-05" onChange={change} />);
    expect(screen.getByDisplayValue('2026-10-05')).toBeInTheDocument();
    fireEvent.mouseDown(document.querySelector('.ant-picker-clear'));
    fireEvent.mouseUp(document.querySelector('.ant-picker-clear'));
    fireEvent.click(document.querySelector('.ant-picker-clear'));
    expect(change).toHaveBeenCalledWith({ target: { value: '' } });
  });
  it('displays datetime values in local time', () => {
    render(<DateTimePicker value="2026-10-05 15:30:00" />);
    expect(screen.getByDisplayValue('2026-10-05 15:30')).toBeInTheDocument();
  });
  it('preserves compound table content, column spans and row actions', () => {
    const click = vi.fn();
    render(<Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead></TableRow></TableHeader><TableBody><TableRow onClick={click}><TableCell colSpan={2}>Alice</TableCell></TableRow></TableBody></Table>);
    expect(screen.getByRole('table').closest('.ant-table')).not.toBeNull();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    const cell = screen.getByRole('cell', { name: 'Alice' });
    expect(cell).toHaveAttribute('colspan', '2');
    fireEvent.click(cell); expect(click).toHaveBeenCalledOnce();
  });
});

it('preserves client-side navigation for asChild router links', () => {
  function Location() { return <output aria-label="Location">{useLocation().pathname}</output>; }
  render(<MemoryRouter><Button asChild><Link to="/dashboard">Dashboard</Link></Button><Location /></MemoryRouter>);
  fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }));
  expect(screen.getByLabelText('Location')).toHaveTextContent('/dashboard');
});

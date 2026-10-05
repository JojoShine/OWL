import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Controller, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './input';
import { Textarea } from './textarea';
import { PasswordInput } from './password-input';

function ControlledForm({ Component, onSubmit }) {
  const { control, reset, setValue, handleSubmit } = useForm({ defaultValues: { field: 'original' } });
  return <form onSubmit={handleSubmit(onSubmit)}>
    <Controller name="field" control={control} render={({ field }) => <Component aria-label="Field" {...field} />} />
    <button type="button" onClick={() => reset({ field: 'reset value' })}>Reset</button>
    <button type="button" onClick={() => setValue('field', 'set value')}>Set value</button>
    <button type="submit">Submit</button>
  </form>;
}

describe.each([['Input', Input], ['Textarea', Textarea], ['PasswordInput', PasswordInput]])('%s controlled form compatibility', (_, Component) => {
  it('renders defaults, submits edits, and tracks reset and setValue', async () => {
    const user = userEvent.setup(); const submit = vi.fn();
    render(<ControlledForm Component={Component} onSubmit={submit} />);
    const input = screen.getByLabelText('Field');
    expect(input).toHaveValue('original');
    await user.clear(input); await user.type(input, 'changed');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(submit.mock.calls[0]?.[0]).toEqual({ field: 'changed' }));
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(input).toHaveValue('reset value');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(submit.mock.calls[1]?.[0]).toEqual({ field: 'reset value' }));
    await user.click(screen.getByRole('button', { name: 'Set value' }));
    expect(input).toHaveValue('set value');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(submit.mock.calls[2]?.[0]).toEqual({ field: 'set value' }));
  });
  it('exposes the native element through an object ref', () => {
    const ref = React.createRef(); render(<Component ref={ref} aria-label="Field" />);
    expect(ref.current).toBe(screen.getByLabelText('Field'));
  });
});

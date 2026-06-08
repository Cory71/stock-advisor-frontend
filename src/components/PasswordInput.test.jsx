// Component test for <PasswordInput /> — the eye toggle flips the input between
// hidden and visible, and extra props pass through to the underlying input.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordInput from './PasswordInput';

describe('<PasswordInput />', () => {
  it('hides the password by default with a "Show password" toggle', () => {
    const { container } = render(<PasswordInput value="secret" onChange={() => {}} />);
    expect(container.querySelector('input')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
  });

  it('reveals then re-hides the password when the toggle is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<PasswordInput value="secret" onChange={() => {}} />);
    const input = container.querySelector('input');

    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /hide password/i }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('passes extra props through to the input', () => {
    const { container } = render(
      <PasswordInput value="" onChange={() => {}} required minLength={6} />
    );
    const input = container.querySelector('input');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('minLength', '6');
  });

  it('does not submit a surrounding form when the toggle is clicked', async () => {
    const user = userEvent.setup();
    let submitted = false;
    render(
      <form onSubmit={(e) => { e.preventDefault(); submitted = true; }}>
        <PasswordInput value="secret" onChange={() => {}} />
      </form>
    );
    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(submitted).toBe(false);
  });
});

// Unit tests for the pure grade-display helpers.
// Run with: npm test

import { describe, it, expect } from 'vitest';
import { gradeColor, gradeValue, gradeChange, formatPrice } from './grade';

describe('gradeColor', () => {
  it('returns success for A', () => {
    expect(gradeColor('A')).toBe('success');
  });

  it('returns primary for B', () => {
    expect(gradeColor('B')).toBe('primary');
  });

  it('returns warning for C and D', () => {
    expect(gradeColor('C')).toBe('warning');
    expect(gradeColor('D')).toBe('warning');
  });

  it('returns danger for F', () => {
    expect(gradeColor('F')).toBe('danger');
  });

  it('returns secondary for anything unexpected', () => {
    expect(gradeColor('N/A')).toBe('secondary');
    expect(gradeColor(null)).toBe('secondary');
    expect(gradeColor(undefined)).toBe('secondary');
  });
});

describe('gradeValue', () => {
  it('maps A through F to 5..1', () => {
    expect(gradeValue('A')).toBe(5);
    expect(gradeValue('B')).toBe(4);
    expect(gradeValue('C')).toBe(3);
    expect(gradeValue('D')).toBe(2);
    expect(gradeValue('F')).toBe(1);
  });

  it('returns null for non-grades', () => {
    expect(gradeValue('N/A')).toBeNull();
    expect(gradeValue(null)).toBeNull();
    expect(gradeValue('X')).toBeNull();
  });
});

describe('gradeChange', () => {
  it('marks an upgrade when the current grade is higher', () => {
    const change = gradeChange('B', 'A');
    expect(change).toEqual({ label: 'Upgraded', symbol: '▲', variant: 'success' });
  });

  it('marks a downgrade when the current grade is lower', () => {
    const change = gradeChange('B', 'D');
    expect(change).toEqual({ label: 'Downgraded', symbol: '▼', variant: 'danger' });
  });

  it('marks no change when grades match', () => {
    const change = gradeChange('B', 'B');
    expect(change).toEqual({ label: 'No change', symbol: '—', variant: 'secondary' });
  });

  it('returns null when either grade is missing (legacy row)', () => {
    expect(gradeChange(null, 'A')).toBeNull();
    expect(gradeChange('A', null)).toBeNull();
    expect(gradeChange(null, null)).toBeNull();
  });
});

describe('formatPrice', () => {
  it('formats price + currency together', () => {
    expect(formatPrice(310.61, 'USD')).toBe('$310.61 USD');
  });

  it('drops the currency when missing', () => {
    expect(formatPrice(310.6, null)).toBe('$310.60');
    expect(formatPrice(310.6, undefined)).toBe('$310.60');
  });

  it('always shows 2 decimal places', () => {
    expect(formatPrice(7, 'USD')).toBe('$7.00 USD');
    expect(formatPrice(1234.5, 'CAD')).toBe('$1234.50 CAD');
  });

  it('returns "—" when there is no price', () => {
    expect(formatPrice(null, 'USD')).toBe('—');
    expect(formatPrice(undefined, 'USD')).toBe('—');
  });
});

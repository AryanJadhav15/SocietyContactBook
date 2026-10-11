import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import TimeSelect, { parseTime } from './TimeSelect.jsx';

afterEach(() => {
  cleanup();
});

describe('parseTime helper', () => {
  it('parses standard 12-hour strings with minutes', () => {
    expect(parseTime('9:00 AM')).toEqual({ hour: '9', minute: '0', period: 'AM' });
    expect(parseTime('12:30 PM')).toEqual({ hour: '12', minute: '30', period: 'PM' });
    expect(parseTime('5:45 PM')).toEqual({ hour: '5', minute: '45', period: 'PM' });
    expect(parseTime('8:05 AM')).toEqual({ hour: '8', minute: '5', period: 'AM' });
    expect(parseTime('11:60 PM')).toEqual({ hour: '11', minute: '60', period: 'PM' });
  });

  it('parses strings without minutes or with single digit hours', () => {
    expect(parseTime('9 AM')).toEqual({ hour: '9', minute: '0', period: 'AM' });
    expect(parseTime('11 PM')).toEqual({ hour: '11', minute: '0', period: 'PM' });
    expect(parseTime('08:00 AM')).toEqual({ hour: '8', minute: '0', period: 'AM' });
  });

  it('handles empty or null values gracefully', () => {
    expect(parseTime('')).toEqual({ hour: '', minute: '0', period: 'AM' });
    expect(parseTime(null)).toEqual({ hour: '', minute: '0', period: 'AM' });
    expect(parseTime(undefined)).toEqual({ hour: '', minute: '0', period: 'AM' });
  });
});

describe('TimeSelect component', () => {
  it('renders hour options 1 to 12, minute options 1 to 60, and AM/PM options', () => {
    render(<TimeSelect value="" onChange={vi.fn()} />);

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(3);

    const [hourSelect, minuteSelect, periodSelect] = selects;

    // Check options 1 to 12 exist in hour select
    for (let i = 1; i <= 12; i++) {
      expect(hourSelect.querySelector(`option[value="${i}"]`)).toBeTruthy();
    }

    // Check minute 0 and 1 to 60 exist in minute select
    expect(minuteSelect.querySelector('option[value="0"]')).toBeTruthy();
    for (let m = 1; m <= 60; m++) {
      expect(minuteSelect.querySelector(`option[value="${m}"]`)).toBeTruthy();
    }

    // Check AM and PM exist in period select
    expect(periodSelect.querySelector('option[value="AM"]')).toBeTruthy();
    expect(periodSelect.querySelector('option[value="PM"]')).toBeTruthy();
  });

  it('correctly sets selected values from prop', () => {
    render(<TimeSelect value="10:35 PM" onChange={vi.fn()} />);

    const [hourSelect, minuteSelect, periodSelect] = screen.getAllByRole('combobox');
    expect(hourSelect.value).toBe('10');
    expect(minuteSelect.value).toBe('35');
    expect(periodSelect.value).toBe('PM');
  });

  it('calls onChange with formatted time when hour is selected', () => {
    const handleChange = vi.fn();
    render(<TimeSelect value="" onChange={handleChange} />);

    const [hourSelect] = screen.getAllByRole('combobox');
    fireEvent.change(hourSelect, { target: { value: '9' } });

    expect(handleChange).toHaveBeenCalledWith('9:00 AM');
  });

  it('calls onChange with updated minute when minute is changed', () => {
    const handleChange = vi.fn();
    render(<TimeSelect value="9:00 AM" onChange={handleChange} />);

    const [, minuteSelect] = screen.getAllByRole('combobox');
    fireEvent.change(minuteSelect, { target: { value: '25' } });

    expect(handleChange).toHaveBeenCalledWith('9:25 AM');
  });

  it('calls onChange with minute 60 when 60 is selected', () => {
    const handleChange = vi.fn();
    render(<TimeSelect value="9:00 AM" onChange={handleChange} />);

    const [, minuteSelect] = screen.getAllByRole('combobox');
    fireEvent.change(minuteSelect, { target: { value: '60' } });

    expect(handleChange).toHaveBeenCalledWith('9:60 AM');
  });

  it('calls onChange with updated period when AM/PM is changed', () => {
    const handleChange = vi.fn();
    render(<TimeSelect value="4:15 AM" onChange={handleChange} />);

    const [, , periodSelect] = screen.getAllByRole('combobox');
    fireEvent.change(periodSelect, { target: { value: 'PM' } });

    expect(handleChange).toHaveBeenCalledWith('4:15 PM');
  });

  it('calls onChange with empty string when hour is deselected', () => {
    const handleChange = vi.fn();
    render(<TimeSelect value="6:30 AM" onChange={handleChange} />);

    const [hourSelect] = screen.getAllByRole('combobox');
    fireEvent.change(hourSelect, { target: { value: '' } });

    expect(handleChange).toHaveBeenCalledWith('');
  });
});

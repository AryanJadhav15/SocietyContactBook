import { useEffect, useState } from 'react';

export function parseTime(value) {
  if (!value) return { hour: '', minute: '0', period: 'AM' };
  const str = String(value).trim();
  const match = str.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)?$/i);
  if (!match) return { hour: '', minute: '0', period: 'AM' };

  let h = parseInt(match[1], 10);
  let m = match[2] !== undefined ? parseInt(match[2], 10) : 0;
  const p = match[3] ? match[3].toUpperCase() : 'AM';

  if (h > 12 && h <= 23) {
    h = h - 12;
    return {
      hour: String(h),
      minute: String(m >= 0 && m <= 60 ? m : 0),
      period: 'PM'
    };
  }
  if (h === 0) {
    h = 12;
    return {
      hour: String(h),
      minute: String(m >= 0 && m <= 60 ? m : 0),
      period: 'AM'
    };
  }

  if (h >= 1 && h <= 12) {
    return {
      hour: String(h),
      minute: String(m >= 0 && m <= 60 ? m : 0),
      period: p === 'PM' ? 'PM' : 'AM'
    };
  }
  return { hour: '', minute: '0', period: 'AM' };
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = Array.from({ length: 60 }, (_, i) => i + 1);

export default function TimeSelect({ value, onChange, disabled = false, id }) {
  const parsed = parseTime(value);
  const [internalPeriod, setInternalPeriod] = useState(parsed.period || 'AM');
  const [internalMinute, setInternalMinute] = useState(parsed.minute || '0');

  useEffect(() => {
    if (parsed.period) {
      setInternalPeriod(parsed.period);
    }
    if (parsed.minute !== undefined) {
      setInternalMinute(parsed.minute);
    }
  }, [parsed.period, parsed.minute]);

  const activePeriod = parsed.hour ? parsed.period : internalPeriod;
  const activeMinute = parsed.hour ? parsed.minute : internalMinute;

  function handleHourChange(e) {
    const newHour = e.target.value;
    if (!newHour) {
      onChange('');
    } else {
      const minStr = String(activeMinute).padStart(2, '0');
      onChange(`${newHour}:${minStr} ${activePeriod}`);
    }
  }

  function handleMinuteChange(e) {
    const newMinute = e.target.value;
    setInternalMinute(newMinute);
    if (parsed.hour) {
      const minStr = String(newMinute).padStart(2, '0');
      onChange(`${parsed.hour}:${minStr} ${activePeriod}`);
    }
  }

  function handlePeriodChange(e) {
    const newPeriod = e.target.value;
    setInternalPeriod(newPeriod);
    if (parsed.hour) {
      const minStr = String(activeMinute).padStart(2, '0');
      onChange(`${parsed.hour}:${minStr} ${newPeriod}`);
    }
  }

return (
  <div className="flex gap-1.5 sm:gap-2">
    <select
      id={id}
      className="input min-w-0 flex-[1.2]"
      value={parsed.hour}
      onChange={handleHourChange}
      disabled={disabled}
      aria-label="Hour"
    >
      <option value="">Hour</option>
      {HOURS.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </select>

    <select
      className="input min-w-0 flex-[1.2]"
      value={activeMinute}
      onChange={handleMinuteChange}
      disabled={disabled}
      aria-label="Minute"
    >
      <option value="0">00</option>
      {MINUTES.map((m) => (
        <option key={m} value={m}>
          {String(m).padStart(2, "0")}
        </option>
      ))}
    </select>

    <select
      className="input min-w-0 flex-[0.8]"
      value={activePeriod}
      onChange={handlePeriodChange}
      disabled={disabled}
      aria-label="AM or PM"
    >
      <option value="AM">AM</option>
      <option value="PM">PM</option>
    </select>
  </div>
);
}

'use client';

import { useState } from 'react';
import {
  isoToJalali,
  jalaliMonthLength,
  jalaliToISO,
  PERSIAN_MONTHS,
  toJalali,
  type Jalali,
} from '@/lib/jalali';

// A dependency-free Jalali (Shamsi) range picker for the analytics filter.
// It renders two hidden inputs (name="from"/"to") carrying Gregorian
// YYYY-MM-DD — the values the backend expects — updated as the user changes
// the شمسی year/month/day selects. Leaving a bound empty submits "" so the
// backend falls back to its default window for the chosen granularity.

const CURRENT_JY = toJalali(
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  new Date().getDate(),
).jy;
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_JY - 5 + i).reverse();

function selectClass() {
  return 'rounded-lg border border-gray-300 px-2 py-2 text-sm';
}

function DateSelect({
  value,
  onChange,
}: {
  value: Jalali | null;
  onChange: (v: Jalali | null) => void;
}) {
  const jy = value?.jy ?? 0;
  const jm = value?.jm ?? 0;
  const jd = value?.jd ?? 0;
  const dayCount = jy && jm ? jalaliMonthLength(jy, jm) : 31;

  const update = (part: Partial<Jalali>) => {
    const next = { jy, jm, jd, ...part };
    if (!next.jy || !next.jm || !next.jd) {
      // Any part cleared → treat the whole bound as unset.
      if (part.jy === 0 || part.jm === 0 || part.jd === 0) {
        onChange(null);
        return;
      }
    }
    // Clamp day to the (possibly shorter) month length.
    if (next.jy && next.jm) {
      const max = jalaliMonthLength(next.jy, next.jm);
      if (next.jd > max) next.jd = max;
    }
    if (next.jy && next.jm && next.jd) onChange(next as Jalali);
    else onChange(null);
  };

  return (
    <div className="flex gap-1.5">
      <select
        aria-label="سال"
        className={selectClass()}
        value={jy || ''}
        onChange={(e) => update({ jy: Number(e.target.value) })}
      >
        <option value="">سال</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        aria-label="ماه"
        className={selectClass()}
        value={jm || ''}
        onChange={(e) => update({ jm: Number(e.target.value) })}
      >
        <option value="">ماه</option>
        {PERSIAN_MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
      <select
        aria-label="روز"
        className={selectClass()}
        value={jd || ''}
        onChange={(e) => update({ jd: Number(e.target.value) })}
      >
        <option value="">روز</option>
        {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
}

export function JalaliRangePicker({
  defaultFrom,
  defaultTo,
}: {
  defaultFrom?: string;
  defaultTo?: string;
}) {
  const [from, setFrom] = useState<Jalali | null>(
    defaultFrom ? isoToJalali(defaultFrom) : null,
  );
  const [to, setTo] = useState<Jalali | null>(
    defaultTo ? isoToJalali(defaultTo) : null,
  );

  const setLastDays = (days: number) => {
    const now = new Date();
    const start = new Date(now.getTime() - days * 86400000);
    setFrom(
      toJalali(start.getFullYear(), start.getMonth() + 1, start.getDate()),
    );
    setTo(toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate()));
  };

  const clear = () => {
    setFrom(null);
    setTo(null);
  };

  const fromISO = from ? jalaliToISO(from.jy, from.jm, from.jd) : '';
  const toISO = to ? jalaliToISO(to.jy, to.jm, to.jd) : '';

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="from" value={fromISO} />
      <input type="hidden" name="to" value={toISO} />

      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            از تاریخ
          </label>
          <DateSelect value={from} onChange={setFrom} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            تا تاریخ
          </label>
          <DateSelect value={to} onChange={setTo} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => setLastDays(7)}
          className="rounded-md border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50"
        >
          ۷ روز اخیر
        </button>
        <button
          type="button"
          onClick={() => setLastDays(30)}
          className="rounded-md border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50"
        >
          ۳۰ روز اخیر
        </button>
        <button
          type="button"
          onClick={() => setLastDays(90)}
          className="rounded-md border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50"
        >
          ۳ ماه اخیر
        </button>
        <button
          type="button"
          onClick={clear}
          className="rounded-md border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50"
        >
          پاک کردن بازه
        </button>
      </div>
    </div>
  );
}

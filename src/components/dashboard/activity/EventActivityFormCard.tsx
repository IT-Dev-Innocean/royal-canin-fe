'use client';

import * as Select from '@radix-ui/react-select';
import { Icon } from '@iconify/react';

const FLOW_TYPE_OPTIONS = [
  { value: 'system_qa', label: 'System QA' },
  { value: 'usher_reward', label: 'Usher reward' },
] as const;

export type ActivityFlowType = (typeof FLOW_TYPE_OPTIONS)[number]['value'];

function normalizeFlowType(v: string | null | undefined): ActivityFlowType {
  const t = (v ?? '').trim();
  if (t === 'usher_reward' || t === 'system_qa') return t;
  return 'system_qa';
}

/**
 * Kode ala API: "Gastro Fact Demo" → `GASTRO_FACT_DEMO`
 */
export function nameToActivityCode(name: string): string {
  return name
    .trim()
    .split(/[\s\-_]+/u)
    .filter((w) => w.length > 0)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())
    .filter((w) => w.length > 0)
    .join('_');
}

export interface ActivityFormState {
  name: string;
  description: string;
  flow_type: ActivityFlowType;
  questions_per_session: string;
  default_reward_points: string;
  is_active: boolean;
}

export const emptyActivityForm = (): ActivityFormState => ({
  name: '',
  description: '',
  flow_type: 'system_qa',
  questions_per_session: '1',
  default_reward_points: '100',
  is_active: true,
});

export function activityToForm(row: {
  name?: string | null;
  description?: string | null;
  flow_type?: string | null;
  default_reward_points?: number | null;
  questions_per_session?: number | null;
  is_active?: boolean;
}): ActivityFormState {
  const q = row.questions_per_session;
  const d = row.default_reward_points;
  const qStr =
    q != null && Number.isFinite(Number(q))
      ? String(Math.min(100, Math.max(1, Math.round(Number(q)))))
      : '1';
  const dStr =
    d != null && Number.isFinite(Number(d))
      ? String(Math.min(1000, Math.max(1, Math.round(Number(d)))))
      : '100';
  return {
    name: row.name?.trim() ?? '',
    description: row.description?.trim() ?? '',
    flow_type: normalizeFlowType(row.flow_type ?? 'system_qa'),
    questions_per_session: qStr,
    default_reward_points: dStr,
    is_active: row.is_active !== false,
  };
}

export function formToJsonPayload(
  f: ActivityFormState
): Record<string, unknown> {
  const code = nameToActivityCode(f.name);
  const qps = Math.min(
    100,
    Math.max(1, Math.round(Number(f.questions_per_session) || 1))
  );
  const drp = Math.min(
    1000,
    Math.max(1, Math.round(Number(f.default_reward_points) || 1))
  );
  return {
    name: f.name.trim() || null,
    code: code || null,
    description: f.description.trim() || null,
    flow_type: f.flow_type,
    questions_per_session: qps,
    default_reward_points: drp,
    is_active: f.is_active,
  };
}

interface EventActivityFormCardProps {
  form: ActivityFormState;
  onChange: (next: ActivityFormState) => void;
  fieldErrors?: Record<string, string[] | undefined> | null;
  disabled?: boolean;
  idPrefix?: string;
  variant?: 'card' | 'plain';
}

export function EventActivityFormCard({
  form,
  onChange,
  fieldErrors,
  disabled,
  idPrefix = 'activity',
  variant = 'card',
}: EventActivityFormCardProps) {
  const err = (key: string) =>
    fieldErrors?.[key]?.[0] ?? fieldErrors?.[key.replace(/_/g, ' ')]?.[0];

  const generatedCode = nameToActivityCode(form.name);

  const shell =
    variant === 'card'
      ? 'space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'
      : 'space-y-4';

  return (
    <div className={shell}>
      <div>
        <label
          htmlFor={`${idPrefix}-name`}
          className='text-xs font-bold text-gray-600'>
          Nama <span className='text-red-500'>*</span>
        </label>
        <input
          id={`${idPrefix}-name`}
          type='text'
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          disabled={disabled}
          className='mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-rc-red focus:outline-none focus:ring-2 focus:ring-rc-red/20 disabled:bg-gray-50'
          placeholder='Contoh: Gastro Fact Demo'
        />
        {err('name') && (
          <p className='mt-1 text-xs text-red-600'>{err('name')}</p>
        )}
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-code`}
          className='text-xs font-bold text-gray-600'>
          Kode
        </label>
        <input
          id={`${idPrefix}-code`}
          type='text'
          readOnly
          value={generatedCode}
          tabIndex={-1}
          aria-readonly
          className='mt-1 w-full cursor-default rounded-xl border border-dashed border-gray-200 bg-slate-50 px-4 py-2.5 font-mono text-sm text-gray-800'
        />
        <p className='mt-0.5 text-[11px] text-gray-400'>
          Dihasilkan otomatis dari nama (kirim ke API saat simpan).
        </p>
        {err('code') && (
          <p className='mt-1 text-xs text-red-600'>{err('code')}</p>
        )}
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-description`}
          className='text-xs font-bold text-gray-600'>
          Deskripsi
        </label>
        <textarea
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          disabled={disabled}
          rows={3}
          className='mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-rc-red focus:outline-none focus:ring-2 focus:ring-rc-red/20 disabled:bg-gray-50'
          placeholder='Contoh: aktivitas system_qa di area event…'
        />
        {err('description') && (
          <p className='mt-1 text-xs text-red-600'>{err('description')}</p>
        )}
      </div>

      <div>
        <label
          id={`${idPrefix}-flow-type-label`}
          htmlFor={`${idPrefix}-flow-type`}
          className='text-xs font-bold text-gray-600'>
          Tipe Aktivitas
        </label>
        <Select.Root
          value={form.flow_type}
          onValueChange={(v) =>
            onChange({ ...form, flow_type: normalizeFlowType(v) })
          }
          disabled={disabled}>
          <Select.Trigger
            id={`${idPrefix}-flow-type`}
            aria-labelledby={`${idPrefix}-flow-type-label`}
            className='mt-1 flex h-[42px] w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-rc-red focus:ring-2 focus:ring-rc-red/20 data-disabled:cursor-not-allowed data-disabled:bg-gray-50 data-disabled:opacity-70 [&>span]:min-w-0 [&>span]:truncate'>
            <Select.Value placeholder='Pilih tipe' />
            <Select.Icon className='shrink-0 text-gray-500' aria-hidden>
              <Icon icon='mdi:chevron-down' className='h-5 w-5' />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              className='z-100 max-h-[min(280px,var(--radix-select-content-available-height))] overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg'
              position='popper'
              sideOffset={6}
              align='start'
              style={{ width: 'var(--radix-select-trigger-width)' }}>
              <Select.Viewport className='p-0.5'>
                {FLOW_TYPE_OPTIONS.map((opt) => (
                  <Select.Item
                    key={opt.value}
                    value={opt.value}
                    className='relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none data-disabled:pointer-events-none data-disabled:opacity-40 data-highlighted:bg-red-50 data-highlighted:text-red-900 data-[state=checked]:font-semibold data-[state=checked]:text-rc-red'>
                    <Select.ItemText>
                      {opt.label}{' '}
                      <span className='text-gray-500'>({opt.value})</span>
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
        {err('flow_type') && (
          <p className='mt-1 text-xs text-red-600'>{err('flow_type')}</p>
        )}
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-questions-per-session`}
          className='text-xs font-bold text-gray-600'>
          Jumlah Pertanyaan Quiz per Sesi
        </label>
        <input
          id={`${idPrefix}-questions-per-session`}
          type='number'
          min={1}
          max={100}
          value={form.questions_per_session}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '') {
              onChange({ ...form, questions_per_session: '' });
              return;
            }
            const n = Math.min(100, Math.max(1, Math.round(Number(v))));
            onChange({ ...form, questions_per_session: String(n) });
          }}
          disabled={disabled}
          className='mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm tabular-nums focus:border-rc-red focus:outline-none focus:ring-2 focus:ring-rc-red/20 disabled:bg-gray-50'
        />
        {err('questions_per_session') && (
          <p className='mt-1 text-xs text-red-600'>
            {err('questions_per_session')}
          </p>
        )}
        <p className='mt-0.5 text-[11px] text-gray-400 italic'>
          Jumlah Pertanyaan Kuis (Minimal 1 Pertanyaan)
        </p>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-default-reward-points`}
          className='text-xs font-bold text-gray-600'>
          Reward poin (default)
        </label>
        <input
          id={`${idPrefix}-default-reward-points`}
          type='number'
          min={1}
          max={1000}
          value={form.default_reward_points}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '') {
              onChange({ ...form, default_reward_points: '' });
              return;
            }
            const n = Math.min(1000, Math.max(1, Math.round(Number(v))));
            onChange({ ...form, default_reward_points: String(n) });
          }}
          disabled={disabled}
          className='mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm tabular-nums focus:border-rc-red focus:outline-none focus:ring-2 focus:ring-rc-red/20 disabled:bg-gray-50'
        />
        {err('default_reward_points') && (
          <p className='mt-1 text-xs text-red-600'>
            {err('default_reward_points')}
          </p>
        )}
        <p className='mt-0.5 text-[11px] text-gray-400 italic'>
          Default Reward Points Pada Setiap Sesi Kuis
        </p>
      </div>

      <div className='inline-flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-slate-50/90 px-4 py-2.5'>
        <div className='flex min-w-0 items-center gap-2'>
          <div className='min-w-0'>
            <p className='text-sm font-bold text-gray-900'>
              Aktifkan Aktivitas
            </p>
          </div>
        </div>
        <button
          type='button'
          role='switch'
          aria-checked={form.is_active}
          disabled={disabled}
          onClick={() => onChange({ ...form, is_active: !form.is_active })}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
            form.is_active ? 'bg-rc-red' : 'bg-gray-300'
          } ${
            disabled
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer shadow-inner'
          }`}>
          <span
            className={`absolute top-0.5 left-0.5 h-7 w-7 rounded-full border border-white/80 bg-white shadow transition-transform ${
              form.is_active ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

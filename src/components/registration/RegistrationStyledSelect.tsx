'use client';

import * as Select from '@radix-ui/react-select';
import { Icon } from '@iconify/react';

export type RegistrationStyledOption = {
  value: string;
  label: string;
};

type RegistrationStyledSelectProps = {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: RegistrationStyledOption[];
  placeholder?: string;
  name?: string;
};

const triggerClass =
  'inline-flex h-[42px] w-full shrink-0 items-center justify-between gap-2 rounded-[0.25rem] border border-neutral-300 bg-white px-3.5 py-2 text-left text-sm text-neutral-900 shadow-none outline-none transition hover:border-neutral-400 focus:border-[#e2001a] focus:ring-1 focus:ring-[#e2001a] data-[placeholder]:text-neutral-400 [&>span]:min-w-0 [&>span]:truncate';

const itemClass =
  'relative flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm leading-snug text-neutral-900 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-800 data-[state=checked]:bg-red-50 data-[state=checked]:text-red-800';

export function RegistrationStyledSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Pilih opsi',
  name,
}: RegistrationStyledSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      {name ? <input type='hidden' name={name} value={value} readOnly /> : null}
      <Select.Trigger id={id} className={triggerClass}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className='shrink-0 text-neutral-500'>
          <Icon icon='mdi:chevron-down' className='h-5 w-5' aria-hidden />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className='z-100 max-h-[min(320px,var(--radix-select-content-available-height))] overflow-hidden rounded-[10px] border border-neutral-200 bg-white p-1 shadow-lg'
          position='popper'
          sideOffset={6}
          align='start'
          style={{ width: 'var(--radix-select-trigger-width)' }}>
          <Select.Viewport className='p-0.5'>
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className={itemClass}>
                <Select.ItemText>{opt.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

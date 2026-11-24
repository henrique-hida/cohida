import { Combobox } from '@base-ui/react/combobox';
import { Check, ChevronDown } from 'lucide-react';

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Combobox.Root
      items={options}
      value={value || null}
      onValueChange={(next) => onChange(next ?? '')}
      disabled={disabled}
    >
      <Combobox.InputGroup className='relative flex items-center'>
        <Combobox.Input
          aria-label={label}
          placeholder='Buscar categoria'
          className={[
            'h-9 w-full rounded-lg border border-input bg-background',
            'px-3 pr-9 text-sm outline-none focus-visible:ring-3',
            'focus-visible:ring-ring/50',
          ].join(' ')}
        />
        <Combobox.Trigger
          aria-label='Mostrar categorias'
          className='absolute right-3 text-muted-foreground'
        >
          <ChevronDown className='size-4' />
        </Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className='z-50'>
          <Combobox.Popup
            className={[
              'max-h-60 w-[var(--anchor-width)] overflow-auto rounded-lg',
              'bg-popover p-1 text-sm text-popover-foreground shadow-md',
              'ring-1 ring-foreground/10',
            ].join(' ')}
          >
            <Combobox.Empty className='px-3 py-2 text-muted-foreground'>
              Nenhuma categoria encontrada.
            </Combobox.Empty>
            <Combobox.List>
              {(option: string) => (
                <Combobox.Item
                  key={option}
                  value={option}
                  className={[
                    'flex cursor-default items-center justify-between',
                    'rounded-md px-3 py-2 outline-none',
                    'data-highlighted:bg-muted',
                  ].join(' ')}
                >
                  {option}
                  <Combobox.ItemIndicator>
                    <Check className='size-4' />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

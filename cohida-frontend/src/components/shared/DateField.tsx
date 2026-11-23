import { useEffect, useRef, useState } from 'react';
import { format, isValid, parse, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Props = {
  name: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  dateTime?: boolean;
  'aria-invalid'?: boolean;
};

export function DateField({
  name,
  defaultValue = '',
  disabled,
  required,
  dateTime,
  'aria-invalid': invalid,
}: Props) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const initial = defaultValue.slice(0, 10);
  const [text, setText] = useState(() => {
    const value = initial ? parseISO(initial) : null;
    return value && isValid(value) ? format(value, 'dd/MM/yyyy') : '';
  });
  const [time, setTime] = useState(defaultValue.slice(11, 16) || '00:00');
  const date = parse(text, 'dd/MM/yyyy', new Date());
  const valid = isValid(date) && format(date, 'dd/MM/yyyy') === text;
  useEffect(() => {
    inputRef.current?.setCustomValidity(text && !valid ? 'Data inválida.' : '');
  }, [text, valid]);
  const value = valid
    ? format(date, 'yyyy-MM-dd') + (dateTime ? `T${time}` : '')
    : '';
  return (
    <div className='flex min-w-0 items-center gap-2'>
      <input type='hidden' name={name} value={value} disabled={disabled} />
      <input
        ref={inputRef}
        aria-label='Data'
        aria-invalid={invalid || (text !== '' && !valid)}
        className={[
          'h-10 min-w-0 w-full rounded-lg border border-input',
          'bg-background px-3 font-normal',
        ].join(' ')}
        disabled={disabled}
        inputMode='numeric'
        placeholder='DD/MM/AAAA'
        required={required}
        pattern='[0-9]{2}/[0-9]{2}/[0-9]{4}'
        value={text}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, 8);
          setText(
            [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)]
              .filter(Boolean)
              .join('/'),
          );
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              aria-label='Escolher data'
              disabled={disabled}
              size='icon-sm'
              type='button'
              variant='outline'
            />
          }
        >
          <CalendarDays aria-hidden='true' />
        </PopoverTrigger>
        <PopoverContent align='end' className='w-auto p-0'>
          <Calendar
            locale={ptBR}
            mode='single'
            selected={valid ? date : undefined}
            defaultMonth={valid ? date : undefined}
            onSelect={(next) => {
              if (!next) return;
              setText(format(next, 'dd/MM/yyyy'));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {dateTime && (
        <input
          aria-label='Horário'
          className={[
            'h-10 w-20 rounded-lg border border-input',
            'bg-background px-2 font-normal',
          ].join(' ')}
          disabled={disabled}
          inputMode='numeric'
          pattern='([01][0-9]|2[0-3]):[0-5][0-9]'
          required={required}
          value={time}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
            setTime(
              digits.length > 2
                ? `${digits.slice(0, 2)}:${digits.slice(2)}`
                : digits,
            );
          }}
        />
      )}
    </div>
  );
}

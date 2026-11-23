import { DateField } from '@/components/shared/DateField';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CustomerCreateInput } from '@/lib/customerApi';
import { FieldError } from './FieldError';
import { formatCpf, formatPhone, inputClassName } from './registrationUtils';

type Props = {
  step: number;
  fieldErrors: Record<string, string>;
  includePassword: boolean;
  initialValues?: Partial<CustomerCreateInput>;
};

export function PersonalFields({
  step,
  fieldErrors,
  includePassword,
  initialValues,
}: Props) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  return (
    <div className={step === 1 ? 'grid gap-3 sm:grid-cols-2' : 'hidden'}>
      <label className='grid gap-2 text-sm font-medium'>
        Nome completo
        <input
          aria-invalid={Boolean(fieldErrors.name)}
          className={inputClassName(Boolean(fieldErrors.name), 'font-normal')}
          name='name'
          defaultValue={initialValues?.name}
          required
        />
        <FieldError message={fieldErrors.name} />
      </label>
      <label className='grid gap-2 text-sm font-medium'>
        CPF
        <input
          aria-invalid={Boolean(fieldErrors.cpf)}
          className={inputClassName(Boolean(fieldErrors.cpf), 'font-normal')}
          inputMode='numeric'
          name='cpf'
          defaultValue={initialValues?.cpf}
          onInput={(event) => {
            event.currentTarget.value = formatCpf(event.currentTarget.value);
          }}
          required
        />
        <FieldError message={fieldErrors.cpf} />
      </label>
      <label className='grid gap-2 text-sm font-medium'>
        Data de nascimento
        <DateField
          aria-invalid={Boolean(fieldErrors.birthDate)}
          name='birthDate'
          defaultValue={initialValues?.birthDate}
          required
        />
        <FieldError message={fieldErrors.birthDate} />
      </label>
      <label className='grid gap-2 text-sm font-medium'>
        Telefone
        <input
          aria-invalid={Boolean(fieldErrors.phone)}
          className={inputClassName(Boolean(fieldErrors.phone), 'font-normal')}
          inputMode='tel'
          name='phone'
          defaultValue={initialValues?.phone}
          onInput={(event) => {
            event.currentTarget.value = formatPhone(event.currentTarget.value);
          }}
          required
        />
        <FieldError message={fieldErrors.phone} />
      </label>
      <label className='grid gap-2 text-sm font-medium'>
        E-mail
        <input
          aria-invalid={Boolean(fieldErrors.email)}
          className={inputClassName(Boolean(fieldErrors.email), 'font-normal')}
          name='email'
          defaultValue={initialValues?.email}
          required
          type='email'
        />
        <FieldError message={fieldErrors.email} />
      </label>
      {includePassword ? (
        <label className='grid gap-2 text-sm font-medium'>
          Senha
          <span className='relative'>
            <input
              aria-invalid={Boolean(fieldErrors.password)}
              className={inputClassName(
                Boolean(fieldErrors.password),
                'w-full pr-10 font-normal',
              )}
              minLength={8}
              name='password'
              required
              type={isPasswordVisible ? 'text' : 'password'}
            />
            <Button
              aria-label={
                isPasswordVisible ? 'Ocultar senha' : 'Visualizar senha'
              }
              className='absolute top-1/2 right-0 -translate-y-1/2'
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              size='icon-sm'
              type='button'
              variant='ghost'
            >
              {isPasswordVisible ? <EyeOff /> : <Eye />}
            </Button>
          </span>
          <FieldError message={fieldErrors.password} />
        </label>
      ) : null}
      {includePassword ? (
        <label className='grid gap-2 text-sm font-medium sm:col-span-2'>
          Confirmar senha
          <span className='relative'>
            <input
              aria-invalid={Boolean(fieldErrors.passwordConfirmation)}
              className={inputClassName(
                Boolean(fieldErrors.passwordConfirmation),
                'w-full pr-10 font-normal',
              )}
              minLength={8}
              name='passwordConfirmation'
              required
              type={isConfirmationVisible ? 'text' : 'password'}
            />
            <Button
              aria-label={
                isConfirmationVisible
                  ? 'Ocultar confirmação de senha'
                  : 'Visualizar confirmação de senha'
              }
              className='absolute top-1/2 right-0 -translate-y-1/2'
              onClick={() => setIsConfirmationVisible((visible) => !visible)}
              size='icon-sm'
              type='button'
              variant='ghost'
            >
              {isConfirmationVisible ? <EyeOff /> : <Eye />}
            </Button>
          </span>
          <FieldError message={fieldErrors.passwordConfirmation} />
        </label>
      ) : null}
    </div>
  );
}

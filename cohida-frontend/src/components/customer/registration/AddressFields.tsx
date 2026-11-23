import { useState } from 'react';
import { lookupCep } from '@/lib/cep';
import type { CustomerCreateInput } from '@/lib/customerApi';
import { FieldError } from './FieldError';
import { formatCep, inputClassName } from './registrationUtils';

type RegistrationInput = CustomerCreateInput;
type FieldErrors = Record<string, string>;

export function AddressFields({
  initialValue,
  prefix,
  title,
  fieldErrors,
}: {
  initialValue?: Partial<RegistrationInput['billingAddress']>;
  prefix: 'billing' | 'delivery';
  title: string;
  fieldErrors: FieldErrors;
}) {
  const [cepError, setCepError] = useState('');
  const field = (name: string) => `${prefix}${name}`;

  async function completeAddress(event: React.FocusEvent<HTMLInputElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    try {
      const address = await lookupCep(event.currentTarget.value);
      if (!address) return;
      const set = (name: string, value: string) => {
        const input = form.elements.namedItem(`${prefix}${name}`);
        if (input instanceof HTMLInputElement) input.value = value;
      };
      set('Street', address.street);
      set('Neighborhood', address.neighborhood);
      set('City', address.city);
      set('State', address.state);
      setCepError('');
    } catch (reason) {
      setCepError(reason instanceof Error ? reason.message : 'CEP inválido.');
    }
  }

  return (
    <fieldset
      className={[
        'grid gap-2 rounded-lg border border-border',
        'p-3 sm:grid-cols-2',
      ].join(' ')}
    >
      <legend className='px-1 text-sm font-semibold'>{title}</legend>
      <label className='grid gap-1 text-sm'>
        Apelido
        <input
          aria-invalid={Boolean(fieldErrors[field('Label')])}
          className={inputClassName(Boolean(fieldErrors[field('Label')]))}
          defaultValue={
            initialValue?.label ?? (prefix === 'billing' ? 'Cobrança' : 'Casa')
          }
          name={field('Label')}
          required
        />
        <FieldError message={fieldErrors[field('Label')]} />
      </label>
      <label className='grid gap-1 text-sm'>
        CEP
        <input
          aria-invalid={Boolean(fieldErrors[field('PostalCode')] || cepError)}
          className={inputClassName(
            Boolean(fieldErrors[field('PostalCode')] || cepError),
          )}
          inputMode='numeric'
          name={field('PostalCode')}
          defaultValue={initialValue?.postalCode}
          onBlur={completeAddress}
          onInput={(event) => {
            event.currentTarget.value = formatCep(event.currentTarget.value);
          }}
          required
        />
        <FieldError message={fieldErrors[field('PostalCode')] || cepError} />
      </label>
      <label className='grid gap-1 text-sm sm:col-span-2'>
        Logradouro
        <input
          aria-invalid={Boolean(fieldErrors[field('Street')])}
          className={inputClassName(Boolean(fieldErrors[field('Street')]))}
          name={field('Street')}
          defaultValue={initialValue?.street}
          required
        />
        <FieldError message={fieldErrors[field('Street')]} />
      </label>
      <label className='grid gap-1 text-sm'>
        Número
        <input
          aria-invalid={Boolean(fieldErrors[field('Number')])}
          className={inputClassName(Boolean(fieldErrors[field('Number')]))}
          name={field('Number')}
          defaultValue={initialValue?.number}
          required
        />
        <FieldError message={fieldErrors[field('Number')]} />
      </label>
      <label className='grid gap-1 text-sm'>
        Bairro
        <input
          aria-invalid={Boolean(fieldErrors[field('Neighborhood')])}
          className={inputClassName(
            Boolean(fieldErrors[field('Neighborhood')]),
          )}
          name={field('Neighborhood')}
          defaultValue={initialValue?.neighborhood}
          required
        />
        <FieldError message={fieldErrors[field('Neighborhood')]} />
      </label>
      <label className='grid gap-1 text-sm'>
        Cidade
        <input
          aria-invalid={Boolean(fieldErrors[field('City')])}
          className={inputClassName(Boolean(fieldErrors[field('City')]))}
          name={field('City')}
          defaultValue={initialValue?.city}
          required
        />
        <FieldError message={fieldErrors[field('City')]} />
      </label>
      <label className='grid gap-1 text-sm'>
        Estado
        <input
          aria-invalid={Boolean(fieldErrors[field('State')])}
          className={inputClassName(Boolean(fieldErrors[field('State')]))}
          name={field('State')}
          defaultValue={initialValue?.state}
          required
        />
        <FieldError message={fieldErrors[field('State')]} />
      </label>
      <label className='grid gap-1 text-sm sm:col-span-2'>
        País
        <input
          aria-invalid={Boolean(fieldErrors[field('Country')])}
          className={inputClassName(Boolean(fieldErrors[field('Country')]))}
          defaultValue={initialValue?.country ?? 'Brasil'}
          name={field('Country')}
          required
        />
        <FieldError message={fieldErrors[field('Country')]} />
      </label>
    </fieldset>
  );
}

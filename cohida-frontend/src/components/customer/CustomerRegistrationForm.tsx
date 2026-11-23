import { AddressFields } from './registration/AddressFields';
import { PersonalFields } from './registration/PersonalFields';
import {
  addressFrom,
  addressesMatch,
  errorField,
  errorStep,
} from './registration/registrationUtils';
import { useState, type FormEvent, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import type { CustomerCreateInput } from '@/lib/customerApi';

type RegistrationInput = CustomerCreateInput;
type FieldErrors = Record<string, string>;

interface CustomerRegistrationFormProps {
  cancelAction?: ReactNode;
  compactActions?: boolean;
  includePassword?: boolean;
  initialValues?: Partial<RegistrationInput>;
  onSubmit: (input: RegistrationInput) => Promise<void> | void;
  submitLabel: string;
}

export function CustomerRegistrationForm({
  cancelAction,
  compactActions = false,
  includePassword = true,
  initialValues,
  onSubmit,
  submitLabel,
}: CustomerRegistrationFormProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useDeliveryForBilling, setUseDeliveryForBilling] = useState(
    () =>
      !initialValues?.billingAddress ||
      addressesMatch(
        initialValues.billingAddress,
        initialValues.deliveryAddress,
      ),
  );

  function advance(form: HTMLFormElement) {
    const required =
      step === 1
        ? [
            'name',
            'cpf',
            'birthDate',
            'phone',
            'email',
            ...(includePassword ? ['password', 'passwordConfirmation'] : []),
          ]
        : [
            'deliveryLabel',
            'deliveryPostalCode',
            'deliveryStreet',
            'deliveryNumber',
            'deliveryNeighborhood',
            'deliveryCity',
            'deliveryState',
            'deliveryCountry',
            ...(!useDeliveryForBilling
              ? [
                  'billingLabel',
                  'billingPostalCode',
                  'billingStreet',
                  'billingNumber',
                  'billingNeighborhood',
                  'billingCity',
                  'billingState',
                  'billingCountry',
                ]
              : []),
          ];
    const missing = required.filter(
      (name) => !String(new FormData(form).get(name) ?? '').trim(),
    );
    if (missing.length) {
      setFieldErrors(
        Object.fromEntries(missing.map((name) => [name, 'Campo obrigatório.'])),
      );
      setError('');
      return;
    }
    if (
      includePassword &&
      step === 1 &&
      String(new FormData(form).get('password')) !==
        String(new FormData(form).get('passwordConfirmation'))
    ) {
      setFieldErrors({
        passwordConfirmation: 'A confirmação de senha não corresponde.',
      });
      setError('');
      return;
    }
    setError('');
    setFieldErrors({});
    setStep(2);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');
    if (
      includePassword &&
      password !== String(formData.get('passwordConfirmation') ?? '')
    ) {
      setFieldErrors({
        passwordConfirmation: 'A confirmação de senha não corresponde.',
      });
      setError('');
      return;
    }
    if (
      includePassword &&
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}/.test(password)
    ) {
      setFieldErrors({
        password: [
          'Use ao menos 8 caracteres, com',
          'maiúscula, minúscula e caractere',
          'especial.',
        ].join(' '),
      });
      setError('');
      return;
    }
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const deliveryAddress = addressFrom(formData, 'delivery');
      await onSubmit({
        billingAddress: useDeliveryForBilling
          ? { ...deliveryAddress, label: 'Cobrança' }
          : addressFrom(formData, 'billing'),
        birthDate: String(formData.get('birthDate') ?? ''),
        cpf: String(formData.get('cpf') ?? ''),
        deliveryAddress,
        email: String(formData.get('email') ?? ''),
        name: String(formData.get('name') ?? ''),
        password,
        passwordConfirmation: String(
          formData.get('passwordConfirmation') ?? '',
        ),
        phone: String(formData.get('phone') ?? ''),
      });
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : 'Não foi possível concluir o cadastro.';
      const field = errorField(message);
      setFieldErrors(field ? { [field]: message } : {});
      setError(field ? '' : message);
      setStep(errorStep(message));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className='mt-5 grid gap-3' onSubmit={submit}>
      <PersonalFields
        step={step}
        fieldErrors={fieldErrors}
        includePassword={includePassword}
        initialValues={initialValues}
      />
      <div className={step === 2 ? 'space-y-4' : 'hidden'}>
        <AddressFields
          initialValue={initialValues?.deliveryAddress}
          fieldErrors={fieldErrors}
          prefix='delivery'
          title='Endereço de entrega'
        />
        <div className='rounded-lg border border-border bg-muted/35 p-3'>
          <label
            className={[
              'flex cursor-pointer items-center gap-3',
              'text-sm font-medium',
            ].join(' ')}
          >
            <input
              checked={useDeliveryForBilling}
              className='size-4 accent-primary'
              onChange={(event) =>
                setUseDeliveryForBilling(event.target.checked)
              }
              type='checkbox'
            />
            Usar o endereço de entrega também para cobrança
          </label>
          <p className='mt-2 pl-7 text-xs text-muted-foreground'>
            Desmarque apenas se o endereço de cobrança for diferente.
          </p>
        </div>
        {!useDeliveryForBilling ? (
          <AddressFields
            initialValue={initialValues?.billingAddress}
            fieldErrors={fieldErrors}
            prefix='billing'
            title='Endereço de cobrança'
          />
        ) : null}
      </div>
      {error ? (
        <Toast message={error} onClose={() => setError('')} variant='error' />
      ) : null}
      <div
        className={
          compactActions
            ? 'mt-2 flex flex-wrap justify-end gap-2'
            : 'mt-2 grid gap-2'
        }
      >
        {step > 1 ? (
          <Button
            className={compactActions ? 'w-fit' : 'w-full'}
            onClick={() => {
              setError('');
              setFieldErrors({});
              setStep(1);
            }}
            type='button'
            variant='outline'
          >
            Voltar
          </Button>
        ) : null}
        {cancelAction}
        {step === 1 ? (
          <Button
            className={compactActions ? 'w-fit' : 'w-full'}
            onClick={(event) => {
              event.preventDefault();
              const form = event.currentTarget.form;
              if (form) advance(form);
            }}
            size={compactActions ? 'default' : 'lg'}
            type='button'
          >
            Continuar
          </Button>
        ) : (
          <Button
            className={compactActions ? 'w-fit' : 'w-full'}
            disabled={isSubmitting}
            size={compactActions ? 'default' : 'lg'}
            type='submit'
          >
            {isSubmitting ? 'Salvando...' : submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
}

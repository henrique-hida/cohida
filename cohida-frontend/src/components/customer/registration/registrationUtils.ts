import type { CustomerCreateInput } from '@/lib/customerApi';
type RegistrationInput = CustomerCreateInput;

export const inputClassName = (hasError: boolean, className = '') =>
  `h-9 rounded-md border bg-background px-3 ${
    hasError
      ? 'border-destructive focus-visible:ring-destructive'
      : 'border-input'
  } ${className}`;

export function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function formatCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, '$1-$2');
}

export function addressFrom(
  formData: FormData,
  prefix: 'billing' | 'delivery',
) {
  const value = (name: string) =>
    String(formData.get(`${prefix}${name}`) ?? '').trim();
  return {
    city: value('City'),
    country: value('Country'),
    label: value('Label'),
    neighborhood: value('Neighborhood'),
    number: value('Number'),
    postalCode: value('PostalCode'),
    state: value('State'),
    street: value('Street'),
  };
}

export function addressesMatch(
  billingAddress?: Partial<RegistrationInput['billingAddress']>,
  deliveryAddress?: Partial<RegistrationInput['deliveryAddress']>,
) {
  if (!billingAddress || !deliveryAddress) {
    return false;
  }

  const fields = [
    'street',
    'number',
    'neighborhood',
    'postalCode',
    'city',
    'state',
    'country',
  ] as const;
  const normalize = (value?: string) =>
    value?.trim().replaceAll(/\W/g, '').toLocaleLowerCase('pt-BR') ?? '';

  return fields.every(
    (field) =>
      normalize(billingAddress[field]) === normalize(deliveryAddress[field]),
  );
}

export function errorStep(message: string) {
  const firstStepTerms = [
    'nome',
    'name',
    'e-mail',
    'email',
    'cpf',
    'telefone',
    'phone',
    'nascimento',
    'senha',
    'password',
  ];
  return firstStepTerms.some((term) => message.toLowerCase().includes(term))
    ? 1
    : 2;
}

export function errorField(message: string) {
  const value = message.toLowerCase();
  if (value.includes('e-mail') || value.includes('email')) return 'email';
  if (value.includes('cpf')) return 'cpf';
  if (value.includes('telefone') || value.includes('phone')) return 'phone';
  if (value.includes('nascimento')) return 'birthDate';
  if (value.includes('nome') || value.includes('name')) return 'name';
  if (value.includes('senha') || value.includes('password')) return 'password';
  if (value.includes('cep') || value.includes('postal'))
    return 'deliveryPostalCode';
  return undefined;
}

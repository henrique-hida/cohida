import { DateField } from '@/components/shared/DateField';
import { Eye, EyeOff, Pencil } from 'lucide-react';
import { useState } from 'react';

import { AccountSectionCard } from '@/components/shared/AccountSectionCard';
import { Button } from '@/components/ui/button';
import { useCommerce } from '@/data/useCommerce';
import { customerApi } from '@/lib/customerApi';

type AccountProfileProps = {
  customer: NonNullable<ReturnType<typeof useCommerce>['state']['customer']>;
  deactivationError: string;
  isDeactivatingAccount: boolean;
  onDeactivate: () => void;
  updateCustomer: ReturnType<typeof useCommerce>['updateCustomer'];
};

export function AccountProfile({
  customer,
  deactivationError,
  isDeactivatingAccount,
  onDeactivate,
  updateCustomer,
}: AccountProfileProps) {
  const { logout } = useCommerce();
  const [isEditing, setIsEditing] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [visiblePasswordFields, setVisiblePasswordFields] = useState<
    Record<string, boolean>
  >({});

  return (
    <AccountSectionCard
      action={
        <Button
          onClick={() => setIsEditing((editing) => !editing)}
          variant='outline'
        >
          <Pencil />
          {isEditing ? 'Cancelar' : 'Editar'}
        </Button>
      }
      description='Mantenha seus dados atualizados.'
      title='Dados pessoais'
    >
      <form
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          setProfileError('');
          setSavingProfile(true);
          try {
            await updateCustomer({
              birthDate: String(formData.get('birthDate') ?? ''),
              email: String(formData.get('email') ?? ''),
              name: String(formData.get('name') ?? ''),
              phone: String(formData.get('phone') ?? ''),
            });
            setIsEditing(false);
          } catch (error) {
            setProfileError(
              error instanceof Error
                ? error.message
                : 'Não foi possível salvar.',
            );
          } finally {
            setSavingProfile(false);
          }
        }}
      >
        {[
          ['Nome completo', customer.name, 'name'],
          ['E-mail', customer.email, 'email'],
          ['Telefone', customer.phone, 'phone'],
          ['Data de nascimento', customer.birthDate, 'birthDate'],
        ].map(([label, value, field]) => (
          <label className='grid gap-2 text-sm font-medium' key={label}>
            {label}
            {field === 'birthDate' ? (
              <DateField
                name={field}
                defaultValue={value}
                disabled={!isEditing}
              />
            ) : (
              <input
                className={[
                  'h-10 rounded-lg border border-input',
                  'bg-background px-3 font-normal',
                  'disabled:cursor-default',
                  'disabled:opacity-70',
                ].join(' ')}
                defaultValue={value}
                disabled={!isEditing}
                name={field}
                type='text'
              />
            )}
          </label>
        ))}
        {profileError ? (
          <p className='text-sm text-destructive sm:col-span-2' role='alert'>
            {profileError}
          </p>
        ) : null}
        {isEditing ? (
          <Button
            className='sm:col-span-2 sm:ml-auto'
            disabled={savingProfile}
            type='submit'
          >
            Salvar alterações
          </Button>
        ) : null}
      </form>
      <div className='mt-6 border-t border-border pt-5'>
        <div className='flex flex-wrap justify-end gap-3'>
          <Button
            onClick={() => setIsChangingPassword((changing) => !changing)}
            variant='outline'
          >
            {isChangingPassword
              ? 'Cancelar alteração de senha'
              : 'Alterar senha'}
          </Button>
          <Button
            disabled={isDeactivatingAccount}
            onClick={() => onDeactivate()}
            variant='destructive'
          >
            Desativar conta
          </Button>
        </div>
        {isChangingPassword ? (
          <form
            className='mt-4 grid max-w-md gap-3'
            onSubmit={async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              await customerApi.changePassword(
                String(formData.get('currentPassword') ?? ''),
                String(formData.get('newPassword') ?? ''),
                String(formData.get('newPasswordConfirmation') ?? ''),
              );
              setIsChangingPassword(false);
              logout();
            }}
          >
            <label className='grid gap-1 text-sm'>
              Senha atual
              <span className='relative'>
                <input
                  className={[
                    'h-9 w-full rounded-lg border border-input',
                    'bg-background px-3 pr-10',
                  ].join(' ')}
                  name='currentPassword'
                  required
                  type={visiblePasswordFields.current ? 'text' : 'password'}
                />
                <Button
                  aria-label={
                    visiblePasswordFields.current
                      ? 'Ocultar senha atual'
                      : 'Visualizar senha atual'
                  }
                  className={[
                    'absolute top-1/2 right-0',
                    '-translate-y-1/2',
                  ].join(' ')}
                  onClick={() =>
                    setVisiblePasswordFields((current) => ({
                      ...current,
                      current: !current.current,
                    }))
                  }
                  size='icon-sm'
                  type='button'
                  variant='ghost'
                >
                  {visiblePasswordFields.current ? <EyeOff /> : <Eye />}
                </Button>
              </span>
            </label>
            <label className='grid gap-1 text-sm'>
              Nova senha
              <span className='relative'>
                <input
                  className={[
                    'h-9 w-full rounded-lg border border-input',
                    'bg-background px-3 pr-10',
                  ].join(' ')}
                  name='newPassword'
                  minLength={8}
                  required
                  type={visiblePasswordFields.new ? 'text' : 'password'}
                />
                <Button
                  aria-label={
                    visiblePasswordFields.new
                      ? 'Ocultar nova senha'
                      : 'Visualizar nova senha'
                  }
                  className={[
                    'absolute top-1/2 right-0',
                    '-translate-y-1/2',
                  ].join(' ')}
                  onClick={() =>
                    setVisiblePasswordFields((current) => ({
                      ...current,
                      new: !current.new,
                    }))
                  }
                  size='icon-sm'
                  type='button'
                  variant='ghost'
                >
                  {visiblePasswordFields.new ? <EyeOff /> : <Eye />}
                </Button>
              </span>
            </label>
            <label className='grid gap-1 text-sm'>
              Confirmar nova senha
              <span className='relative'>
                <input
                  className={[
                    'h-9 w-full rounded-lg border border-input',
                    'bg-background px-3 pr-10',
                  ].join(' ')}
                  name='newPasswordConfirmation'
                  required
                  type={
                    visiblePasswordFields.confirmation ? 'text' : 'password'
                  }
                />
                <Button
                  aria-label={
                    visiblePasswordFields.confirmation
                      ? 'Ocultar confirmação de senha'
                      : 'Visualizar confirmação de senha'
                  }
                  className={[
                    'absolute top-1/2 right-0',
                    '-translate-y-1/2',
                  ].join(' ')}
                  onClick={() =>
                    setVisiblePasswordFields((current) => ({
                      ...current,
                      confirmation: !current.confirmation,
                    }))
                  }
                  size='icon-sm'
                  type='button'
                  variant='ghost'
                >
                  {visiblePasswordFields.confirmation ? <EyeOff /> : <Eye />}
                </Button>
              </span>
            </label>
            <Button className='w-fit' type='submit'>
              Atualizar senha
            </Button>
          </form>
        ) : null}
      </div>
      {deactivationError ? (
        <p className='mt-3 text-sm text-destructive'>{deactivationError}</p>
      ) : null}
    </AccountSectionCard>
  );
}

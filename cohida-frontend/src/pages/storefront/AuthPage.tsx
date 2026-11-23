import { Eye, EyeOff, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

// prettier-ignore
import {
  CustomerRegistrationForm,
} from '@/components/customer/CustomerRegistrationForm';
import { PageContainer } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCommerce } from '@/data/useCommerce';
import {
  customerApi,
  login as loginApi,
  register as registerApi,
} from '@/lib/customerApi';

type AuthMode = 'login' | 'register';

const authCopy: Record<
  AuthMode,
  { action: string; description: string; title: string }
> = {
  login: {
    action: 'Entrar',
    description: 'Acesse pedidos, endereços, cartões e recomendações.',
    title: 'Que bom ter você de volta',
  },
  register: {
    action: 'Criar conta',
    description: 'Preencha seus dados para comprar e acompanhar seus pedidos.',
    title: 'Crie sua conta',
  },
};

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { completeSessionHydration, startApiSession } = useCommerce();
  const navigate = useNavigate();
  const copy = authCopy[mode];

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError('');
    setIsSubmitting(true);
    try {
      const authentication = await loginApi(
        String(formData.get('email') ?? ''),
        String(formData.get('password') ?? ''),
      );
      if (authentication.role === 'ADMIN') {
        localStorage.setItem(
          'cohida-admin-name',
          authentication.customerName ?? 'Administradora',
        );
        navigate('/admin/clientes');
        return;
      }
      await startApiSession(await customerApi.me());
      completeSessionHydration();
      navigate('/');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível concluir a operação.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className='bg-muted/35'>
      <PageContainer className='grid place-items-center py-10'>
        <Card className='w-full max-w-3xl'>
          <CardContent className='p-5 sm:p-6'>
            <div className='flex items-center gap-3'>
              <span
                className={[
                  'grid size-10 place-items-center rounded-xl',
                  'bg-primary text-primary-foreground',
                ].join(' ')}
              >
                <UserRound className='size-5' />
              </span>
              <div>
                <h1 className='text-2xl font-semibold tracking-tight'>
                  {copy.title}
                </h1>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {copy.description}
                </p>
              </div>
            </div>
            <div className='mt-7 grid grid-cols-2 rounded-lg bg-muted p-1'>
              <Button
                className={
                  mode === 'login'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'text-muted-foreground'
                }
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                variant='ghost'
              >
                Entrar
              </Button>
              <Button
                className={
                  mode === 'register'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'text-muted-foreground'
                }
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                variant='ghost'
              >
                Criar conta
              </Button>
            </div>
            {mode === 'register' ? (
              <CustomerRegistrationForm
                onSubmit={async (input) => {
                  await registerApi(input);
                  await startApiSession(await customerApi.me());
                  completeSessionHydration();
                  navigate('/');
                }}
                submitLabel='Criar conta'
              />
            ) : (
              <form className='mt-5 grid gap-3' onSubmit={submitLogin}>
                <label className='grid gap-2 text-sm font-medium'>
                  E-mail
                  <input
                    className={[
                      'h-9 rounded-md border border-input',
                      'bg-background px-3 font-normal',
                    ].join(' ')}
                    name='email'
                    required
                    type='email'
                  />
                </label>
                <label className='grid gap-2 text-sm font-medium'>
                  Senha
                  <span className='relative'>
                    <input
                      className={[
                        'h-9 w-full rounded-md border border-input',
                        'bg-background px-3 pr-10 font-normal',
                      ].join(' ')}
                      name='password'
                      required
                      type={isPasswordVisible ? 'text' : 'password'}
                    />
                    <Button
                      aria-label={
                        isPasswordVisible ? 'Ocultar senha' : 'Visualizar senha'
                      }
                      className='absolute top-1/2 right-0 -translate-y-1/2'
                      onClick={() =>
                        setIsPasswordVisible((visible) => !visible)
                      }
                      size='icon-sm'
                      type='button'
                      variant='ghost'
                    >
                      {isPasswordVisible ? <EyeOff /> : <Eye />}
                    </Button>
                  </span>
                </label>
                {error ? (
                  <div
                    className={[
                      'rounded-lg bg-destructive/10 p-3 text-sm',
                      'text-destructive',
                    ].join(' ')}
                  >
                    {error}
                  </div>
                ) : null}
                <Button
                  className='mt-2 w-full'
                  disabled={isSubmitting}
                  size='lg'
                  type='submit'
                >
                  {isSubmitting ? 'Salvando...' : copy.action}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}

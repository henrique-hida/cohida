import { StoreSearch } from './header/StoreSearch';
import { NotificationMenu } from './header/NotificationMenu';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { AppLogo } from '@/components/shared/AppLogo';
import { AccountMenu } from '@/components/shared/AccountMenu';
import { Button } from '@/components/ui/button';
import { useCommerce } from '@/data/useCommerce';
import {
  getSavedAccounts,
  hasAdminSession,
  switchAccount,
} from '@/lib/customerApi';
import { logout as logoutApi } from '@/lib/customerApi';
import { useCategories } from '@/data/useCategories';

import { PageContainer } from './PageContainer';

interface StoreHeaderProps {
  cartItemCount?: number;
}

export function StoreHeader({ cartItemCount = 0 }: StoreHeaderProps) {
  const { search } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    () => new URLSearchParams(search).get('busca') ?? '',
  );
  const [categoryId, setCategoryId] = useState(
    () => new URLSearchParams(search).get('categoria') ?? '',
  );
  const { logout, state } = useCommerce();
  const categories = useCategories();
  const navigate = useNavigate();
  const adminName = hasAdminSession()
    ? localStorage.getItem('cohida-admin-name')
    : null;
  const currentCartItemCount =
    cartItemCount ||
    state.cartItems.reduce((total, item) => total + item.quantity, 0);
  const signedIn = Boolean(
    state.customer && state.sessionCustomerId === state.customer.id,
  );
  const signedInAsAdmin = Boolean(adminName);
  const savedAccounts = getSavedAccounts();
  const accountName = signedInAsAdmin ? adminName : state.customer?.name;
  const accountInitials = accountName
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((name) => name[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function handleLogout() {
    logoutApi();
    logout();
  }

  function handleAccountSwitch(token: string) {
    const account = savedAccounts.find((saved) => saved.token === token);
    if (!account) return;

    switchAccount(account);
    window.location.assign(account.role === 'ADMIN' ? '/admin' : '/');
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const searchParams = new URLSearchParams(search);
      setSearchTerm(searchParams.get('busca') ?? '');
      setCategoryId(searchParams.get('categoria') ?? '');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const query = searchTerm.trim();
    const currentParams = new URLSearchParams(search);
    if (
      !query &&
      !categoryId &&
      !currentParams.has('busca') &&
      !currentParams.has('categoria')
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set('busca', query);
      if (categoryId) params.set('categoria', categoryId);
      const queryString = params.toString();
      navigate(`/produtos${queryString ? `?${queryString}` : ''}`);
      setIsMenuOpen(false);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [categoryId, navigate, search, searchTerm]);

  const searchForm = (
    <StoreSearch
      searchTerm={searchTerm}
      categoryId={categoryId}
      categories={categories}
      onSearchChange={setSearchTerm}
      onCategoryChange={setCategoryId}
    />
  );

  return (
    <header
      className={[
        'sticky top-0 z-30 border-b border-border',
        'bg-background/90 backdrop-blur',
      ].join(' ')}
    >
      <PageContainer
        className={[
          'relative grid h-18',
          'grid-cols-[1fr_auto_1fr] items-center',
          'gap-3',
        ].join(' ')}
      >
        <Link
          aria-label='coHida — início'
          className='shrink-0 justify-self-start'
          to='/'
        >
          <AppLogo variant='default' />
        </Link>
        <div className='hidden min-w-0 justify-self-center md:block'>
          {searchForm}
        </div>
        <div className='flex items-center gap-2 justify-self-end'>
          <NotificationMenu sessionCustomerId={state.sessionCustomerId} />
          <Button
            aria-label={`Carrinho com ${currentCartItemCount} itens`}
            className='relative'
            render={<Link to='/carrinho' />}
            size='icon'
            variant='outline'
          >
            <ShoppingCart />
            {currentCartItemCount ? (
              <span
                className={[
                  'absolute -right-2 -top-2 grid size-5',
                  'place-items-center rounded-full',
                  'bg-foreground text-xs text-background',
                ].join(' ')}
              >
                {currentCartItemCount}
              </span>
            ) : null}
          </Button>
          <AccountMenu
            accountName={signedIn ? accountName : undefined}
            accounts={signedIn ? savedAccounts : []}
            showAddAccount={signedIn}
            ariaLabel={
              signedInAsAdmin
                ? 'Menu da administradora'
                : signedIn
                  ? 'Menu da conta'
                  : 'Entrar ou criar conta'
            }
            onSwitchAccount={handleAccountSwitch}
            triggerClassName='font-semibold'
            trigger={
              accountInitials ? (
                <span
                  className='text-xs'
                  data-tooltip={accountName ?? undefined}
                >
                  {accountInitials}
                </span>
              ) : (
                <UserRound />
              )
            }
          >
            {signedInAsAdmin ? (
              <>
                <Button
                  className='w-full justify-start'
                  render={<Link to='/admin' />}
                  variant='ghost'
                >
                  <LayoutDashboard />
                  Ir para admin
                </Button>
                <Button
                  className='w-full justify-start'
                  onClick={handleLogout}
                  render={<Link to='/' />}
                  variant='ghost'
                >
                  <LogOut />
                  Sair
                </Button>
              </>
            ) : signedIn ? (
              <>
                <Button
                  className='w-full justify-start'
                  render={<Link to='/conta' />}
                  variant='ghost'
                >
                  <UserRound />
                  Minha conta
                </Button>
                <Button
                  className='w-full justify-start'
                  onClick={handleLogout}
                  render={<Link to='/' />}
                  variant='ghost'
                >
                  <LogOut />
                  Sair
                </Button>
              </>
            ) : (
              <Button
                className='w-full justify-start'
                render={<Link to='/entrar' />}
                variant='ghost'
              >
                <LogIn />
                Entrar / cadastrar-se
              </Button>
            )}
          </AccountMenu>
          <Button
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            className='md:hidden'
            onClick={() => setIsMenuOpen((open) => !open)}
            size='icon'
            variant='outline'
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {isMenuOpen ? (
          <div
            className={[
              'absolute top-full right-0 left-0 border-b',
              'border-border bg-background p-3 shadow-lg',
              'md:hidden',
            ].join(' ')}
          >
            {searchForm}
          </div>
        ) : null}
      </PageContainer>
    </header>
  );
}

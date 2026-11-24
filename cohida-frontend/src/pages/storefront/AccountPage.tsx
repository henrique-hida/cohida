import { Page } from '@/components/shared/Page';
import { PageContent } from '@/components/shared/PageContent';

import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';

import { PageContainer } from '@/components/shared/PageContainer';
import {
  CustomerAccountSidebar,
  type CustomerAccountSection,
} from '@/components/shared/CustomerAccountSidebar';
import { Toast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useCommerce } from '@/data/useCommerce';
import { customerApi } from '@/lib/customerApi';
import { CouponsSection } from '@/pages/storefront/CouponsPage';
import { ExchangesSection } from '@/pages/storefront/ExchangesPage';
import { OrdersSection } from '@/pages/storefront/OrdersPage';
// prettier-ignore
import {
  AccountAddresses,
} from '@/components/customer/account/AccountAddresses';
import { AccountCards } from '@/components/customer/account/AccountCards';
import { AccountProfile } from '@/components/customer/account/AccountProfile';
import { ChatPreferences } from '@/components/customer/account/ChatPreferences';

function AccountPageContent() {
  const {
    addAddress,
    addCard,
    removeCard,
    removeAddress,
    logout,
    setPreferredCard,
    state,
    updateCard,
    updateAddress,
    updateCustomer,
  } = useCommerce();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDeactivatingAccount, setIsDeactivatingAccount] = useState(false);
  const [isDeactivationDialogOpen, setIsDeactivationDialogOpen] =
    useState(false);
  const [deactivationError, setDeactivationError] = useState('');
  const [addressRemovalError, setAddressRemovalError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const requestedSection = searchParams.get('secao');
  const validSections: CustomerAccountSection[] = [
    'addresses',
    'cards',
    'coupons',
    'exchanges',
    'orders',
    'preferences',
    'profile',
  ];
  const activeSection = validSections.includes(
    requestedSection as CustomerAccountSection,
  )
    ? (requestedSection as CustomerAccountSection)
    : 'profile';
  const customer = state.customer;

  if (!state.sessionHydrated) {
    return (
      <div className='bg-background'>
        <PageContainer className='py-10 text-sm text-muted-foreground sm:py-14'>
          Carregando sua conta...
        </PageContainer>
      </div>
    );
  }

  if (!customer || state.sessionCustomerId !== customer.id) {
    return <Navigate replace to='/entrar' />;
  }

  function selectSection(section: CustomerAccountSection) {
    setIsAdding(false);
    setSearchParams(section === 'profile' ? {} : { secao: section });
  }

  async function deactivateAccount() {
    setDeactivationError('');
    setIsDeactivatingAccount(true);
    try {
      await customerApi.deactivateOwnAccount();
      logout();
    } catch (reason) {
      setDeactivationError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível desativar sua conta.',
      );
      setIsDeactivationDialogOpen(false);
    } finally {
      setIsDeactivatingAccount(false);
    }
  }

  async function removeCustomerAddress(addressId: string) {
    try {
      await removeAddress(addressId);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '';
      setAddressRemovalError(
        message.includes('manter um endereço')
          ? [
              'É necessário manter pelo menos um',
              'endereço de cobrança e um de',
              'entrega.',
            ].join(' ')
          : 'Não foi possível remover este endereço.',
      );
    }
  }

  return (
    <>
      <>
        <div
          className={[
            'mt-8 grid gap-8',
            'lg:grid-cols-[14rem_minmax(0,1fr)]',
            'lg:items-start',
          ].join(' ')}
        >
          <CustomerAccountSidebar
            activeSection={activeSection}
            onSectionChange={selectSection}
          />
          <section>
            {activeSection === 'profile' ? (
              <AccountProfile
                customer={customer}
                deactivationError={deactivationError}
                isDeactivatingAccount={isDeactivatingAccount}
                onDeactivate={() => setIsDeactivationDialogOpen(true)}
                updateCustomer={updateCustomer}
              />
            ) : null}
            {activeSection === 'addresses' ? (
              <AccountAddresses
                addresses={state.addresses}
                isAdding={isAdding}
                onAdd={addAddress}
                onRemove={removeCustomerAddress}
                onUpdate={updateAddress}
                setIsAdding={setIsAdding}
              />
            ) : null}
            {activeSection === 'cards' ? (
              <AccountCards
                cards={state.cards}
                isAdding={isAdding}
                onAdd={addCard}
                onRemove={removeCard}
                onSetPreferred={setPreferredCard}
                onUpdate={updateCard}
                setIsAdding={setIsAdding}
              />
            ) : null}
            {activeSection === 'orders' ? <OrdersSection /> : null}
            {activeSection === 'coupons' ? <CouponsSection /> : null}
            {activeSection === 'exchanges' ? <ExchangesSection /> : null}
            {activeSection === 'preferences' ? <ChatPreferences /> : null}
          </section>
        </div>
      </>
      {isDeactivationDialogOpen ? (
        <ConfirmDialog
          confirmLabel='Desativar conta'
          description={[
            'Sua sessão será encerrada e sua',
            'conta deixará de aparecer na lista',
            'ativa.',
          ].join(' ')}
          onCancel={() => setIsDeactivationDialogOpen(false)}
          onConfirm={() => void deactivateAccount()}
          title='Desativar minha conta?'
        />
      ) : null}
      {addressRemovalError ? (
        <Toast
          message={addressRemovalError}
          onClose={() => setAddressRemovalError('')}
          variant='error'
        />
      ) : null}
    </>
  );
}

export function AccountPage() {
  const { state } = useCommerce();
  const customer = state.customer;

  if (
    !state.sessionHydrated ||
    !customer ||
    state.sessionCustomerId !== customer.id
  ) {
    return (
      <PageContent overlap={false}>
        <AccountPageContent />
      </PageContent>
    );
  }

  return (
    <Page
      description='Gerencie seus dados pessoais, endereços e cartões.'
      overlap
      title={`Olá, ${customer.name.split(' ')[0]}`}
    >
      <AccountPageContent />
    </Page>
  );
}

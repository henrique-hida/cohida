import { ChatMessageItem } from './chat/ChatMessageItem';
import { ChatProfile } from './chat/ChatProfile';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useChat } from './chat/useChat';
import {
  ArrowUp,
  BotMessageSquare,
  SlidersHorizontal,
  Sparkles,
  MessageSquarePlus,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommerce } from '@/data/useCommerce';
import { getSessionRole } from '@/lib/customerApi';

export function ChatbotFab() {
  const { pathname } = useLocation();
  const { state } = useCommerce();
  if (pathname.startsWith('/admin')) return null;
  const customerId =
    getSessionRole() === 'CUSTOMER' ? state.sessionCustomerId : null;
  return <ChatWindow key={customerId ?? 'guest'} customerId={customerId} />;
}

function ChatWindow({ customerId }: { customerId: string | null }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const {
    isOpen,
    setIsOpen,
    messages,
    prompt,
    setPrompt,
    busy,
    loadingPreferences,
    setLoadingPreferences,
    generatingSuggestions,
    suggestions,
    error,
    notice,
    messagesEndRef,
    sendMessage,
    clearHistory,
    rate,
  } = useChat(customerId);

  return (
    <div
      className={['fixed right-4 bottom-4 z-40 sm:right-6', 'sm:bottom-6'].join(
        ' ',
      )}
    >
      {isOpen && (
        <section
          aria-label='Assistente coHida'
          className={[
            'absolute right-0 bottom-full mb-3 flex',
            'max-h-[min(42rem,80vh)]',
            'w-[min(24rem,calc(100vw-2rem))] flex-col',
            'overflow-hidden rounded-3xl border',
            'border-border/70 bg-card shadow-2xl',
          ].join(' ')}
        >
          <header
            className={[
              ['flex items-center justify-between', 'border-b'].join(' '),
              'border-border/60 bg-primary px-4 py-2 text-primary-foreground',
            ].join(' ')}
          >
            <div className='flex items-center gap-3'>
              <span
                className={[
                  ['grid size-8 place-items-center', 'rounded-lg'].join(' '),
                  'bg-primary-foreground/15 text-primary-foreground',
                ].join(' ')}
              >
                <BotMessageSquare className='size-4' />
              </span>
              <h2 className='font-semibold'>Assistente coHida</h2>
            </div>
            <Button
              aria-label='Fechar assistente'
              onClick={() => setIsOpen(false)}
              size='icon-sm'
              variant='ghost'
            >
              <X />
            </Button>
          </header>
          {!customerId ? (
            <p className='p-4 text-sm'>
              Para conversar com o assistente,{' '}
              <Link className='underline' to='/entrar'>
                entre na sua conta
              </Link>
              .
            </p>
          ) : (
            <>
              <div className='min-h-0 overflow-y-auto'>
                <ChatProfile />
                <div aria-live='polite' className='grid gap-3 p-4'>
                  <p
                    className={[
                      ['max-w-[90%] rounded-xl bg-muted', 'px-3 py-2'].join(
                        ' ',
                      ),
                      'text-sm',
                    ].join(' ')}
                  >
                    Olá! Conte o que você procura e eu ajudo a encontrar artigos
                    esportivos.
                  </p>
                  {messages.map((message, index) => (
                    <ChatMessageItem
                      key={`${message.role}-${index}`}
                      message={message}
                      busy={busy}
                      sendMessage={sendMessage}
                      rate={rate}
                      onNavigate={() => setIsOpen(false)}
                    />
                  ))}
                  {busy && (
                    <p className='text-sm text-muted-foreground'>Pensando...</p>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className='flex flex-wrap gap-2 px-4 pb-3'>
                  {loadingPreferences || generatingSuggestions ? (
                    <div
                      aria-label='Preparando sugestões'
                      className='flex flex-wrap gap-2'
                      role='status'
                    >
                      <Skeleton aria-hidden='true' className='h-6 w-36' />
                      <Skeleton aria-hidden='true' className='h-6 w-44' />
                      <Skeleton aria-hidden='true' className='h-6 w-40' />
                      <Skeleton aria-hidden='true' className='h-6 w-32' />
                      <Skeleton aria-hidden='true' className='h-6 w-48' />
                    </div>
                  ) : (
                    suggestions.map((suggestion) => (
                      <Button
                        className={[
                          'h-auto max-w-full whitespace-normal',
                          'text-left',
                        ].join(' ')}
                        disabled={busy || loadingPreferences}
                        key={suggestion}
                        onClick={() => void sendMessage(suggestion)}
                        size='xs'
                        type='button'
                        variant='outline'
                      >
                        {suggestion}
                      </Button>
                    ))
                  )}
                </div>
              </div>
              {error && (
                <p className='px-3 py-2 text-sm text-destructive' role='alert'>
                  {error}
                </p>
              )}
              {notice && (
                <p className='px-3 py-2 text-sm' role='status'>
                  {notice}
                </p>
              )}
              <div className='flex gap-2 border-t border-border px-3 pt-2'>
                <Button
                  nativeButton={false}
                  render={<Link to='/conta?secao=preferences' />}
                  onClick={() => setIsOpen(false)}
                  size='xs'
                  variant='ghost'
                  aria-label='Preferências de categorias'
                >
                  <SlidersHorizontal /> Preferências
                </Button>
                <Button
                  disabled={busy || loadingPreferences || !messages.length}
                  onClick={() => setConfirmClear(true)}
                  size='xs'
                  variant='ghost'
                >
                  <MessageSquarePlus /> Novo chat
                </Button>
              </div>
              <form
                className='flex gap-2 p-3 pt-2'
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage();
                }}
              >
                <input
                  aria-label='Sua mensagem'
                  className={[
                    ['h-9 min-w-0 flex-1 rounded-lg', 'border'].join(' '),
                    ['border-input bg-background px-3', 'text-sm'].join(' '),
                    'outline-none focus-visible:ring-3',
                    'focus-visible:ring-ring/50',
                  ].join(' ')}
                  disabled={busy || loadingPreferences}
                  maxLength={2000}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder='Digite sua pergunta'
                  value={prompt}
                />
                <Button
                  aria-label='Enviar mensagem'
                  disabled={busy || loadingPreferences || !prompt.trim()}
                  size='icon-sm'
                  type='submit'
                >
                  <ArrowUp />
                </Button>
              </form>
            </>
          )}
        </section>
      )}
      {confirmClear && (
        <ConfirmDialog
          title='Iniciar novo chat?'
          description='A conversa atual e suas avaliações serão apagadas.'
          confirmLabel='Novo chat'
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            setConfirmClear(false);
            void clearHistory();
          }}
        />
      )}
      <Button
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Fechar assistente' : 'Abrir assistente coHida'}
        className='h-12 rounded-full px-4 shadow-lg'
        onClick={() => {
          if (!isOpen && customerId) setLoadingPreferences(true);
          setIsOpen((open) => !open);
        }}
        size='lg'
      >
        <Sparkles />
        <span className='hidden sm:inline'>Precisa de ajuda?</span>
        <span className='sm:hidden'>Assistente</span>
      </Button>
    </div>
  );
}

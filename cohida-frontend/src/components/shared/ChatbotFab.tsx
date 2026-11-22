import {
  ArrowUp,
  BotMessageSquare,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useLocation } from 'react-router';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChatProductCard,
  type ChatProduct,
} from '@/components/shared/ChatProductCard';
import { useCommerce } from '@/data/useCommerce';
import { apiRequest, getSessionRole } from '@/lib/customerApi';
interface ChatMessage {
  content: string;
  role: 'assistant' | 'user';
  id?: number;
  useful?: boolean;
  clientId?: string;
  failed?: boolean;
  products?: ChatProduct[];
}

const chatbotSuggestions = [
  'Quero começar a correr',
  'Equipamentos para treino?',
  'Produtos para futebol?',
  'Itens para trilha?',
  'Presente para treinar?',
];

export function ChatbotFab() {
  const { pathname } = useLocation();
  const { state } = useCommerce();
  if (pathname.startsWith('/admin')) return null;
  const customerId =
    getSessionRole() === 'CUSTOMER' ? state.sessionCustomerId : null;
  return <ChatWindow key={customerId ?? 'guest'} customerId={customerId} />;
}

function ChatWindow({ customerId }: { customerId: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [preferences, setPreferences] = useState('');
  const [savedPreferences, setSavedPreferences] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [isOpen, messages, busy]);

  useEffect(() => {
    if (!customerId || !isOpen) return;
    let active = true;
    async function loadPreferences() {
      try {
        const [data, saved] = await Promise.all([
          apiRequest<{ preferences: string }>('/customers/me/chat/preferences'),
          apiRequest<{ suggestions: string[] }>(
            '/customers/me/chat/suggestions',
          ),
        ]);
        if (!active) return;
        setPreferences(data.preferences);
        setSavedPreferences(data.preferences);
        setSuggestions(saved.suggestions);
        if (data.preferences && saved.suggestions.length === 0) {
          setGeneratingSuggestions(true);
          try {
            const generated = await apiRequest<{
              suggestions: string[];
              fallback: boolean;
            }>('/customers/me/chat/suggestions', {
              method: 'POST',
            });
            if (active) {
              setSuggestions(generated.suggestions);
              if (generated.fallback)
                setNotice(
                  [
                    'A IA está indisponível; salvei',
                    'sugestões baseadas nas suas',
                    'preferências.',
                  ].join(' '),
                );
            }
          } catch {
            if (active)
              setNotice(
                'O assistente não respondeu; mantive as sugestões disponíveis.',
              );
          } finally {
            if (active) setGeneratingSuggestions(false);
          }
        }
      } catch {
        if (active) setError('Não foi possível carregar suas preferências.');
      } finally {
        if (active) setLoadingPreferences(false);
      }
    }
    void loadPreferences();
    return () => {
      active = false;
    };
  }, [customerId, isOpen]);

  async function generateSuggestions() {
    setGeneratingSuggestions(true);
    setNotice('');
    try {
      const data = await apiRequest<{
        suggestions: string[];
        fallback: boolean;
      }>('/customers/me/chat/suggestions', { method: 'POST' });
      setSuggestions(data.suggestions);
      setNotice(
        data.fallback
          ? [
              'A IA não respondeu; salvei',
              'sugestões baseadas nas suas',
              'preferências.',
            ].join(' ')
          : 'Sugestões personalizadas atualizadas.',
      );
    } catch {
      setNotice(
        'O assistente não respondeu; mantive as sugestões disponíveis.',
      );
    } finally {
      setGeneratingSuggestions(false);
    }
  }

  async function savePreferences() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const data = await apiRequest<{ preferences: string }>(
        '/customers/me/chat/preferences',
        {
          method: 'PUT',
          body: JSON.stringify({ preferences }),
        },
      );
      setPreferences(data.preferences);
      setSavedPreferences(data.preferences);
      setSuggestions([]);
      setNotice('Preferências salvas.');
      if (data.preferences) await generateSuggestions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar suas preferências.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function sendMessage(value = prompt, retryId?: string) {
    const trimmed = value.trim();
    if (!trimmed || busy || !customerId) return;
    const history = messages
      .filter(
        (message) =>
          !message.failed && (!retryId || message.clientId !== retryId),
      )
      .slice(-20)
      .map(({ role, content }) => ({ role, content }));
    const clientId = retryId ?? crypto.randomUUID();
    setMessages((current) =>
      retryId
        ? current.map((message) =>
            message.clientId === retryId
              ? { ...message, failed: false }
              : message,
          )
        : [...current, { content: trimmed, role: 'user', clientId }],
    );
    if (!retryId && value === prompt) setPrompt('');
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await apiRequest<{
        id: number;
        content: string;
        products: ChatProduct[];
      }>('/customers/me/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ message: trimmed, history }),
      });
      setMessages((current) => [
        ...current,
        { ...response, role: 'assistant' },
      ]);
    } catch (err) {
      setMessages((current) =>
        current.map((message) =>
          message.clientId === clientId
            ? { ...message, failed: true }
            : message,
        ),
      );
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível enviar sua mensagem.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function rate(id: number, useful: boolean) {
    setError('');
    try {
      await apiRequest<void>(`/customers/me/chat/messages/${id}/feedback`, {
        method: 'PUT',
        body: JSON.stringify({ useful }),
      });
      setMessages((current) =>
        current.map((message) =>
          message.id === id ? { ...message, useful } : message,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível registrar sua avaliação.',
      );
    }
  }

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
            'overflow-hidden rounded-2xl border',
            'border-border bg-card shadow-2xl',
          ].join(' ')}
        >
          <header
            className={[
              ['flex items-center justify-between', 'border-b'].join(' '),
              'border-border p-4',
            ].join(' ')}
          >
            <div className='flex items-center gap-3'>
              <span
                className={[
                  ['grid size-9 place-items-center', 'rounded-lg'].join(' '),
                  'bg-primary text-primary-foreground',
                ].join(' ')}
              >
                <BotMessageSquare className='size-4' />
              </span>
              <div>
                <h2 className='font-semibold'>Assistente coHida</h2>
                <p className='text-xs text-muted-foreground'>
                  Produtos e recomendações
                </p>
              </div>
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
                <details className='border-b border-border p-3 text-sm'>
                  <summary className='cursor-pointer font-medium'>
                    Suas preferências
                  </summary>
                  <p className='mt-2 text-muted-foreground'>
                    Conte quais esportes pratica, seus objetivos e o que
                    procura.
                  </p>
                  <textarea
                    aria-label='Preferências esportivas'
                    className={[
                      ['mt-2 w-full rounded-lg border', 'border-input'].join(
                        ' ',
                      ),
                      'bg-background p-2',
                    ].join(' ')}
                    maxLength={1000}
                    disabled={
                      loadingPreferences || saving || generatingSuggestions
                    }
                    onChange={(event) => setPreferences(event.target.value)}
                    rows={3}
                    value={preferences}
                  />
                  <Button
                    disabled={
                      saving ||
                      loadingPreferences ||
                      generatingSuggestions ||
                      preferences === savedPreferences
                    }
                    onClick={() => void savePreferences()}
                    size='xs'
                    type='button'
                  >
                    Salvar preferências
                  </Button>
                  {savedPreferences &&
                    suggestions.length === 0 &&
                    !loadingPreferences &&
                    !generatingSuggestions && (
                      <Button
                        className='ml-2'
                        onClick={() => void generateSuggestions()}
                        size='xs'
                        type='button'
                        variant='outline'
                      >
                        Gerar sugestões
                      </Button>
                    )}
                </details>
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
                    <div
                      className={
                        message.role === 'user'
                          ? 'justify-self-end'
                          : 'max-w-[90%]'
                      }
                      key={`${message.role}-${index}`}
                    >
                      {message.role === 'assistant' ? (
                        <div
                          className={[
                            'min-w-0 overflow-hidden rounded-xl',
                            'bg-muted px-3 py-2 text-sm',
                            'leading-6 break-words',
                            'text-foreground [&_a]:underline',
                            '[&_li]:ml-4 [&_ol]:list-decimal',
                            '[&_p:not(:last-child)]:mb-3',
                            '[&_ul]:list-disc',
                          ].join(' ')}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              table: ({ children }) => (
                                <div className='my-2 overflow-x-auto'>
                                  <table
                                    className={[
                                      'w-full border-collapse text-left',
                                      'text-xs [&_td]:border',
                                      '[&_td]:border-border [&_td]:p-1',
                                      '[&_th]:border [&_th]:border-border',
                                      '[&_th]:p-1',
                                    ].join(' ')}
                                  >
                                    {children}
                                  </table>
                                </div>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p
                          className={[
                            [
                              'whitespace-pre-wrap rounded-xl',
                              'bg-primary',
                            ].join(' '),
                            'px-3 py-2 text-sm leading-6',
                            'text-primary-foreground',
                          ].join(' ')}
                        >
                          {message.content}
                        </p>
                      )}
                      {message.role === 'assistant' &&
                        message.products &&
                        message.products.length > 0 && (
                          <div className='mt-2 grid gap-2'>
                            {message.products.map((product) => (
                              <ChatProductCard
                                key={product.id}
                                product={product}
                                onNavigate={() => setIsOpen(false)}
                              />
                            ))}
                          </div>
                        )}
                      {message.failed && (
                        <div className='mt-1 text-right'>
                          <Button
                            disabled={busy}
                            onClick={() =>
                              void sendMessage(
                                message.content,
                                message.clientId,
                              )
                            }
                            size='xs'
                            type='button'
                            variant='outline'
                          >
                            Tentar novamente
                          </Button>
                        </div>
                      )}
                      {message.id && (
                        <div className='mt-1 flex items-center gap-1'>
                          <span className='text-xs text-muted-foreground'>
                            Esta resposta ajudou?
                          </span>
                          <Button
                            aria-label='Resposta útil'
                            aria-pressed={message.useful === true}
                            onClick={() => void rate(message.id!, true)}
                            size='icon-sm'
                            variant={
                              message.useful === true ? 'secondary' : 'ghost'
                            }
                          >
                            <ThumbsUp />
                          </Button>
                          <Button
                            aria-label='Resposta não útil'
                            aria-pressed={message.useful === false}
                            onClick={() => void rate(message.id!, false)}
                            size='icon-sm'
                            variant={
                              message.useful === false ? 'secondary' : 'ghost'
                            }
                          >
                            <ThumbsDown />
                          </Button>
                          {message.useful !== undefined && (
                            <span className='text-xs'>
                              Avaliação registrada
                            </span>
                          )}
                        </div>
                      )}
                    </div>
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
                    (suggestions.length > 0
                      ? suggestions
                      : chatbotSuggestions
                    ).map((suggestion) => (
                      <Button
                        disabled={busy}
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
              <form
                className='flex gap-2 border-t border-border p-3'
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
                  disabled={busy}
                  maxLength={2000}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder='Digite sua pergunta'
                  value={prompt}
                />
                <Button
                  aria-label='Enviar mensagem'
                  disabled={busy || !prompt.trim()}
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

import { ThumbsDown, ThumbsUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { ChatProductCard } from '@/components/shared/ChatProductCard';
import type { ChatMessage } from './types';
import type { useChat } from './useChat';

type Props = {
  message: ChatMessage;
  busy: boolean;
  sendMessage: ReturnType<typeof useChat>['sendMessage'];
  rate: ReturnType<typeof useChat>['rate'];
  onNavigate: () => void;
};

export function ChatMessageItem({
  message,
  busy,
  sendMessage,
  rate,
  onNavigate,
}: Props) {
  return (
    <div
      className={message.role === 'user' ? 'justify-self-end' : 'max-w-[90%]'}
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
            ['whitespace-pre-wrap rounded-xl', 'bg-primary'].join(' '),
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
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      {message.failed && (
        <div className='mt-1 text-right'>
          <Button
            disabled={busy}
            onClick={() => void sendMessage(message.content, message.clientId)}
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
            variant={message.useful === true ? 'secondary' : 'ghost'}
          >
            <ThumbsUp />
          </Button>
          <Button
            aria-label='Resposta não útil'
            aria-pressed={message.useful === false}
            onClick={() => void rate(message.id!, false)}
            size='icon-sm'
            variant={message.useful === false ? 'secondary' : 'ghost'}
          >
            <ThumbsDown />
          </Button>
          {message.useful !== undefined && (
            <span className='text-xs'>Avaliação registrada</span>
          )}
        </div>
      )}
    </div>
  );
}

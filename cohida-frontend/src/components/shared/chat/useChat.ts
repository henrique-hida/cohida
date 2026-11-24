import { useEffect, useRef, useState } from 'react';
import type { ChatProduct } from '@/components/shared/ChatProductCard';
import { apiRequest } from '@/lib/customerApi';
import type { ChatMessage } from './types';

export function useChat(customerId: string | null) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyLoaded = useRef(false);
  const historyVersion = useRef(0);

  useEffect(() => {
    function handleHistoryCleared() {
      historyVersion.current += 1;
      historyLoaded.current = true;
      setMessages([]);
      setNotice('Conversa e avaliações removidas.');
    }
    window.addEventListener(
      'cohida:chat-history-cleared',
      handleHistoryCleared,
    );
    return () =>
      window.removeEventListener(
        'cohida:chat-history-cleared',
        handleHistoryCleared,
      );
  }, [customerId]);

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
    const version = historyVersion.current;
    async function loadPreferences() {
      try {
        const [saved, history] = await Promise.all([
          apiRequest<{ suggestions: string[] }>(
            '/customers/me/chat/profile-suggestions',
          ),
          historyLoaded.current
            ? Promise.resolve(null)
            : apiRequest<
                {
                  id: number;
                  question: string;
                  response: string;
                  useful: boolean | null;
                  products: ChatProduct[];
                }[]
              >('/customers/me/chat/messages'),
        ]);
        if (!active) return;
        if (history && version === historyVersion.current) {
          setMessages(
            history.flatMap((entry) => [
              { role: 'user' as const, content: entry.question },
              {
                role: 'assistant' as const,
                content: entry.response,
                id: entry.id,
                useful: entry.useful ?? undefined,
                products: entry.products,
              },
            ]),
          );
          historyLoaded.current = true;
        }
        setSuggestions(saved.suggestions);
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

  useEffect(() => {
    if (!customerId || !isOpen) return;
    function updateSuggestions() {
      setGeneratingSuggestions(true);
      apiRequest<{ suggestions: string[] }>(
        '/customers/me/chat/profile-suggestions',
      )
        .then((result) => setSuggestions(result.suggestions))
        .catch(() => setNotice('Não foi possível atualizar as sugestões.'))
        .finally(() => setGeneratingSuggestions(false));
    }
    window.addEventListener('cohida:preferences-changed', updateSuggestions);
    return () =>
      window.removeEventListener(
        'cohida:preferences-changed',
        updateSuggestions,
      );
  }, [customerId, isOpen]);

  async function clearHistory() {
    setBusy(true);
    setError('');
    try {
      await apiRequest<void>('/customers/me/chat/messages', {
        method: 'DELETE',
      });
      window.dispatchEvent(new Event('cohida:chat-history-cleared'));
      window.dispatchEvent(new Event('cohida:preferences-changed'));
    } catch {
      setError('Não foi possível iniciar um novo chat.');
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(value = prompt, retryId?: string) {
    const trimmed = value.trim();
    if (!trimmed || busy || !customerId) return;
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
        suggestedInterest: string | null;
      }>('/customers/me/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ message: trimmed }),
      });
      setMessages((current) => [
        ...current,
        { ...response, role: 'assistant' },
      ]);
      window.dispatchEvent(new Event('cohida:preferences-changed'));
      if (response.suggestedInterest) {
        window.dispatchEvent(new Event('cohida:category-interests-changed'));
        setNotice(`Categoria adicionada: ${response.suggestedInterest}.`);
      }
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
      window.dispatchEvent(new Event('cohida:preferences-changed'));
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

  return {
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
  };
}

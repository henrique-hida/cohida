import type { ChatProduct } from '@/components/shared/ChatProductCard';

export interface ChatMessage {
  content: string;
  role: 'assistant' | 'user';
  id?: number;
  useful?: boolean;
  clientId?: string;
  failed?: boolean;
  products?: ChatProduct[];
}

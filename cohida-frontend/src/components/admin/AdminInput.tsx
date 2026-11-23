import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';
import { adminInputClassName } from './AdminFormField';

export function AdminInput({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(adminInputClassName, className)} {...props} />;
}

import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';
import { adminTextareaClassName } from './AdminFormField';

export function AdminTextarea({
  className,
  ...props
}: ComponentProps<'textarea'>) {
  return (
    <textarea className={cn(adminTextareaClassName, className)} {...props} />
  );
}

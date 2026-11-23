import type { ComponentProps, ReactNode } from 'react';
import { Outlet } from 'react-router';

import { cn } from '@/lib/utils';
import { StoreFooter } from './StoreFooter';
import { StoreHeader } from './StoreHeader';

type StorefrontLayoutProps = {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  headerProps?: ComponentProps<typeof StoreHeader>;
};

export function StorefrontLayout({
  children,
  className,
  contentClassName,
  headerProps,
}: StorefrontLayoutProps) {
  return (
    <div className={cn('flex min-h-svh flex-col bg-background', className)}>
      <StoreHeader {...headerProps} />
      <div className={cn('flex-1', contentClassName)}>
        {children ?? <Outlet />}
      </div>
      <StoreFooter />
    </div>
  );
}

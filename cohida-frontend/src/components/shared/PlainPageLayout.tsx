import type { ComponentProps } from 'react';
import { Outlet } from 'react-router';

export function PlainPageLayout({
  children,
  ...props
}: ComponentProps<'main'>) {
  return <main {...props}>{children ?? <Outlet />}</main>;
}

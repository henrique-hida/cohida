import type { ReactNode } from 'react';

interface PageHeaderProps {
  action?: ReactNode;
  description: ReactNode;
  eyebrow?: ReactNode;
  overlap?: boolean;
  title: ReactNode;
}

export function PageHeader({
  action,
  description,
  eyebrow,
  overlap = false,
  title,
}: PageHeaderProps) {
  return (
    <div className='relative'>
      <div
        aria-hidden='true'
        className={[
          'pointer-events-none absolute inset-0',
          'bg-linear-to-t from-primary to-teal-700',
        ].join(' ')}
      />
      <header
        data-slot='page-header'
        className={[
          'relative z-10 mx-auto flex w-full ',
          'max-w-7xl flex-col gap-5 px-5 pt-8 ',
          'text-primary-foreground sm:flex-row ',
          'sm:items-start sm:justify-between ',
          'sm:px-8 ',
          String(overlap ? 'pb-12 sm:pb-14' : 'pb-8'),
        ].join('')}
      >
        <div className='min-w-0'>
          {eyebrow ? (
            <p className='text-sm font-semibold text-primary-foreground/75'>
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={[
              String(eyebrow ? 'mt-1' : 'mt-0'),
              ' text-3xl font-semibold ',
              'tracking-tight sm:text-4xl',
            ].join('')}
          >
            {title}
          </h1>
          {description ? (
            <p
              className={[
                'mt-2 max-w-2xl text-sm',
                'text-primary-foreground/80 sm:text-base',
              ].join(' ')}
            >
              {description}
            </p>
          ) : null}
        </div>
        {action ? (
          <div
            className={[
              'flex shrink-0 flex-wrap',
              'items-center gap-2',
              '[&_[data-slot=button]]:min-h-11',
              '[&_[data-slot=button]]:border-primary-foreground/50',
              '[&_[data-slot=button]]:bg-primary-foreground/15',
              '[&_[data-slot=button]]:text-primary-foreground',
              '[&_[data-slot=button]]:shadow-sm',
              '[&_[data-slot=button]]:backdrop-blur-md',
              '[&_[data-slot=button]:hover]:bg-primary-foreground/25',
              '[&_[data-slot=button]:focus-visible]:ring-primary-foreground/60',
            ].join(' ')}
          >
            {action}
          </div>
        ) : null}
      </header>
    </div>
  );
}

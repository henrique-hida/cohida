import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { apiRequest, getSessionRole } from '@/lib/customerApi';

interface CustomerNotification {
  id: number;
  type: string;
  message: string;
  targetPath: string | null;
  read: boolean;
}

export function NotificationMenu({
  sessionCustomerId,
}: {
  sessionCustomerId: string | null;
}) {
  const [notifications, setNotifications] = useState<CustomerNotification[]>(
    [],
  );
  useEffect(() => {
    if (getSessionRole() !== 'CUSTOMER') {
      const timer = window.setTimeout(() => setNotifications([]), 0);
      return () => window.clearTimeout(timer);
    }
    const refreshNotifications = () => {
      void apiRequest<CustomerNotification[]>('/customers/me/notifications')
        .then(setNotifications)
        .catch(() => setNotifications([]));
    };
    refreshNotifications();
    window.addEventListener(
      'cohida:notifications-refresh',
      refreshNotifications,
    );
    return () =>
      window.removeEventListener(
        'cohida:notifications-refresh',
        refreshNotifications,
      );
  }, [sessionCustomerId]);

  return (
    <Popover
      onOpenChange={(open) => {
        if (open)
          window.dispatchEvent(new Event('cohida:notifications-refresh'));
      }}
    >
      <PopoverTrigger
        render={
          <Button aria-label='Notificações' size='icon' variant='outline' />
        }
      >
        <Bell />
      </PopoverTrigger>
      <PopoverContent align='end' className='w-72 p-4'>
        <p className='font-medium'>Notificações</p>
        {notifications.length ? (
          <div className='mt-3 grid gap-2'>
            {notifications.map((notification) => (
              <Link
                className={[
                  'rounded-lg bg-muted p-3 text-sm',
                  'hover:bg-muted/70',
                ].join(' ')}
                key={notification.id}
                to={notification.targetPath ?? '/pedidos'}
              >
                {notification.message}
              </Link>
            ))}
          </div>
        ) : (
          <p className='mt-1 text-sm text-muted-foreground'>
            Você não tem novas notificações.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

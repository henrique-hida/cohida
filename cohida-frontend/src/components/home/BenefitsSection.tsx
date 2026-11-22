import { RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { PageContainer } from '@/components/shared';

export function BenefitsSection() {
  return (
    <section className='border-t border-border bg-muted/45'>
      <PageContainer
        className={[
          'grid gap-7 py-10 sm:grid-cols-3 sm:gap-10',
          'sm:py-14',
        ].join(' ')}
      >
        {[
          {
            icon: Truck,
            text: 'Entrega para todo o Brasil',
            title: 'Pronto para chegar',
          },
          {
            icon: RotateCcw,
            text: 'Solicitação simples pela sua conta',
            title: 'Troca descomplicada',
          },
          {
            icon: ShieldCheck,
            text: 'Pagamento e dados protegidos',
            title: 'Compra segura',
          },
        ].map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div className='flex items-center gap-4' key={benefit.title}>
              <span
                className={[
                  'grid size-12 shrink-0 place-items-center',
                  'rounded-xl bg-background text-primary',
                  'ring-1 ring-border',
                ].join(' ')}
              >
                <Icon className='size-5' />
              </span>
              <div>
                <p className='font-medium'>{benefit.title}</p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {benefit.text}
                </p>
              </div>
            </div>
          );
        })}
      </PageContainer>
    </section>
  );
}

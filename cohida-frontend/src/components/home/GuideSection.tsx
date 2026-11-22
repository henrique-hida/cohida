import { Link } from 'react-router';
import { BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
const homeGuide = {
  description: [
    'Entenda amortecimento, ajuste e',
    'tipo de treino antes de escolher',
    'seu próximo par.',
  ].join(' '),
  title: 'Guia rápido: como escolher seu tênis de corrida',
};

export function GuideSection() {
  return (
    <section
      className={[
        'mt-20 grid gap-6',
        'lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,.85fr)]',
      ].join(' ')}
    >
      <article className='rounded-2xl border border-border bg-card p-6 sm:p-8'>
        <div
          className={[
            'flex size-11 items-center justify-center',
            'rounded-xl bg-primary',
            'text-primary-foreground',
          ].join(' ')}
        >
          <BookOpen className='size-5' />
        </div>
        <h2 className='mt-6 text-2xl font-semibold tracking-tight'>
          {homeGuide.title}
        </h2>
        <p className='mt-3 max-w-2xl leading-7 text-muted-foreground'>
          {homeGuide.description}
        </p>
        <Button
          className='mt-6'
          render={<Link to='/produtos?categoria=running' />}
          variant='outline'
        >
          Ler guia e ver opções
        </Button>
      </article>
      <article
        className={[
          'rounded-2xl bg-primary p-6',
          'text-primary-foreground sm:p-8',
        ].join(' ')}
      >
        <Sparkles className='size-6' />
        <h2 className='mt-6 text-2xl font-semibold tracking-tight'>
          Não sabe por onde começar?
        </h2>
        <p className='mt-3 leading-7 text-primary-foreground/80'>
          Conte seu objetivo ao assistente coHida e receba uma seleção para sua
          rotina.
        </p>
        <p className='mt-6 text-sm font-medium'>
          Abra o assistente no canto da tela.
        </p>
      </article>
    </section>
  );
}

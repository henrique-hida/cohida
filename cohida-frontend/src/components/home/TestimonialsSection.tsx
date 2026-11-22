import { HeartHandshake, Medal, Star, UsersRound } from 'lucide-react';

const trustIcons = [UsersRound, Star, HeartHandshake];

interface HomeTestimonial {
  name: string;
  quote: string;
  sport: string;
  rating: number;
}

const homeTestimonials: HomeTestimonial[] = [
  {
    name: 'Marina Alves',
    quote: [
      'Encontrei exatamente o que',
      'precisava para voltar a correr com',
      'confiança.',
    ].join(' '),
    sport: 'Corrida',
    rating: 5,
  },
  {
    name: 'Lucas Ferreira',
    quote:
      'A recomendação facilitou muito montar um kit funcional sem exageros.',
    sport: 'Treino funcional',
    rating: 4.5,
  },
  {
    name: 'Ana Costa',
    quote: 'Entrega rápida e produto ainda melhor do que eu esperava.',
    sport: 'Futebol',
    rating: 5,
  },
  {
    name: 'Rafael Mendes',
    quote: [
      'O tênis ficou confortável desde o',
      'primeiro treino e chegou antes do',
      'prazo.',
    ].join(' '),
    sport: 'Corrida',
    rating: 4.5,
  },
  {
    name: 'Camila Rocha',
    quote: [
      'Achei os equipamentos que',
      'precisava para treinar em casa sem',
      'complicação.',
    ].join(' '),
    sport: 'Treino funcional',
    rating: 5,
  },
  {
    name: 'Bruno Carvalho',
    quote: 'A bola tem ótimo toque e está aguentando bem os jogos da semana.',
    sport: 'Futebol',
    rating: 4,
  },
  {
    name: 'Juliana Martins',
    quote: [
      'A mochila é leve, cabe tudo para',
      'minhas trilhas curtas e os bolsos',
      'são práticos.',
    ].join(' '),
    sport: 'Outdoor',
    rating: 5,
  },
  {
    name: 'Diego Santos',
    quote: [
      'Consegui comparar as opções e',
      'escolher um produto que combina',
      'com minha rotina.',
    ].join(' '),
    sport: 'Treino funcional',
    rating: 4.5,
  },
  {
    name: 'Fernanda Lima',
    quote:
      'Boa variedade de produtos e descrição clara para acertar na escolha.',
    sport: 'Artes marciais',
    rating: 4,
  },
];

const homeTrustMetrics = [
  { label: 'atletas equipados', value: '+12 mil' },
  { label: 'avaliação média', value: '4,8 / 5' },
  { label: 'de satisfação', value: '98%' },
];

function TestimonialCard({ testimonial }: { testimonial: HomeTestimonial }) {
  return (
    <article
      className={[
        'flex h-52 w-[280px] flex-col rounded-3xl',
        'border border-border bg-card p-5 shadow-md',
        'sm:w-[340px] sm:p-6',
      ].join(' ')}
    >
      <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
        <p className='text-sm font-semibold'>{testimonial.name}</p>
        <div
          aria-label={[
            String(testimonial.rating.toLocaleString('pt-BR')),
            ' de 5 estrelas',
          ].join('')}
          className='flex gap-0.5'
          role='img'
        >
          {Array.from({ length: 5 }, (_, index) => {
            return (
              <span className='relative inline-flex size-4' key={index}>
                <Star
                  className={[
                    'absolute inset-0 size-4 fill-muted',
                    'text-muted',
                  ].join(' ')}
                />
                {testimonial.rating > index ? (
                  <span
                    className='absolute inset-y-0 left-0 overflow-hidden'
                    style={{
                      width: [
                        String(Math.min(1, testimonial.rating - index) * 100),
                        '%',
                      ].join(''),
                    }}
                  >
                    <Star
                      className={[
                        'size-4 min-w-4 fill-primary',
                        'text-primary',
                      ].join(' ')}
                    />
                  </span>
                ) : null}
              </span>
            );
          })}
        </div>
      </div>
      <blockquote
        className={[
          'mt-4 flex-1 break-words text-sm leading-6',
          'text-muted-foreground sm:text-base',
        ].join(' ')}
      >
        “{testimonial.quote}”
      </blockquote>
      <p className='mt-2 text-xs font-medium text-primary'>
        {testimonial.sport}
      </p>
    </article>
  );
}

function TestimonialTrack({ reverse = false }: { reverse?: boolean }) {
  const repeatedTestimonials = [...homeTestimonials, ...homeTestimonials];

  return (
    <div className='overflow-hidden py-4 sm:py-5'>
      <div
        aria-label={reverse ? 'Depoimentos, faixa reversa' : 'Depoimentos'}
        className={[
          'flex w-max ',
          'animate-testimonials-scroll ',
          String(reverse ? '[animation-direction:reverse]' : ''),
          ' [animation-duration:96s] ',
          'motion-reduce:flex-wrap ',
          'motion-reduce:justify-center ',
          'motion-reduce:gap-4',
        ].join('')}
      >
        {repeatedTestimonials.map((testimonial, index) => {
          const duplicate = index >= homeTestimonials.length;
          return (
            <div
              aria-hidden={duplicate || reverse ? true : undefined}
              className={[
                'shrink-0 pr-4 sm:pr-5 ',
                'motion-reduce:pr-0 ',
                String(duplicate ? 'motion-reduce:hidden' : ''),
              ].join('')}
              key={`${testimonial.name}-${index}`}
            >
              <TestimonialCard testimonial={testimonial} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className='mt-20 overflow-hidden'>
      <div
        className={[
          'rounded-3xl border border-border',
          'bg-linear-to-br from-primary/15 via-muted',
          'to-background p-3 sm:p-4',
        ].join(' ')}
      >
        <div className='grid gap-3 sm:grid-cols-3'>
          {homeTrustMetrics.map((metric, index) => {
            const Icon = trustIcons[index] ?? Medal;
            return (
              <article
                className={[
                  'rounded-2xl border border-background/80',
                  'bg-background/85 p-6 shadow-sm',
                  'backdrop-blur sm:p-7',
                ].join(' ')}
                key={metric.label}
              >
                <span
                  className={[
                    'grid size-11 place-items-center rounded-xl',
                    'bg-primary/12 text-primary',
                  ].join(' ')}
                >
                  <Icon className='size-5' />
                </span>
                <p className='mt-6 text-3xl font-semibold tracking-tight'>
                  {metric.value}
                </p>
                <p className='mt-2 text-sm font-medium text-muted-foreground'>
                  {metric.label}
                </p>
              </article>
            );
          })}
        </div>
      </div>
      <div
        className={[
          'relative mt-10 space-y-[-1rem]',
          'before:pointer-events-none before:absolute',
          'before:inset-y-0 before:left-0 before:z-10',
          'before:w-8 before:bg-linear-to-r',
          'before:from-background',
          'before:to-transparent',
          'after:pointer-events-none after:absolute',
          'after:inset-y-0 after:right-0 after:z-10',
          'after:w-8 after:bg-linear-to-l',
          'after:from-background after:to-transparent',
          'sm:mt-10 sm:space-y-[-1.25rem]',
          'sm:before:w-24 sm:after:w-24',
          'motion-reduce:before:hidden',
          'motion-reduce:after:hidden',
        ].join(' ')}
      >
        <TestimonialTrack />
        <TestimonialTrack reverse />
      </div>
    </section>
  );
}

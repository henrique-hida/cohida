import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import heroImage from '@/assets/CoHidaHero.png';
import heroFootballImage from '@/assets/CoHidaHeroFootball.png';
import heroMartialArtsImage from '@/assets/CoHidaHeroMartialArts.png';
import { PageContainer } from '@/components/shared';
import { Button } from '@/components/ui/button';

const heroSlides = [
  {
    alt: 'Equipamentos esportivos coHida em estúdio',
    categoryId: undefined,
    description: [
      'Equipamentos esportivos',
      'selecionados para você treinar,',
      'competir e ir além.',
    ].join(' '),
    image: heroImage,
    title: 'Performance começa com a escolha certa.',
  },
  {
    alt: 'Chuteiras, bola e camiseta de futebol em estúdio',
    categoryId: 'football',
    description:
      'Chuteiras, bolas e acessórios para você entrar em campo preparado.',
    image: heroFootballImage,
    title: 'Seu jogo começa antes do apito.',
  },
  {
    alt: 'Judogi, faixa e luvas de artes marciais em estúdio',
    categoryId: 'martial-arts',
    description:
      'Equipamentos para acompanhar sua evolução em cada treino no tatame.',
    image: heroMartialArtsImage,
    title: 'Disciplina para ir além no tatame.',
  },
];

export function HeroSection() {
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveHeroIndex((index) => (index + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(intervalId);
  }, []);
  const activeHero = heroSlides[activeHeroIndex];
  function changeHero(direction: -1 | 1) {
    setActiveHeroIndex(
      (index) => (index + direction + heroSlides.length) % heroSlides.length,
    );
  }
  return (
    <section
      className={[
        'relative isolate overflow-hidden',
        'bg-foreground text-background',
      ].join(' ')}
    >
      <div
        className={[
          'absolute inset-0 -z-10 bg-linear-to-r',
          'from-black via-black/80 to-transparent',
        ].join(' ')}
      />
      <div
        className={[
          'absolute inset-x-0 bottom-0 -z-10 h-2/5',
          'bg-linear-to-b from-transparent',
          'via-background/45 to-background',
        ].join(' ')}
      />
      {heroSlides.map((slide, index) => (
        <img
          alt={slide.alt}
          className={[
            'absolute inset-0 -z-20 size-full ',
            'object-cover object-[70%_center] ',
            'transition-opacity duration-700 ',
            String(activeHeroIndex === index ? 'opacity-100' : 'opacity-0'),
          ].join('')}
          key={slide.image}
          src={slide.image}
        />
      ))}
      <PageContainer
        className={[
          'flex h-[34rem] items-center pb-36 pt-20',
          'sm:h-[38rem] sm:pb-44',
        ].join(' ')}
      >
        <div className='max-w-xl'>
          <h1
            className={[
              'text-4xl font-semibold tracking-tight',
              'text-balance sm:text-6xl',
            ].join(' ')}
          >
            {activeHero.title}
          </h1>
          <p
            className={[
              'mt-6 max-w-lg text-base leading-7',
              'text-background/75 sm:text-lg',
            ].join(' ')}
          >
            {activeHero.description}
          </p>
        </div>
      </PageContainer>
      <div
        className={[
          'absolute inset-x-0 top-1/2 z-10 hidden',
          '-translate-y-1/2 justify-between px-5',
          'lg:flex',
        ].join(' ')}
      >
        <Button
          aria-label='Banner anterior'
          className={[
            'size-12 rounded-full border-white/25',
            'bg-black/35 text-white backdrop-blur',
            'hover:bg-white/15 hover:text-white',
          ].join(' ')}
          onClick={() => changeHero(-1)}
          size='icon'
          variant='outline'
        >
          <ChevronLeft />
        </Button>
        <Button
          aria-label='Próximo banner'
          className={[
            'size-12 rounded-full border-white/25',
            'bg-black/35 text-white backdrop-blur',
            'hover:bg-white/15 hover:text-white',
          ].join(' ')}
          onClick={() => changeHero(1)}
          size='icon'
          variant='outline'
        >
          <ChevronRight />
        </Button>
      </div>
      <div
        className={[
          'absolute right-0 bottom-40 left-0 z-10',
          'flex justify-center gap-2 sm:bottom-48',
        ].join(' ')}
      >
        {heroSlides.map((slide, index) => (
          <button
            aria-label={`Exibir banner ${index + 1}`}
            aria-current={activeHeroIndex === index ? 'true' : undefined}
            className={`h-2 rounded-full transition-all ${
              activeHeroIndex === index
                ? 'w-7 bg-primary'
                : 'w-2 bg-white/60 hover:bg-white'
            }`}
            key={slide.image}
            onClick={() => setActiveHeroIndex(index)}
            type='button'
          />
        ))}
      </div>
    </section>
  );
}

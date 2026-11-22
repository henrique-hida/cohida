import { Link } from 'react-router';
import collectionFootballImage from '@/assets/CoHidaCollectionFootball.png';
import collectionRunningImage from '@/assets/CoHidaCollectionRunning.png';
import collectionTrainingImage from '@/assets/CoHidaCollectionTraining.png';
import type { Product } from '@/types';
interface HomeGoalCollection {
  description: string;
  productIds: string[];
  title: string;
}

const homeGoalCollections: HomeGoalCollection[] = [
  {
    description: 'O essencial para ganhar ritmo com conforto e consistência.',
    productIds: ['velocity-runner', 'trail-pack-18l'],
    title: 'Começar a correr',
  },
  {
    description: 'Mobilidade, força e versatilidade para sua rotina em casa.',
    productIds: ['powerband-set'],
    title: 'Montar treino em casa',
  },
  {
    description: 'Equipamentos resistentes para jogo, técnica e intensidade.',
    productIds: ['ball-strike-pro'],
    title: 'Jogar futebol',
  },
];

const collectionImages: Record<string, string> = {
  'Começar a correr': collectionRunningImage,
  'Jogar futebol': collectionFootballImage,
  'Montar treino em casa': collectionTrainingImage,
};

export function GoalsSection({ products }: { products: Product[] }) {
  return (
    <section className='mt-20'>
      <div className='max-w-2xl'>
        <h2 className='text-3xl font-semibold tracking-tight'>
          Um ponto de partida para cada desafio
        </h2>
      </div>
      <div className='mt-8 grid gap-4 lg:grid-cols-3'>
        {homeGoalCollections.map((collection) => {
          const firstProduct = products.find(
            (product) => product.id === collection.productIds[0],
          );
          return (
            <Link
              className={[
                'group relative min-h-64 overflow-hidden',
                'rounded-2xl border border-border bg-card',
              ].join(' ')}
              key={collection.title}
              to={`/produtos/${firstProduct?.slug ?? ''}`}
            >
              <img
                alt={`Seleção ${collection.title}`}
                className={[
                  'absolute inset-0 size-full object-cover',
                  'transition-transform duration-500',
                  'group-hover:scale-105',
                ].join(' ')}
                src={collectionImages[collection.title]}
              />
              <div
                className={[
                  'absolute right-4 bottom-4 left-4',
                  'rounded-xl bg-background/92 p-4 shadow-lg',
                  'ring-1 ring-border/70 backdrop-blur-sm',
                ].join(' ')}
              >
                <h3 className='text-xl font-semibold'>{collection.title}</h3>
                <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                  {collection.description}
                </p>
                <span className='mt-5 text-sm font-medium text-primary'>
                  Ver seleção
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

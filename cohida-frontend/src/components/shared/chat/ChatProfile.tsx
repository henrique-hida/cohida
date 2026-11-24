import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/customerApi';

type Category = { id: number; name: string };
type Interest = { categoryId: number; name: string; experience: string | null };

export function ChatProfile() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const [category, setCategory] = useState('');
  const [experience, setExperience] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<Category[]>('/categories'),
      apiRequest<Interest[]>('/customers/me/chat/category-interests'),
      apiRequest<string[]>('/customers/me/chat/experience-options'),
    ])
      .then(([available, saved, levels]) => {
        if (!active) return;
        setCategories(available);
        setOptions(levels);
        setVisible(saved.length === 0);
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar suas preferências.');
      });
    return () => {
      active = false;
    };
  }, []);

  if (!visible) return null;
  return (
    <form
      className='grid gap-2 border-b border-border bg-muted/30 p-4 text-sm'
      onSubmit={(event) => {
        event.preventDefault();
        const selected = categories.find((item) => item.name === category);
        if (!selected || !experience) {
          setError('Selecione uma categoria e sua experiência.');
          return;
        }
        setBusy(true);
        setError('');
        void apiRequest<Interest[]>('/customers/me/chat/category-interests', {
          method: 'PUT',
          body: JSON.stringify([
            { categoryId: selected.id, name: selected.name, experience },
          ]),
        })
          .then(() => {
            setVisible(false);
            window.dispatchEvent(new Event('cohida:preferences-changed'));
            window.dispatchEvent(
              new Event('cohida:category-interests-changed'),
            );
          })
          .catch(() => setError('Não foi possível salvar suas preferências.'))
          .finally(() => setBusy(false));
      }}
    >
      <p>Quais categorias você pratica?</p>
      <SearchableSelect
        label='Categoria'
        options={categories.map((item) => item.name)}
        value={category}
        onChange={setCategory}
        disabled={busy}
      />
      <Select
        value={experience}
        onValueChange={(value) => setExperience(value ?? '')}
      >
        <SelectTrigger aria-label='Experiência' className='w-full'>
          <SelectValue placeholder='Selecione sua experiência' />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p role='alert' className='text-destructive'>
          {error}
        </p>
      )}
      <div className='flex gap-2'>
        <Button type='submit' size='xs' disabled={busy}>
          Salvar preferência
        </Button>
        <Button
          type='button'
          size='xs'
          variant='ghost'
          onClick={() => setVisible(false)}
        >
          Agora não
        </Button>
      </div>
    </form>
  );
}

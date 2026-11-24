import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { AccountSectionCard } from '@/components/shared/AccountSectionCard';
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

export function ChatPreferences() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [interests, setInterests] = useState<Interest[] | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState('');
  const [experience, setExperience] = useState('');
  const [removing, setRemoving] = useState<Interest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    function load() {
      Promise.all([
        apiRequest<Category[]>('/categories'),
        apiRequest<Interest[]>('/customers/me/chat/category-interests'),
        apiRequest<string[]>('/customers/me/chat/experience-options'),
      ])
        .then(([available, saved, levels]) => {
          if (!active) return;
          setCategories(available);
          setInterests(saved);
          setOptions(levels);
        })
        .catch(() => {
          if (active) setError('Não foi possível carregar suas preferências.');
        });
    }
    load();
    window.addEventListener('cohida:category-interests-changed', load);
    return () => {
      active = false;
      window.removeEventListener('cohida:category-interests-changed', load);
    };
  }, []);

  function closeForm() {
    setAdding(false);
    setEditing(null);
    setCategory('');
    setExperience('');
    setError('');
  }

  async function save(items: Interest[]) {
    setBusy(true);
    setError('');
    try {
      const saved = await apiRequest<Interest[]>(
        '/customers/me/chat/category-interests',
        { method: 'PUT', body: JSON.stringify(items) },
      );
      setInterests(saved);
      closeForm();
      window.dispatchEvent(new Event('cohida:preferences-changed'));
      window.dispatchEvent(new Event('cohida:category-interests-changed'));
    } catch {
      setError('Não foi possível salvar suas preferências.');
    } finally {
      setBusy(false);
    }
  }

  const showForm = adding || editing !== null;
  const available = categories.filter(
    (item) =>
      item.id === editing ||
      !interests?.some((saved) => saved.categoryId === item.id),
  );
  return (
    <AccountSectionCard
      title='Preferências do chat'
      description='Gerencie suas categorias de interesse e experiência.'
      action={
        <div className='flex flex-wrap gap-2'>
          {showForm && (
            <Button
              disabled={busy}
              className='bg-muted text-foreground hover:bg-muted/80'
              onClick={closeForm}
            >
              <X /> Cancelar
            </Button>
          )}
          {showForm ? (
            <Button
              key='save'
              disabled={busy}
              form='chat-preference-form'
              type='submit'
            >
              Salvar preferência
            </Button>
          ) : (
            <Button
              key='add'
              disabled={busy || interests === null}
              type='button'
              onClick={() => {
                setError('');
                setAdding(true);
              }}
            >
              <Plus /> Adicionar preferência
            </Button>
          )}
        </div>
      }
    >
      {interests?.length ? (
        <div className='divide-y divide-border'>
          {interests.map((item) => (
            <div
              key={item.categoryId}
              className={[
                'flex items-center justify-between gap-3 py-4',
                'first:pt-0 last:pb-0',
              ].join(' ')}
            >
              <div className='grid flex-1 gap-2 sm:grid-cols-2'>
                <div>
                  <p className='text-xs text-muted-foreground'>Categoria</p>
                  <p className='mt-1 font-medium'>{item.name}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Experiência</p>
                  <p className='mt-1 text-sm'>
                    {item.experience ?? 'Não informada'}
                  </p>
                </div>
              </div>
              <div className='flex shrink-0 gap-1'>
                <Button
                  aria-label={`Editar ${item.name}`}
                  size='icon-sm'
                  variant='ghost'
                  onClick={() => {
                    setError('');
                    setEditing(item.categoryId);
                    setCategory(item.name);
                    setExperience(item.experience ?? '');
                  }}
                >
                  <Pencil />
                </Button>
                <Button
                  aria-label={`Excluir ${item.name}`}
                  size='icon-sm'
                  variant='ghost'
                  onClick={() => setRemoving(item)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : !showForm ? (
        <p className='text-sm text-muted-foreground'>
          Você ainda não adicionou categorias de interesse.
        </p>
      ) : null}
      {showForm && (
        <form
          id='chat-preference-form'
          className={[
            'grid gap-4 sm:grid-cols-2',
            interests?.length ? 'mt-4 border-t border-border pt-4' : '',
          ].join(' ')}
          onSubmit={(event) => {
            event.preventDefault();
            const selected = available.find((item) => item.name === category);
            if (!selected || !experience || !interests) {
              setError('Selecione uma categoria e sua experiência.');
              return;
            }
            void save([
              ...interests.filter((item) => item.categoryId !== editing),
              { categoryId: selected.id, name: selected.name, experience },
            ]);
          }}
        >
          <label className='grid gap-1 text-sm'>
            Categoria
            <SearchableSelect
              label='Categoria'
              options={available.map((item) => item.name)}
              value={category}
              onChange={setCategory}
              disabled={busy}
            />
          </label>
          <label className='grid gap-1 text-sm'>
            Experiência
            <Select
              value={experience}
              onValueChange={(value) => setExperience(value ?? '')}
            >
              <SelectTrigger className='w-full' aria-label='Experiência'>
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
          </label>
        </form>
      )}
      {error && (
        <p role='alert' className='mt-3 text-sm text-destructive'>
          {error}
        </p>
      )}
      {removing && (
        <ConfirmDialog
          title='Excluir preferência?'
          description={
            `A categoria ${removing.name} será removida ` +
            'das suas preferências.'
          }
          confirmLabel='Excluir'
          onCancel={() => setRemoving(null)}
          onConfirm={() => {
            void save(
              (interests ?? []).filter(
                (item) => item.categoryId !== removing.categoryId,
              ),
            );
            setRemoving(null);
          }}
        />
      )}
    </AccountSectionCard>
  );
}

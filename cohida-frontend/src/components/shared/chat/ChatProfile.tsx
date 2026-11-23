import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/customerApi';

type Profile = {
  sport: string | null;
  experience: string | null;
  goal: string | null;
  budget: string | null;
};
type Interest = { sport: string; focus: string | null };

const choices: Record<string, string[]> = {
  Corrida: ['Tênis', 'Acessórios', 'Roupas'],
  Futebol: ['Chuteiras', 'Bolas', 'Roupas'],
  Judô: ['Judogi', 'Faixas', 'Acessórios'],
  Treino: ['Equipamentos', 'Roupas', 'Acessórios'],
  Trilha: ['Calçados', 'Mochilas', 'Acessórios'],
  Vôlei: ['Bolas', 'Roupas', 'Acessórios'],
};
const questions = [
  {
    key: 'experience',
    text: 'Qual é seu nível de experiência?',
    options: ['Iniciante', 'Intermediário', 'Avançado'],
  },
  {
    key: 'goal',
    text: 'Qual é seu objetivo?',
    options: ['Começar', 'Treinar', 'Competir', 'Conhecer produtos'],
  },
  {
    key: 'budget',
    text: 'Qual faixa de preço prefere?',
    options: ['Até R$ 100', 'Até R$ 300', 'Acima de R$ 300'],
  },
] as const;
type QuestionKey = (typeof questions)[number]['key'];

export function ChatProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [interests, setInterests] = useState<Interest[] | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const [editingSports, setEditingSports] = useState(false);
  const [editingFocus, setEditingFocus] = useState<string | null>(null);
  const [skippedSports, setSkippedSports] = useState(false);
  const [editing, setEditing] = useState<QuestionKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    function load() {
      Promise.all([
        apiRequest<Profile>('/customers/me/chat/profile'),
        apiRequest<Interest[]>('/customers/me/chat/interests'),
      ])
        .then(([p, items]) => {
          if (active) {
            setProfile(p);
            setInterests(items);
            setSelection(items.map((item) => item.sport));
          }
        })
        .catch(() => {
          if (active) setError('Não foi possível carregar suas preferências.');
        });
    }
    load();
    window.addEventListener('cohida:interest-added', load);
    return () => {
      active = false;
      window.removeEventListener('cohida:interest-added', load);
    };
  }, []);

  async function saveInterests(items: Interest[]) {
    setBusy(true);
    setError('');
    try {
      const saved = await apiRequest<Interest[]>(
        '/customers/me/chat/interests',
        {
          method: 'PUT',
          body: JSON.stringify(items),
        },
      );
      setInterests(saved);
      setSelection(saved.map((item) => item.sport));
      setEditingSports(false);
      setEditingFocus(null);
      window.dispatchEvent(new Event('cohida:preferences-changed'));
    } catch {
      setError('Não foi possível salvar suas preferências. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function answer(key: QuestionKey, value: string) {
    if (!profile) return;
    setBusy(true);
    setError('');
    try {
      setProfile(
        await apiRequest<Profile>('/customers/me/chat/profile', {
          method: 'PUT',
          body: JSON.stringify({ ...profile, [key]: value }),
        }),
      );
      setEditing(null);
      window.dispatchEvent(new Event('cohida:preferences-changed'));
    } catch {
      setError('Não foi possível salvar sua resposta. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  const selectSports =
    interests !== null &&
    (editingSports || (interests.length === 0 && !skippedSports));
  const focus = !selectSports
    ? (interests?.find((item) => item.sport === editingFocus) ??
      interests?.find((item) => item.focus === null))
    : undefined;
  const question =
    profile && !selectSports && !focus
      ? (questions.find((item) => item.key === editing) ??
        questions.find((item) => profile[item.key] === null))
      : undefined;
  const label = selectSports
    ? 'Quais atividades fazem parte da sua rotina?'
    : focus
      ? `O que você procura para ${focus.sport.toLowerCase()}?`
      : question?.text;

  return (
    <div className='border-b border-border/70 bg-muted/30 p-4 text-sm'>
      {label && (
        <div
          className={[
            'rounded-2xl border border-primary/10',
            'bg-card p-4 shadow-sm',
          ].join(' ')}
        >
          <div className='mb-2 flex items-center gap-2 text-primary'>
            <Sparkles className='size-4' aria-hidden='true' />
            <span className='text-xs font-semibold'>Seu perfil esportivo</span>
          </div>
          <p className='font-medium leading-relaxed'>{label}</p>
          {selectSports && (
            <p className='mt-1 text-xs text-muted-foreground'>
              Escolha uma ou mais opções. Você pode alterar depois.
            </p>
          )}
          <div className='mt-3 flex flex-wrap gap-2'>
            {selectSports
              ? Object.keys(choices).map((sport) => (
                  <Button
                    key={sport}
                    type='button'
                    size='xs'
                    disabled={busy}
                    aria-pressed={selection.includes(sport)}
                    variant={selection.includes(sport) ? 'default' : 'outline'}
                    onClick={() =>
                      setSelection((current) =>
                        current.includes(sport)
                          ? current.filter((item) => item !== sport)
                          : [...current, sport],
                      )
                    }
                  >
                    {selection.includes(sport) && <Check className='size-3' />}
                    {sport}
                  </Button>
                ))
              : focus
                ? [...choices[focus.sport], 'Pular'].map((option) => (
                    <Button
                      key={option}
                      type='button'
                      size='xs'
                      variant='outline'
                      disabled={busy}
                      onClick={() =>
                        void saveInterests(
                          interests!.map((item) =>
                            item.sport === focus.sport
                              ? { ...item, focus: option }
                              : item,
                          ),
                        )
                      }
                    >
                      {option}
                    </Button>
                  ))
                : question &&
                  [...question.options, 'Pular'].map((option) => (
                    <Button
                      key={option}
                      type='button'
                      size='xs'
                      variant='outline'
                      disabled={busy}
                      onClick={() => void answer(question.key, option)}
                    >
                      {option}
                    </Button>
                  ))}
          </div>
          {selectSports && (
            <div className='flex items-center gap-2'>
              <Button
                className='mt-3'
                size='xs'
                disabled={busy || !selection.length}
                onClick={() =>
                  void saveInterests(
                    selection.map(
                      (sport) =>
                        interests!.find((item) => item.sport === sport) ?? {
                          sport,
                          focus: null,
                        },
                    ),
                  )
                }
              >
                Continuar
              </Button>
              <Button
                size='xs'
                variant='ghost'
                onClick={() => {
                  setSkippedSports(true);
                  setEditingSports(false);
                }}
              >
                Agora não
              </Button>
            </div>
          )}
        </div>
      )}
      {interests && interests.length > 0 && (
        <div className='mt-3 rounded-xl bg-background p-3'>
          <p className='text-xs text-muted-foreground'>
            Atividades e interesses
          </p>
          <p className='mt-1'>
            {interests
              .map(
                (i) =>
                  i.sport +
                  (i.focus && i.focus !== 'Pular' ? ` · ${i.focus}` : ''),
              )
              .join(', ')}
          </p>
          <Button
            size='xs'
            variant='ghost'
            onClick={() => setEditingSports(true)}
          >
            Alterar atividades
          </Button>
          {interests.map((item) => (
            <Button
              key={item.sport}
              size='xs'
              variant='ghost'
              onClick={() => setEditingFocus(item.sport)}
            >
              Alterar interesse em {item.sport}
            </Button>
          ))}
          {questions.map((item) => (
            <div
              className='mt-2 flex items-center justify-between gap-2'
              key={item.key}
            >
              <span className='text-xs'>
                {item.text} {profile?.[item.key] ?? 'Não respondido'}
              </span>
              <Button
                size='xs'
                variant='ghost'
                onClick={() => setEditing(item.key)}
              >
                Alterar
              </Button>
            </div>
          ))}
        </div>
      )}
      {error && (
        <p className='mt-2 text-destructive' role='alert'>
          {error}
        </p>
      )}
    </div>
  );
}

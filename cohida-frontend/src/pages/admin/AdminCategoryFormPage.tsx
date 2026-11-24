import { AdminPage } from '@/components/admin/AdminPage';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';

import { AdminDataState } from '@/components/admin/AdminDataState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { commerceApi } from '@/lib/commerceApi';
import { apiRequest } from '@/lib/customerApi';

function AdminCategoryFormPageContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const categoryId = id ? Number(id) : null;
  const invalidId =
    categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(isEditing && !invalidId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionStatus, setQuestionStatus] = useState('');
  const [questionSaving, setQuestionSaving] = useState(false);
  const questionsDirty = useRef(false);

  useEffect(() => {
    if (!id) return;
    if (invalidId || categoryId === null) return;

    let active = true;
    void commerceApi
      .adminCategories()
      .then((categories) => {
        if (!active) return;
        const category = categories.find((item) => item.id === categoryId);
        if (!category) {
          setError('A categoria não foi encontrada.');
          return;
        }
        setName(category.name);
        setDescription(category.description);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível carregar a categoria.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [categoryId, id, invalidId]);

  useEffect(() => {
    if (!categoryId || invalidId) return;
    let active = true;
    async function loadQuestions() {
      try {
        const result = await apiRequest<{
          status: string;
          questions: string[];
        }>(`/admin/categories/${categoryId}/chat-suggestions`);
        if (!active) return;
        setQuestionStatus(result.status);
        setQuestions((current) =>
          questionsDirty.current ||
          result.status === 'PENDING' ||
          result.status === 'PROCESSING'
            ? current
            : result.questions,
        );
      } catch {
        if (active) setError('Não foi possível carregar as perguntas.');
      }
    }
    void loadQuestions();
    const timer = window.setInterval(() => {
      if (questionStatus === 'PENDING' || questionStatus === 'PROCESSING') {
        void loadQuestions();
      }
    }, 4000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [categoryId, invalidId, questionStatus]);

  async function saveQuestions() {
    if (!categoryId) return;
    setQuestionSaving(true);
    setError('');
    try {
      const result = await apiRequest<{ status: string; questions: string[] }>(
        `/admin/categories/${categoryId}/chat-suggestions`,
        { method: 'PUT', body: JSON.stringify({ questions }) },
      );
      questionsDirty.current = false;
      setQuestionStatus(result.status);
      setQuestions(result.questions);
    } catch {
      setError('Não foi possível salvar as perguntas.');
    } finally {
      setQuestionSaving(false);
    }
  }

  async function retryQuestions() {
    if (!categoryId) return;
    setQuestionSaving(true);
    setError('');
    try {
      await apiRequest<void>(
        `/admin/categories/${categoryId}/chat-suggestions/retry`,
        { method: 'POST' },
      );
      setQuestionStatus('PENDING');
    } catch {
      setError('Não foi possível solicitar a geração das perguntas.');
    } finally {
      setQuestionSaving(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const category = {
        name: name.trim(),
        description: description.trim(),
      };
      if (categoryId !== null) {
        await commerceApi.updateCategory(categoryId, category);
      } else {
        const created = await commerceApi.createCategory(category);
        navigate(`/admin/administracao/${created.id}/editar`);
        return;
      }
      navigate('/admin/administracao');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível salvar a categoria.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card className='mt-8 max-w-3xl'>
        <CardContent className='p-5 sm:p-6'>
          {loading ? (
            <AdminDataState
              description='Consultando os dados da categoria.'
              title='Carregando categoria'
              variant='loading'
            />
          ) : (
            <form className='grid gap-5' onSubmit={(event) => void save(event)}>
              {error || invalidId ? (
                <p className='text-sm text-destructive' role='alert'>
                  {error || 'Categoria inválida.'}
                </p>
              ) : null}
              <label className='grid gap-2 text-sm font-medium'>
                Nome
                <input
                  autoComplete='off'
                  className={[
                    'h-10 rounded-lg border border-input',
                    ['bg-background px-3 text-sm', 'font-normal'].join(' '),
                  ].join(' ')}
                  maxLength={100}
                  onChange={(event) => setName(event.target.value)}
                  required
                  value={name}
                />
              </label>
              <label className='grid gap-2 text-sm font-medium'>
                Descrição
                <textarea
                  className={[
                    ['min-h-24 rounded-lg border', 'border-input'].join(' '),
                    'bg-background px-3 py-2 text-sm',
                    'font-normal',
                  ].join(' ')}
                  maxLength={500}
                  onChange={(event) => setDescription(event.target.value)}
                  value={description}
                />
              </label>
              {isEditing && (
                <section className='grid gap-3'>
                  <h2 className='font-medium'>Perguntas sugeridas no chat</h2>
                  {(questionStatus === 'PENDING' ||
                    questionStatus === 'PROCESSING') && (
                    <p className='text-sm'>Preparando perguntas...</p>
                  )}
                  {questionStatus === 'FAILED' && (
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='text-sm'>
                        Não foi possível gerar perguntas.
                      </p>
                      <Button
                        disabled={questionSaving}
                        size='sm'
                        type='button'
                        variant='outline'
                        onClick={() => void retryQuestions()}
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  )}
                  {questions.map((question, index) => (
                    <div className='grid gap-1 text-sm' key={index}>
                      <label htmlFor={`question-${index}`}>
                        Pergunta {index + 1}
                      </label>
                      <div className='flex gap-2'>
                        <input
                          id={`question-${index}`}
                          className={[
                            'h-10 min-w-0 flex-1 rounded-lg border',
                            'border-input bg-background px-3',
                          ].join(' ')}
                          maxLength={240}
                          value={question}
                          onChange={(event) => {
                            questionsDirty.current = true;
                            setQuestions((current) =>
                              current.map((item, position) =>
                                position === index ? event.target.value : item,
                              ),
                            );
                          }}
                        />
                        <Button
                          aria-label={`Remover pergunta ${index + 1}`}
                          type='button'
                          variant='outline'
                          onClick={() => {
                            questionsDirty.current = true;
                            setQuestions((current) =>
                              current.filter(
                                (_, position) => position !== index,
                              ),
                            );
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                  {questions.length < 4 && (
                    <Button
                      size='sm'
                      type='button'
                      variant='outline'
                      onClick={() => {
                        questionsDirty.current = true;
                        setQuestions((current) => [...current, '']);
                      }}
                    >
                      Adicionar pergunta
                    </Button>
                  )}
                  <Button
                    disabled={
                      questionSaving || questions.some((q) => !q.trim())
                    }
                    size='sm'
                    type='button'
                    onClick={() => void saveQuestions()}
                  >
                    Salvar perguntas
                  </Button>
                </section>
              )}
              <div className='flex flex-wrap gap-2'>
                <Button disabled={saving} type='submit'>
                  {saving
                    ? 'Salvando…'
                    : isEditing
                      ? 'Salvar alterações'
                      : 'Criar categoria'}
                </Button>
                <Button
                  render={<Link to='/admin/administracao' />}
                  type='button'
                  variant='outline'
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}

const getPageHeader = ({ isEditing }: { isEditing: boolean }) => ({
  action: (
    <Button
      nativeButton={false}
      render={<Link to='/admin/administracao' />}
      size='sm'
      variant='outline'
    >
      <ChevronLeft aria-hidden='true' />
      Administração
    </Button>
  ),
  description: isEditing
    ? 'Atualize os dados usados para organizar o catálogo.'
    : 'Defina os dados da categoria para organizar o catálogo.',
  overlap: true,
  title: isEditing ? 'Editar categoria' : 'Nova categoria',
});

export function AdminCategoryFormPage() {
  const { id } = useParams();

  return (
    <AdminPage {...getPageHeader({ isEditing: Boolean(id) })}>
      <AdminCategoryFormPageContent />
    </AdminPage>
  );
}

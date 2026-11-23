import { useEffect, useState } from 'react';
import { commerceApi } from '@/lib/commerceApi';

type ProcessingStatus = 'PROCESSING' | 'READY' | 'FAILED';

export function useImageProcessing(
  imageUrl: string,
  selectedImage: File | null,
) {
  const match = imageUrl.match(/\/images\/([0-9a-f-]{36})\.webp(?:\?.*)?$/i);
  const id = selectedImage ? undefined : match?.[1];
  const [result, setResult] = useState<{
    id: string;
    status: ProcessingStatus;
  }>();
  const [retryError, setRetryError] = useState('');
  const [revision, setRevision] = useState(0);
  const status = result && result.id === id ? result.status : undefined;

  useEffect(() => {
    if (!id) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function check() {
      void commerceApi
        .imageProcessingStatus(id!)
        .then((response) => {
          if (!active) return;
          setResult({ id: id!, status: response.status });
          if (response.status === 'PROCESSING') timer = setTimeout(check, 3000);
        })
        .catch(() => {
          if (active) setResult({ id: id!, status: 'READY' });
        });
    }
    check();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [id, revision]);

  async function retry() {
    if (!id) return;
    setRetryError('');
    try {
      await commerceApi.retryImageProcessing(id);
      setResult({ id, status: 'PROCESSING' });
      setRevision((current) => current + 1);
    } catch {
      setRetryError('Não foi possível tentar novamente.');
    }
  }

  return { status, checking: !!id && !status, retry, retryError };
}

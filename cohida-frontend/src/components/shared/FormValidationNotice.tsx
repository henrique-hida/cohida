import { useEffect, useState } from 'react';
import { Toast } from '@/components/ui/toast';

export function FormValidationNotice() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    function invalid(event: Event) {
      const field = event.target;
      if (!(
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement ||
        field instanceof HTMLSelectElement
      ))
        return;
      event.preventDefault();
      if (field.form?.querySelector(':invalid') !== field) return;
      field.focus();
      const label = field.labels?.[0]?.textContent?.trim();
      const name = label ? ` em ${label}` : '';
      const validity = field.validity;
      if (validity.valueMissing)
        setMessage(`Preencha o campo obrigatório${name}.`);
      else if (validity.typeMismatch)
        setMessage(`Informe um valor válido${name}.`);
      else if (validity.patternMismatch)
        setMessage(`Confira o formato${name}.`);
      else if (validity.tooShort) setMessage(`O valor${name} é muito curto.`);
      else if (validity.rangeUnderflow || validity.rangeOverflow)
        setMessage(`O valor${name} está fora do limite permitido.`);
      else setMessage(`Confira o valor informado${name}.`);
    }
    function clear() {
      setMessage('');
    }
    document.addEventListener('invalid', invalid, true);
    document.addEventListener('input', clear, true);
    return () => {
      document.removeEventListener('invalid', invalid, true);
      document.removeEventListener('input', clear, true);
    };
  }, []);

  return message ? (
    <Toast
      key={message}
      message={message}
      onClose={() => setMessage('')}
      variant='error'
    />
  ) : null;
}

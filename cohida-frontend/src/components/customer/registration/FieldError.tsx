export function FieldError({ message }: { message?: string }) {
  return message ? (
    <span className='text-xs text-destructive'>{message}</span>
  ) : null;
}

/**
 * Generic labeled text input.
 * Use for all form fields across the app (auth, profile, search, etc.).
 */
export function TextField({
  label,
  type = 'text',
  placeholder,
  autoComplete,
  name,
  id,
  value,
  onChange,
  required = false,
  className = '',
}) {
  const inputId = id || name;

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-medium text-text-primary"
      >
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-field border border-border-control bg-surface px-4 py-3 text-text-primary outline-none transition placeholder:text-text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/10"
      />
    </div>
  );
}

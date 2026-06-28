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
        className="mb-2 block text-sm font-medium text-slate-700"
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
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
      />
    </div>
  );
}

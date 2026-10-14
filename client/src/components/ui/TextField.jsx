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
        className="mb-2 block text-sm font-medium text-[#435647]"
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
        className="w-full rounded-xl border border-[#ccd9cb] bg-white px-4 py-3 text-[#203229] outline-none transition placeholder:text-[#9aa69d] focus:border-[#6b8963] focus:ring-4 focus:ring-[#6b8963]/10"
      />
    </div>
  );
}

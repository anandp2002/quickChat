/**
 * Visual divider with centred label — used between auth methods
 * (e.g. email/password form ↔ social login buttons).
 */
export function Divider({ label = 'or' }) {
  return (
    <div className="flex items-center gap-4 py-1">
      <div className="h-px flex-1 bg-[#dfe7dd]" />
      <span className="text-xs font-medium uppercase tracking-widest text-[#94a397]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[#dfe7dd]" />
    </div>
  );
}

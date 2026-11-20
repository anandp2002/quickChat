import { friendTabs } from '@/config/friends';

export function FriendsTabs({ activeTab, onTabChange, requestCount = 0 }) {
  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-control bg-surface-active p-1"
      role="tablist"
      aria-label="Friends sections"
    >
      {friendTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`min-h-10 rounded-control px-2 py-2 font-sans text-[0.78rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
            activeTab === tab.id
              ? 'bg-surface font-semibold text-text-brand shadow-sm'
              : 'text-text-secondary hover:bg-surface-active hover:text-text-brand'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {tab.id === 'requests' && requestCount ? (
            <span className="ml-1.5 inline-grid min-w-5 place-items-center rounded-full bg-brand-soft px-1.5 py-0.5 text-[0.66rem] text-text-brand">
              {requestCount}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

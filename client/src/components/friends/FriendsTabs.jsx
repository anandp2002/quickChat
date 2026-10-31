import { friendTabs } from '@/config/friends';

export function FriendsTabs({ activeTab, onTabChange }) {
  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-[10px] bg-[#edf3ef] p-1"
      role="tablist"
      aria-label="Friends sections"
    >
      {friendTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`min-h-10 rounded-[8px] px-2 py-2 font-sans text-[0.78rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#73c49e] ${
            activeTab === tab.id
              ? 'bg-white font-semibold text-[#176044] shadow-sm'
              : 'text-[#667772] hover:bg-[#e2eee7] hover:text-[#176044]'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {tab.count ? (
            <span className="ml-1.5 inline-grid min-w-5 place-items-center rounded-full bg-[#d8e9df] px-1.5 py-0.5 text-[0.66rem] text-[#176044]">
              {tab.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { navigationItems } from '@/config/navigation';
import { SidebarAccount } from '@/components/sidebar/SidebarAccount';
import { SidebarBrand } from '@/components/sidebar/SidebarBrand';
import { SidebarNavigation } from '@/components/sidebar/SidebarNavigation';

export function Sidebar() {
  const user = useSelector((state) => state.auth.user);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  return (
    <div className="w-full shrink-0 min-[701px]:contents">
      <div className="flex h-[68px] items-center justify-between border-b border-[#dce4e1] bg-[#fbfcfa] px-[18px] min-[701px]:hidden">
        <SidebarBrand />
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-[9px] text-[#52645c] transition-colors hover:bg-[#e7f1eb] hover:text-[#176044] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a9271]"
          aria-label={
            isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'
          }
          aria-expanded={isMobileOpen}
          onClick={() => setIsMobileOpen((open) => !open)}
        >
          {isMobileOpen ? (
            <X size={22} strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <Menu size={22} strokeWidth={1.8} aria-hidden="true" />
          )}
        </button>
      </div>

      <button
        type="button"
        className={`fixed inset-0 z-30 bg-black/90 transition-opacity duration-300 ease-out min-[701px]:hidden ${isMobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-label="Close navigation menu"
        aria-hidden={!isMobileOpen}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside
        className={`${isMobileOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'} fixed right-0 top-0 z-40 flex h-screen w-[min(20rem,85vw)] transform flex-col overflow-y-auto border-l border-[#dce4e1] bg-[#fbfcfa] px-[18px] py-5 shadow-[-12px_0_30px_rgba(23,60,54,0.12)] transition-transform duration-300 ease-out min-[701px]:sticky min-[701px]:top-0 min-[701px]:self-start min-[701px]:z-auto min-[701px]:translate-x-0 min-[701px]:pointer-events-auto min-[701px]:flex min-[701px]:h-screen ${isDesktopCollapsed ? 'min-[701px]:w-[76px] min-[701px]:px-0' : 'min-[701px]:w-64 min-[701px]:px-[18px]'} min-[701px]:overflow-hidden min-[701px]:border-l-0 min-[701px]:border-r min-[701px]:py-7 min-[701px]:shadow-none min-[701px]:transition-[width,padding] min-[701px]:duration-200 min-[701px]:ease-in-out`}
      >
        <div className="flex min-h-12 items-center justify-between border-b border-[#e2e9e5] pb-4 min-[701px]:hidden">
          <SidebarBrand />
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-[9px] text-[#52645c] transition-colors hover:bg-[#e7f1eb] hover:text-[#176044] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a9271]"
            aria-label="Close navigation menu"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={22} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        <div
          className={`hidden min-h-11 items-center gap-1 border-b border-[#e2e9e5] pb-5 min-[701px]:flex min-[701px]:w-full min-[701px]:border-0 min-[701px]:pb-0 ${isDesktopCollapsed ? 'min-[701px]:justify-center' : 'min-[701px]:justify-between'}`}
        >
          {!isDesktopCollapsed ? <SidebarBrand /> : null}
          <button
            type="button"
            className={`grid shrink-0 place-items-center text-[#52645c] transition-colors hover:bg-[#e7f1eb] hover:text-[#176044] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a9271] ${isDesktopCollapsed ? 'h-11 w-full rounded-[10px]' : 'h-8 w-8 rounded-[9px]'}`}
            title={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={
              isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
            aria-expanded={!isDesktopCollapsed}
            onClick={() => setIsDesktopCollapsed((collapsed) => !collapsed)}
          >
            {isDesktopCollapsed ? (
              <PanelLeftOpen size={19} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={17} strokeWidth={1.8} aria-hidden="true" />
            )}
          </button>
        </div>
        <SidebarNavigation
          items={navigationItems}
          collapsed={isDesktopCollapsed}
          onNavigate={() => setIsMobileOpen(false)}
        />
        <SidebarAccount user={user} collapsed={isDesktopCollapsed} />
      </aside>
    </div>
  );
}

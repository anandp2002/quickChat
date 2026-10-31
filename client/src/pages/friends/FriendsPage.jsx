import { FriendsPanel } from '@/components/friends/FriendsPanel';

export function FriendsPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1040px] justify-center px-5 py-8 sm:px-[7vw] sm:py-12 lg:px-[7vw] lg:py-[8vw]">
      <FriendsPanel />
    </div>
  );
}

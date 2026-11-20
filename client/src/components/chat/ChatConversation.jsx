import {
  ArrowLeft,
  MessageCircleMore,
  MoreVertical,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { ChatAvatar } from '@/components/chat/ChatAvatar';

export function ChatConversation({ friend, onClose }) {
  return (
    <section
      className={`${friend ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col bg-app-warm min-[721px]:flex`}
    >
      {friend ? (
        <>
          <header className="flex h-[72px] shrink-0 items-center border-b border-border-subtle bg-surface px-3 sm:px-5">
            <button
              type="button"
              onClick={onClose}
              className="mr-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-text-secondary hover:bg-surface-active min-[721px]:hidden"
              aria-label="Back to chats"
            >
              <ArrowLeft size={21} aria-hidden="true" />
            </button>
            <ChatAvatar friend={friend} />
            <div className="ml-3 min-w-0 flex-1">
              <p className="m-0 truncate font-sans text-[0.92rem] font-semibold text-text-primary">
                {friend.name}
              </p>
              <p className="m-0 mt-0.5 truncate font-sans text-[0.72rem] text-text-muted">
                {friend.username || 'Available'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" className="grid h-10 w-10 place-items-center rounded-full text-text-secondary hover:bg-surface-active" aria-label="Start video call">
                <Video size={19} strokeWidth={1.7} aria-hidden="true" />
              </button>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-full text-text-secondary hover:bg-surface-active" aria-label="More chat options">
                <MoreVertical size={19} strokeWidth={1.7} aria-hidden="true" />
              </button>
            </div>
          </header>
          <div className="grid flex-1 place-items-center px-6 text-center">
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-border-subtle bg-surface text-brand shadow-card">
                <ShieldCheck size={28} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h2 className="m-0 mt-5 font-sans text-[1.15rem] font-semibold text-text-heading">
                Chat with {friend.name}
              </h2>
              <p className="m-0 mt-2 max-w-[320px] font-sans text-[0.78rem] leading-5 text-text-muted">
                Messaging is coming in the next phase.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="grid flex-1 place-items-center px-8 text-center">
          <div className="max-w-[390px]">
            <div className="mx-auto grid h-[72px] w-[72px] place-items-center rounded-full border border-border-subtle bg-surface text-brand shadow-card">
              <MessageCircleMore size={30} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h2 className="m-0 mt-5 font-sans text-[1.35rem] font-semibold text-text-heading">
              QuickChat
            </h2>
            <p className="m-0 mt-2 font-sans text-[0.82rem] leading-6 text-text-muted">
              Select a friend to start a conversation.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

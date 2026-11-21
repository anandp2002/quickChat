import {
  ArrowLeft,
  MessageCircleMore,
  MoreVertical,
  Send,
  Video,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChatAvatar } from '@/components/chat/ChatAvatar';
import { chatService } from '@/services/chatService';
import { getChatSocket } from '@/services/socketService';

export function ChatConversation({
  friend,
  presence,
  conversation,
  loading,
  error,
  onClose,
}) {
  const uid = useSelector((state) => state.auth.user?.uid);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    if (!conversation) return undefined;

    let active = true;
    let chatSocket;

    const handleMessage = ({ conversationId: incomingId, message }) => {
      if (incomingId !== conversation.id) return;
      setMessages((current) => {
        if (current.some((item) => item.id === message.id || item.clientId === message.clientId)) {
          return current.map((item) =>
            item.clientId === message.clientId ? message : item,
          );
        }
        return [...current, message];
      });
      chatService.markRead(conversation.id).catch(() => {});
    };

    const handleTyping = ({
      conversationId: incomingId,
      uid: typingUid,
      typing: isTyping,
    }) => {
      if (incomingId === conversation.id && typingUid !== uid) {
        setTyping(isTyping);
      }
    };

    const load = async () => {
      try {
        const response = await chatService.listMessages({
          conversationId: conversation.id,
        });
        if (active) setMessages(response.messages || []);
        await chatService.markRead(conversation.id);
      } catch (requestError) {
        if (active) setSendError(requestError.message);
      }
    };

    const connect = async () => {
      try {
        chatSocket = await getChatSocket();
        const join = () => {
          chatSocket.emit(
            'conversation:join',
            { conversationId: conversation.id },
            () => {},
          );
        };

        if (chatSocket.connected) join();
        else chatSocket.once('connect', join);

        chatSocket.on('message:new', handleMessage);
        chatSocket.on('typing:update', handleTyping);
      } catch (requestError) {
        if (active) setSendError(requestError.message);
      }
    };

    load();
    connect();

    return () => {
      active = false;
      if (chatSocket) {
        chatSocket.emit('conversation:leave', {
          conversationId: conversation.id,
        });
        chatSocket.off('message:new', handleMessage);
        chatSocket.off('typing:update', handleTyping);
      }
    };
  }, [conversation, uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => () => clearTimeout(typingTimerRef.current), []);

  const updateTyping = (value) => {
    setText(value);
    if (!conversation) return;

    getChatSocket()
      .then((chatSocket) => {
        chatSocket.emit('typing:start', {
          conversationId: conversation.id,
        });
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          chatSocket.emit('typing:stop', {
            conversationId: conversation.id,
          });
        }, 900);
      })
      .catch(() => {});
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || !conversation) return;

    const clientId =
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMessage = {
      id: `pending-${clientId}`,
      clientId,
      senderId: uid,
      type: 'text',
      text: value,
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);
    setText('');
    setSendError('');

    try {
      const chatSocket = await getChatSocket();
      chatSocket.emit(
        'message:send',
        {
          conversationId: conversation.id,
          text: value,
          clientId,
        },
        (response) => {
          if (!response?.ok) {
            setSendError(response?.error || 'Message could not be sent.');
            setMessages((current) =>
              current.filter((item) => item.clientId !== clientId),
            );
          } else {
            setMessages((current) =>
              current.map((item) =>
                item.clientId === clientId ? response.message : item,
              ),
            );
          }
        },
      );
    } catch (requestError) {
      setSendError(requestError.message);
      setMessages((current) =>
        current.filter((item) => item.clientId !== clientId),
      );
    }
  };

  const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
                {typing
                  ? 'Typing...'
                  : presence?.online
                    ? 'Online'
                    : friend.username || 'Available'}
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

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {loading ? (
              <div className="grid h-full place-items-center font-sans text-[0.82rem] text-text-muted">
                Opening conversation...
              </div>
            ) : error ? (
              <div className="mx-auto max-w-md rounded-lg bg-danger-soft p-3 text-center font-sans text-[0.82rem] text-danger">
                {error}
              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-2">
                {messages.map((message) => {
                  const own = message.senderId === uid;
                  return (
                    <div
                      key={message.id || message.clientId}
                      className={`flex ${own ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-3 py-2 font-sans text-[0.84rem] leading-5 shadow-sm ${
                          own
                            ? 'rounded-br-sm bg-brand text-text-on-brand'
                            : 'rounded-bl-sm border border-border-subtle bg-surface text-text-primary'
                        }`}
                      >
                        <p className="m-0 whitespace-pre-wrap break-words">{message.text}</p>
                        <p className={`m-0 mt-1 text-right text-[0.64rem] ${own ? 'text-white/75' : 'text-text-muted'}`}>
                          {formatTime(message.createdAt)}
                          {message.status === 'sending' ? ' · Sending' : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {typing && (
                  <div className="flex justify-start" role="status" aria-label={`${friend.name} is typing`}>
                    <div className="flex h-9 items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border-subtle bg-surface px-3 shadow-sm">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {conversation && (
            <form
              onSubmit={sendMessage}
              className="shrink-0 border-t border-border-subtle bg-surface p-3 sm:px-5"
            >
              {(sendError || error) && (
                <p className="m-0 mb-2 text-[0.72rem] text-danger">
                  {sendError || error}
                </p>
              )}
              <div className="mx-auto flex max-w-3xl items-end gap-2">
                <textarea
                  value={text}
                  onChange={(event) => updateTyping(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Type a message"
                  rows={1}
                  maxLength={5000}
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-control border border-border-control bg-surface-muted px-4 py-3 font-sans text-[0.84rem] text-text-primary outline-none focus:border-brand"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send size={18} aria-hidden="true" />
                </button>
              </div>
            </form>
          )}
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

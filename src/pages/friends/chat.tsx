import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/useAuth';
import { useFriendChat } from '../../lib/useFriendChat';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function FriendChat() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const friendId = params.get('friend_id');
  const friendName = params.get('name') || 'Chat';
  const { messages, loading, sending, sendMessage } = useFriendChat(friendId);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  if (!friendId) {
    return (
      <div className="min-h-screen bg-[#07111f] flex items-center justify-center px-4">
        <div className="text-center text-white/40">
          <p className="text-lg mb-2">No friend selected</p>
          <button onClick={() => navigate('/friends')} className="text-[#0f8cff] underline">Go to Friends</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#07111f]/95 backdrop-blur-xl border-b border-white/10 p-4 flex items-center gap-3">
        <button onClick={() => navigate('/friends')} className="text-white/60 hover:text-white text-xl">←</button>
        <div>
          <h1 className="text-white font-bold">{friendName}</h1>
          <p className="text-white/40 text-xs">Chat</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-white/40 py-20">{t('common.loading')}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-white/30 py-20">
            <p className="text-4xl mb-3">💬</p>
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === profile?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${isMine ? 'bg-[#0f8cff]/20 text-white rounded-br-md' : 'bg-white/10 text-white/90 rounded-bl-md'}`}>
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-[10px] text-white/30 mt-1 text-right">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMine && msg.read_at && <span className="ml-2 text-[#39ff14]">✓✓</span>}
                    {isMine && !msg.read_at && <span className="ml-2 text-white/30">✓</span>}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-[#07111f]/95 backdrop-blur-xl border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff] text-sm"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="neon-button px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-40"
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

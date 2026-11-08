import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { Mesh } from '../hooks/useMesh';
import { clockTime, initials, timeAgo } from '../lib/format';
import { channelConvo, dmConvo, type ChatMessage } from '../lib/store';
import { ConnectPanel } from './Connect';
import { BackIcon, SendIcon } from './Icons';

interface Convo {
  id: string;
  title: string;
  avatar: string;
  last?: ChatMessage;
}

export function MessagesTab({ mesh, openConvo, setOpenConvo }: { mesh: Mesh; openConvo: string | null; setOpenConvo: (c: string | null) => void }) {
  const [view, setView] = useState<'channels' | 'direct'>(openConvo?.startsWith('dm:') ? 'direct' : 'channels');
  const { messages, channels, contacts, unread } = mesh;

  const convos = useMemo<Convo[]>(() => {
    const lastOf = (id: string) => messages[id]?.at(-1);
    if (view === 'channels') {
      const names = new Set(channels.map((c) => c.name));
      for (const id of Object.keys(messages)) if (id.startsWith('ch:')) names.add(id.slice(3));
      return [...names].map((name) => ({ id: channelConvo(name), title: name, avatar: name.startsWith('#') ? '#' : initials(name), last: lastOf(channelConvo(name)) }));
    }
    const people = new Map(contacts.filter((c) => c.kind === 'chat' || c.kind === 'room').map((c) => [dmConvo(c.publicKey), c.name]));
    for (const id of Object.keys(messages)) if (id.startsWith('dm:') && !people.has(id)) people.set(id, messages[id].find((m) => !m.outgoing)?.from ?? id.slice(3, 11));
    return [...people].map(([id, title]) => ({ id, title, avatar: initials(title), last: lastOf(id) }));
  }, [view, channels, contacts, messages]);

  const sorted = [...convos].sort((a, b) => (b.last?.ts ?? 0) - (a.last?.ts ?? 0) || a.title.localeCompare(b.title));
  const online = mesh.status === 'online';
  const current = openConvo ? convos.find((c) => c.id === openConvo) ?? { id: openConvo, title: openConvo.slice(3), avatar: '#' } : null;

  return (
    <div className={`split ${current ? 'has-thread' : ''}`}>
      <section className="pane list-pane" aria-label="Conversations">
        {!online && <ConnectPanel mesh={mesh} compact={sorted.length > 0} />}
        {(online || sorted.length > 0 || view === 'direct') && (<>
        <div className="segmented" role="tablist">
          {(['channels', 'direct'] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>{v === 'channels' ? 'Channels' : 'Direct'}</button>
          ))}
        </div>
        {sorted.length === 0 ? (
          <p className="empty muted">{view === 'channels' ? 'No channels yet.' : 'No contacts yet — add some from Contacts.'}</p>
        ) : (
          <ul className="list">
            {sorted.map((c) => (
              <li key={c.id}>
                <button className={`row ${openConvo === c.id ? 'active' : ''}`} onClick={() => setOpenConvo(c.id)}>
                  <span className={`avatar ${c.avatar === '#' ? 'avatar-channel' : ''}`}>{c.avatar}</span>
                  <span className="row-main">
                    <span className="row-title">{c.title}</span>
                    <span className="row-sub">{c.last ? `${c.last.outgoing ? 'You' : c.last.from}: ${c.last.text}` : 'No messages'}</span>
                  </span>
                  <span className="row-meta">
                    {c.last && <span className="small muted">{timeAgo(c.last.ts)}</span>}
                    {!!unread[c.id] && <span className="badge">{unread[c.id]}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        </>)}
      </section>
      {current ? <Thread mesh={mesh} convo={current} onBack={() => setOpenConvo(null)} /> : <section className="pane thread-pane thread-empty muted">Select a conversation</section>}
    </div>
  );
}

function Thread({ mesh, convo, onBack }: { mesh: Mesh; convo: Convo; onBack: () => void }) {
  const [draft, setDraft] = useState('');
  const list = mesh.messages[convo.id] ?? [];
  const scroller = useRef<HTMLDivElement>(null);
  const online = mesh.status === 'online';
  const { markRead } = mesh;
  const inputRef = useRef<HTMLInputElement>(null);

  const reply = (name: string) => {
    setDraft((d) => (d.startsWith(`@[${name}] `) ? d : `@[${name}] ${d.replace(/^@\[[^\]]*\]\s*/, '')}`));
    inputRef.current?.focus();
  };

  useEffect(() => markRead(convo.id), [convo.id, list.length, markRead]);
  useLayoutEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [list.length, convo.id]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    void mesh.sendMessage(convo.id, draft);
    setDraft('');
  };

  return (
    <section className="pane thread-pane" aria-label={convo.title}>
      <header className="thread-head">
        <button className="icon-btn back" onClick={onBack} aria-label="Back"><BackIcon /></button>
        <span className={`avatar small-avatar ${convo.avatar === '#' ? 'avatar-channel' : ''}`}>{convo.avatar}</span>
        <h2 className="thread-title">{convo.title}</h2>
      </header>
      <div className="bubbles" ref={scroller}>
        {list.length === 0 && <p className="empty muted">No messages yet. Say hello!</p>}
        {list.map((m) => (
          <div key={m.id} className={`bubble ${m.outgoing ? 'out' : 'in'} ${m.status === 'failed' ? 'failed' : ''}`}>
            {!m.outgoing && convo.id.startsWith('ch:') && <span className="bubble-from">{m.from}</span>}
            <span className="bubble-text">{renderText(m.text)}</span>
            <span className="bubble-meta">
              {clockTime(m.ts)}
              {m.hops != null && !m.outgoing && ` · ${m.hops === 0 ? 'direct' : `${m.hops} hop${m.hops > 1 ? 's' : ''}`}`}
              {m.outgoing && ` · ${m.status === 'sending' ? 'sending…' : m.status === 'failed' ? 'failed' : 'sent'}`}
              {!m.outgoing && online && <button type="button" className="reply-btn" onClick={() => reply(m.from)} aria-label={`Reply to ${m.from}`}>↩ Reply</button>}
            </span>
          </div>
        ))}
      </div>
      <form className="composer" onSubmit={submit}>
        <input
          ref={inputRef} aria-label="Message" placeholder={online ? 'Message' : 'Connect to send'} value={draft} disabled={!online}
          maxLength={140} onChange={(e) => setDraft(e.target.value)} enterKeyHint="send"
        />
        <button className="icon-btn send" disabled={!online || !draft.trim()} aria-label="Send"><SendIcon /></button>
      </form>
    </section>
  );
}

/** Highlights MeshCore-style `@[name]` mentions, which is how replies are addressed. */
function renderText(text: string) {
  return text.split(/(@\[[^\]]+\])/g).map((part, i) =>
    /^@\[[^\]]+\]$/.test(part) ? <strong key={i} className="mention">{part}</strong> : part);
}

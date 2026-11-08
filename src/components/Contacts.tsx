import { useEffect, useMemo, useRef, useState } from 'react';
import type { Mesh } from '../hooks/useMesh';
import { initials, timeAgo } from '../lib/format';
import { DEFAULT_VIEW, loadFavorites, saveFavorites, toggleFavorite, viewContacts, type ContactFilter, type ContactSort, type ContactView } from '../lib/contacts';
import { dmConvo } from '../lib/store';
import type { Contact, ContactKind } from '../lib/types';
import { ConnectPanel } from './Connect';
import { contactCardUrl, parseContactCard } from '../lib/contactCard';
import { AddPersonIcon, BroadcastIcon, RefreshIcon, ShareIcon } from './Icons';

const KIND_LABEL: Record<ContactKind, string> = { chat: 'Companion', repeater: 'Repeater', room: 'Room', sensor: 'Sensor', unknown: 'Node' };
const LONG_PRESS_MS = 500;
const TOAST_MS = 3000;

const FILTERS: [ContactFilter, string][] = [['all', 'All'], ['users', 'Users'], ['repeaters', 'Repeaters'], ['rooms', 'Rooms'], ['favorites', '★']];

const hopLabel = (n: Contact) => (n.hops == null ? 'flood' : n.hops === 0 ? 'direct' : `${n.hops} hop${n.hops > 1 ? 's' : ''}`);

function Row({ node, favorite, unread, onOpen, onMenu, action }: { node: Contact; favorite?: boolean; unread?: number; onOpen?: () => void; onMenu?: () => void; action?: React.ReactNode }) {
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const cancel = () => window.clearTimeout(timer.current);
  const content = (
    <>
      <span className={`avatar kind-${node.kind}`}>{initials(node.name)}</span>
      <span className="row-main">
        <span className="row-title">{favorite ? '★ ' : ''}{node.name}</span>
        <span className="row-sub">{KIND_LABEL[node.kind]} · {hopLabel(node)}</span>
      </span>
      {!!unread && <span className="badge" aria-label={`${unread} unread`}>{unread}</span>}
      <span className="small muted">{node.lastAdvert ? timeAgo(node.lastAdvert * 1000) : '—'}</span>
    </>
  );
  if (!onMenu) return <div className="row">{content}{action}</div>;
  return (
    <button
      className="row"
      onPointerDown={() => { fired.current = false; timer.current = window.setTimeout(() => { fired.current = true; onMenu(); }, LONG_PRESS_MS); }}
      onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel}
      onContextMenu={(e) => { e.preventDefault(); cancel(); fired.current = true; onMenu(); }}
      onClick={() => { if (!fired.current) onOpen?.(); fired.current = false; }}
    >
      {content}
    </button>
  );
}

type Sheet = { type: 'contact'; contact: Contact } | { type: 'mine' } | { type: 'add' } | null;

const canShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export function ContactsTab({ mesh, openDm }: { mesh: Mesh; openDm: (convo: string) => void }) {
  const [note, setNote] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [view, setView] = useState<ContactView>(DEFAULT_VIEW);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  useEffect(() => saveFavorites(favorites), [favorites]);
  useEffect(() => {
    if (!note) return;
    const t = window.setTimeout(() => setNote(null), TOAST_MS);
    return () => window.clearTimeout(t);
  }, [note]);
  const lastMessageAt = useMemo(
    () => Object.fromEntries(Object.entries(mesh.messages).map(([k, v]) => [k, v[v.length - 1]?.ts ?? 0])),
    [mesh.messages],
  );
  if (mesh.status !== 'online') {
    return <div className="page narrow"><ConnectPanel mesh={mesh} /></div>;
  }
  const nodes = viewContacts(mesh.contacts, view, favorites, mesh.unread, lastMessageAt);
  const known = new Set(mesh.contacts.map((n) => n.publicKey));
  const heard = mesh.heard.filter((h) => !known.has(h.publicKey));
  const canDm = (n: Contact) => n.kind === 'chat' || n.kind === 'room';
  const myCard = mesh.self ? contactCardUrl({ name: mesh.self.name, publicKey: mesh.self.publicKey, kind: 'chat' }) : '';

  const run = async (task: () => Promise<unknown>, ok: string, fail: string) => {
    setNote(null);
    try {
      await task();
      setNote(ok);
    } catch {
      setNote(fail);
    }
  };

  const copyCard = (url: string) => run(() => navigator.clipboard.writeText(url), 'Contact card copied.', 'Could not copy contact card.');
  const shareCard = async (url: string, title: string) => {
    try {
      await navigator.share({ title, text: url });
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') void copyCard(url);
    }
  };

  const importCard = async () => {
    const card = parseContactCard(importText);
    if (!card) {
      setImportError('That is not a valid contact card. Paste a meshcore://contact/add link.');
      return;
    }
    setImportError(null);
    const name = card.format === 'url' ? card.contact.name : 'contact';
    await run(async () => {
      if (card.format === 'url') await mesh.addContact({ ...card.contact, lastAdvert: 0, hops: null });
      else await mesh.importContact(card.hex);
      setImportText('');
      setSheet(null);
    }, `Added ${name}.`, 'Could not add contact.');
  };

  const selected = sheet?.type === 'contact' ? sheet.contact : null;
  const choose = (fn: (n: Contact) => void) => { const n = selected; setSheet(null); if (n) fn(n); };
  const closeSheet = () => { setSheet(null); setImportError(null); };

  return (
    <div className="page narrow contacts">
      {note && <p className="toast" role="status">{note}</p>}

      <div className="actions-row">
        <button className="btn btn-primary btn-sm" onClick={() => void run(() => mesh.sendAdvert(true), 'Advert flooded across the mesh.', 'Advert failed.')}><BroadcastIcon className="btn-icon" /> Advert</button>
        <button className="btn btn-ghost btn-sm" onClick={() => void run(() => mesh.sendAdvert(false), 'Advert sent to nearby nodes.', 'Advert failed.')}>Zero-hop</button>
      </div>
      <div className="actions-row">
        <button className="btn btn-ghost btn-sm" disabled={!myCard} onClick={() => setSheet({ type: 'mine' })}><ShareIcon className="btn-icon" /> My card</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setSheet({ type: 'add' })}><AddPersonIcon className="btn-icon" /> Add contact</button>
      </div>

      <div className="toolbar">
        <input type="search" aria-label="Search contacts" placeholder="Search name or key" value={view.query} onChange={(e) => setView({ ...view, query: e.target.value })} />
        <button className="icon-btn" aria-label="Refresh contacts" onClick={() => void mesh.refreshContacts()}><RefreshIcon /></button>
      </div>
      <div className="segmented segmented-wrap" role="tablist">
        {FILTERS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={view.filter === id} aria-label={id === 'favorites' ? 'Favorites' : undefined} onClick={() => setView({ ...view, filter: id })}>{label}</button>
        ))}
      </div>
      <div className="toolbar">
        <label className="select-wrap">
          <span className="muted small">Sort</span>
          <select aria-label="Sort contacts" value={view.sort} onChange={(e) => setView({ ...view, sort: e.target.value as ContactSort })}>
            <option value="lastSeen">Last seen</option>
            <option value="name">Name</option>
            <option value="recent">Recent messages</option>
          </select>
        </label>
        <label className="check small">
          <input type="checkbox" checked={view.unreadOnly} onChange={(e) => setView({ ...view, unreadOnly: e.target.checked })} />
          Unread only
        </label>
      </div>

      {heard.length > 0 && (<>
        <h2 className="section-title">Heard nearby</h2>
        <ul className="list">
          {heard.map((n) => (
            <li key={n.publicKey}>
              <Row node={n} action={<button className="btn btn-primary" onClick={() => void run(() => mesh.addContact(n), `Added ${n.name}.`, 'Could not add contact.')}>Add</button>} />
            </li>
          ))}
        </ul>
      </>)}

      <h2 className="section-title">Contacts ({nodes.length}{nodes.length !== mesh.contacts.length ? ` of ${mesh.contacts.length}` : ''})</h2>
      {nodes.length > 0 && (
        <ul className="list">
          {nodes.map((n) => (
            <li key={n.publicKey}><Row node={n} favorite={favorites.includes(n.publicKey)} unread={mesh.unread[dmConvo(n.publicKey)]} onOpen={() => (canDm(n) ? openDm(dmConvo(n.publicKey)) : setSheet({ type: 'contact', contact: n }))} onMenu={() => setSheet({ type: 'contact', contact: n })} /></li>
          ))}
        </ul>
      )}
      {mesh.contacts.length > 0 && nodes.length === 0 && <p className="empty muted">No contacts match.</p>}
      {mesh.contacts.length === 0 && <p className="empty muted">No contacts yet. Add heard nodes, paste a contact card, or send an advert to announce yourself.</p>}
      {nodes.length > 0 && <p className="small muted center">Long-press a contact for options.</p>}

      {sheet && (
        <div className="sheet-backdrop" onClick={closeSheet}>
          {selected && (
            <div className="sheet" role="dialog" aria-label={selected.name} onClick={(e) => e.stopPropagation()}>
              <h2 className="sheet-title">{selected.name}</h2>
              <p className="small muted">{KIND_LABEL[selected.kind]} · <code>{selected.publicKey.slice(0, 12)}…</code></p>
              {canDm(selected) && <button className="btn btn-primary" onClick={() => choose((n) => openDm(dmConvo(n.publicKey)))}>Send message</button>}
              <button className="btn btn-ghost" onClick={() => choose((n) => setFavorites((f) => toggleFavorite(f, n.publicKey)))}>{favorites.includes(selected.publicKey) ? 'Remove from favorites' : 'Add to favorites'}</button>
              <button className="btn btn-ghost" onClick={() => choose((n) => void copyCard(contactCardUrl(n)))}>Copy contact card</button>
              <button className="btn btn-ghost" onClick={() => choose((n) => void run(() => mesh.shareContact(n.publicKey), 'Contact shared with nearby nodes.', 'Could not share contact.'))}>Share to mesh</button>
              <button className="btn btn-danger" onClick={() => choose((n) => void run(() => mesh.removeContact(n.publicKey), `Removed ${n.name}.`, 'Could not remove contact.'))}>Remove contact</button>
              <button className="btn btn-ghost" onClick={closeSheet}>Cancel</button>
            </div>
          )}
          {sheet.type === 'mine' && (
            <div className="sheet" role="dialog" aria-label="My contact card" onClick={(e) => e.stopPropagation()}>
              <h2 className="sheet-title">My contact card</h2>
              <p className="small muted">Send this link to someone. They can paste it into the MeshCore app to add you.</p>
              <code className="card-url" aria-label="Contact card link">{myCard}</code>
              <button className="btn btn-primary" onClick={() => void copyCard(myCard)}>Copy link</button>
              {canShare() && <button className="btn btn-ghost" onClick={() => void shareCard(myCard, mesh.self?.name ?? 'MeshCore contact')}>Share…</button>}
              <button className="btn btn-ghost" onClick={closeSheet}>Close</button>
            </div>
          )}
          {sheet.type === 'add' && (
            <form className="sheet" role="dialog" aria-label="Add contact" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); void importCard(); }}>
              <h2 className="sheet-title">Add contact</h2>
              <p className="small muted">Paste a contact card link (<code>meshcore://contact/add?…</code>).</p>
              <input aria-label="Contact card" placeholder="meshcore://contact/add?…" value={importText} aria-invalid={!!importError} autoFocus
                onChange={(e) => { setImportText(e.target.value); setImportError(null); }} />
              {importError && <p className="field-error" role="alert">{importError}</p>}
              <button className="btn btn-primary" disabled={!importText.trim()}>Add contact</button>
              <button type="button" className="btn btn-ghost" onClick={closeSheet}>Cancel</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

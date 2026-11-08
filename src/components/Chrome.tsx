import type { ReactNode } from 'react';
import type { Mesh, Status } from '../hooks/useMesh';
import { batteryPercent } from '../lib/format';
import { Crest, MapIcon, MessagesIcon, NetworkIcon, SettingsIcon, WeatherTabIcon } from './Icons';

export type Tab = 'messages' | 'weather' | 'contacts' | 'map' | 'settings';

const STATUS_LABEL: Record<Status, string> = { online: 'Online', offline: 'Offline', connecting: 'Connecting', error: 'Error' };

export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={`status status-${status}`} role="status">
      {status === 'error' ? <span className="status-warn" aria-hidden>!</span> : <span className="status-dot" aria-hidden />}
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Header({ mesh, onStatusClick }: { mesh: Mesh; onStatusClick: () => void }) {
  return (
    <header className="topbar">
      <Crest className="topbar-crest" />
      <div className="topbar-title">
        <span className="brand">Galaxy Core</span>
        <span className="topbar-node">{mesh.self?.name ?? 'Client'}</span>
      </div>
      {mesh.batteryMv != null && mesh.status === 'online' && (
        <span className="battery" title={`${(mesh.batteryMv / 1000).toFixed(2)} V`}>{batteryPercent(mesh.batteryMv)}%</span>
      )}
      <button className="status-button" onClick={onStatusClick} aria-label={`Connection: ${STATUS_LABEL[mesh.status]}`}>
        <StatusPill status={mesh.status} />
      </button>
    </header>
  );
}

const TABS: Array<{ id: Tab; label: string; Icon: (p: { className?: string }) => ReactNode }> = [
  { id: 'messages', label: 'Messages', Icon: MessagesIcon },
  { id: 'weather', label: 'Weather', Icon: WeatherTabIcon },
  { id: 'contacts', label: 'Contacts', Icon: NetworkIcon },
  { id: 'map', label: 'Map', Icon: MapIcon },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon },
];

export function TabBar({ tab, onChange, badges }: { tab: Tab; onChange: (t: Tab) => void; badges: Partial<Record<Tab, number>> }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ id, label, Icon }) => (
        <button key={id} className="tab" aria-current={tab === id ? 'page' : undefined} onClick={() => onChange(id)}>
          <span className="tab-icon">
            <Icon className="tab-svg" />
            {!!badges[id] && <span className="badge" aria-label={`${badges[id]} unread`}>{badges[id]! > 99 ? '99+' : badges[id]}</span>}
          </span>
          <span className="tab-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}

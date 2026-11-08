import { useEffect, useState } from 'react';
import { Header, TabBar, type Tab } from './components/Chrome';
import { MapTab } from './components/MapView';
import { MessagesTab } from './components/Messages';
import { ContactsTab } from './components/Contacts';
import { Onboarding } from './components/Onboarding';
import { SettingsTab } from './components/Settings';
import { WeatherTab } from './components/Weather';
import { useMesh } from './hooks/useMesh';
import { channelConvo } from './lib/store';
import { normalizeHashtag } from './lib/hashtag';

const TAB_KEY = 'mcc.tab';

export default function App() {
  const mesh = useMesh();
  const [tab, setTab] = useState<Tab>(() => (sessionStorage.getItem(TAB_KEY) === 'network' ? 'contacts' : sessionStorage.getItem(TAB_KEY) as Tab) || 'messages');
  const [openConvo, setOpenConvo] = useState<string | null>(null);

  useEffect(() => sessionStorage.setItem(TAB_KEY, tab), [tab]);

  const weatherConvo = channelConvo(normalizeHashtag(mesh.settings.weatherChannel));
  const messageUnread = Object.entries(mesh.unread).reduce((n, [id, c]) => (id === weatherConvo ? n : n + c), 0);

  return (
    <div className={`app tab-${tab}`}>
      <Header mesh={mesh} onStatusClick={() => setTab(mesh.status === 'online' ? 'settings' : 'messages')} />
      <main className="content">
        {tab === 'messages' && <MessagesTab mesh={mesh} openConvo={openConvo} setOpenConvo={setOpenConvo} />}
        {tab === 'weather' && <WeatherTab mesh={mesh} />}
        {tab === 'contacts' && <ContactsTab mesh={mesh} openDm={(c) => { setOpenConvo(c); setTab('messages'); }} />}
        {tab === 'map' && <MapTab mesh={mesh} openDm={(c) => { setOpenConvo(c); setTab('messages'); }} />}
        {tab === 'settings' && <SettingsTab mesh={mesh} />}
      </main>
      <TabBar tab={tab} onChange={(t) => { if (t === tab && t === 'messages') setOpenConvo(null); setTab(t); }} badges={{ messages: messageUnread, weather: mesh.unread[weatherConvo] ?? 0 }} />
      {!mesh.settings.onboarded && <Onboarding mesh={mesh} />}
    </div>
  );
}

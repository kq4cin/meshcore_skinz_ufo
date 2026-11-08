import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { normalizeHashtag } from '../lib/hashtag';
import { connectRadio } from '../lib/radio';
import {
  channelConvo, dmConvo, loadMessages, loadReadMarks, loadSettings, saveMessages, saveReadMarks, saveSettings, upsertMessage,
  type ChatMessage, type MessageMap, type Settings,
} from '../lib/store';
import type { Channel, Contact, DeviceInfo, Incoming, Radio, SelfInfo } from '../lib/types';
import { buildWeatherRequest } from '../lib/weather';

export type Status = 'offline' | 'connecting' | 'online' | 'error';

let seq = 0;
const localId = () => `out-${Date.now().toString(36)}-${(seq++).toString(36)}`;

/** Channel text arrives as "Sender: message"; split it when the prefix looks like a node name. */
export function splitSender(text: string): { from: string; body: string } {
  const at = text.indexOf(': ');
  if (at > 0 && at <= 32) return { from: text.slice(0, at), body: text.slice(at + 2) };
  return { from: 'Unknown', body: text };
}

export function useMesh() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [status, setStatus] = useState<Status>('offline');
  const [error, setError] = useState<string | null>(null);
  const [radio, setRadio] = useState<Radio | null>(null);
  const [self, setSelf] = useState<SelfInfo | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [batteryMv, setBatteryMv] = useState<number | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [weatherChannel, setWeatherChannel] = useState<Channel | null>(null);
  const [weatherPendingSince, setWeatherPendingSince] = useState<number | null>(null);
  const [heard, setHeard] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<MessageMap>(loadMessages);
  const [readMarks, setReadMarks] = useState<Record<string, number>>(loadReadMarks);

  const ref = useRef({ manualAdd: settings.manualAdd, channels, contacts, self, weatherConvo: channelConvo(normalizeHashtag(settings.weatherChannel)) });
  ref.current = { manualAdd: settings.manualAdd, channels, contacts, self, weatherConvo: channelConvo(normalizeHashtag(settings.weatherChannel)) };

  useEffect(() => saveMessages(messages), [messages]);
  useEffect(() => saveReadMarks(readMarks), [readMarks]);
  useEffect(() => saveSettings(settings), [settings]);

  const addMessage = useCallback((message: ChatMessage) => setMessages((map) => upsertMessage(map, message)), []);

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);

  const handleIncoming = useCallback((m: Incoming) => {
    const { channels: chans, contacts: people, weatherConvo } = ref.current;
    const ts = (m.ts || Math.floor(Date.now() / 1000)) * 1000;
    if (m.kind === 'channel') {
      const channel = chans.find((c) => c.idx === m.channelIdx);
      const convo = channelConvo(channel?.name ?? `Channel ${m.channelIdx}`);
      const { from, body } = splitSender(m.text);
      addMessage({ id: `${convo}|${m.ts}|${m.text}`, convo, from, text: body, ts, outgoing: false, hops: m.hops ?? undefined, snr: m.snr });
      if (convo === weatherConvo) setWeatherPendingSince(null);
    } else {
      const contact = people.find((c) => c.publicKey.startsWith(m.pubKeyPrefix));
      const convo = dmConvo(contact?.publicKey ?? m.pubKeyPrefix);
      addMessage({ id: `${convo}|${m.ts}|${m.text}`, convo, from: contact?.name ?? m.pubKeyPrefix.slice(0, 8), text: m.text, ts, outgoing: false, hops: m.hops ?? undefined, snr: m.snr });
    }
  }, [addMessage]);

  const refreshContacts = useCallback(async (r: Radio | null = radio) => {
    if (r) setContacts(await r.getContacts());
  }, [radio]);

  const connect = useCallback(async (transport: 'ble' | 'serial') => {
    setError(null);
    setStatus('connecting');
    try {
      const r: Radio = await connectRadio(transport);
      r.on((event) => {
        if (event.type === 'message') handleIncoming(event.message);
        else if (event.type === 'heard') {
          setHeard((list) => [event.contact, ...list.filter((c) => c.publicKey !== event.contact.publicKey)].slice(0, 100));
        } else if (event.type === 'contacts-changed') void r.getContacts().then(setContacts).catch(() => undefined);
        else if (event.type === 'disconnected') {
          setRadio((current) => (current === r ? null : current));
          setStatus((s) => (s === 'online' ? 'offline' : s));
        }
      });
      const info = await r.getSelfInfo();
      setSelf(info);
      await r.syncClock();
      await r.setManualAdd(ref.current.manualAdd).catch(() => undefined);
      const [people, chans] = [await r.getContacts(), await r.getChannels()];
      setContacts(people);
      setChannels(chans);
      ref.current = { ...ref.current, contacts: people, channels: chans, self: info };
      setRadio(r);
      setStatus('online');
      void r.getDeviceInfo().then(setDevice);
      void r.getBatteryMv().then(setBatteryMv);
      void r.drainMessages();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e ?? 'Connection failed');
      // User dismissing the browser device chooser is not an error worth shouting about.
      if (/cancel|No device selected|NotFoundError/i.test(message)) {
        setStatus('offline');
      } else {
        setError(message);
        setStatus('error');
      }
    }
  }, [handleIncoming]);

  const disconnect = useCallback(async () => {
    await radio?.close().catch(() => undefined);
    setRadio(null);
    setWeatherChannel(null);
    setStatus('offline');
  }, [radio]);

  // Keep the weather hashtag channel installed on the radio whenever it changes.
  const weatherTag = normalizeHashtag(settings.weatherChannel);
  useEffect(() => {
    if (!radio || !weatherTag) {
      setWeatherChannel(null);
      return;
    }
    let cancelled = false;
    radio.ensureHashtagChannel(weatherTag)
      .then(async (channel) => {
        if (cancelled) return;
        setWeatherChannel(channel);
        const chans = await radio.getChannels();
        if (!cancelled) setChannels(chans);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Could not add weather channel'));
    return () => {
      cancelled = true;
    };
  }, [radio, weatherTag]);

  const sendMessage = useCallback(async (convo: string, text: string) => {
    if (!radio || !text.trim()) return;
    const msg: ChatMessage = { id: localId(), convo, from: self?.name ?? 'Me', text: text.trim(), ts: Date.now(), outgoing: true, status: 'sending' };
    addMessage(msg);
    try {
      if (convo.startsWith('ch:')) {
        const channel = channels.find((c) => channelConvo(c.name) === convo);
        if (!channel) throw new Error('Channel not on radio');
        await radio.sendChannel(channel.idx, msg.text);
      } else {
        await radio.sendDirect(convo.slice(3), msg.text);
      }
      addMessage({ ...msg, status: 'sent' });
    } catch {
      addMessage({ ...msg, status: 'failed' });
    }
  }, [radio, self, channels, addMessage]);

  const requestWeather = useCallback(async () => {
    if (!radio || !weatherChannel || !settings.zip) return;
    setWeatherPendingSince(Date.now());
    await sendMessage(channelConvo(weatherChannel.name), buildWeatherRequest(settings.zip, settings.weatherTemplate));
  }, [radio, weatherChannel, settings.zip, settings.weatherTemplate, sendMessage]);

  useEffect(() => {
    if (!weatherPendingSince) return;
    const timer = setTimeout(() => setWeatherPendingSince(null), 90_000);
    return () => clearTimeout(timer);
  }, [weatherPendingSince]);

  const markRead = useCallback((convo: string) => setReadMarks((m) => ({ ...m, [convo]: Date.now() })), []);

  const unread = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [convo, list] of Object.entries(messages)) {
      const mark = readMarks[convo] ?? 0;
      counts[convo] = list.filter((m) => !m.outgoing && m.ts > mark).length;
    }
    return counts;
  }, [messages, readMarks]);

  const sendAdvert = useCallback(async (flood: boolean) => radio?.sendAdvert(flood), [radio]);

  const addContact = useCallback(async (contact: Contact) => {
    if (!radio) return;
    await radio.addContact(contact);
    setHeard((list) => list.filter((c) => c.publicKey !== contact.publicKey));
    await refreshContacts(radio);
  }, [radio, refreshContacts]);

  const removeContact = useCallback(async (publicKey: string) => {
    if (!radio) return;
    await radio.removeContact(publicKey);
    await refreshContacts(radio);
  }, [radio, refreshContacts]);

  const shareContact = useCallback(async (publicKey: string) => void (await radio?.shareContact(publicKey)), [radio]);
  const exportContact = useCallback(async (publicKey?: string) => (radio ? radio.exportContact(publicKey) : ''), [radio]);
  const importContact = useCallback(async (cardHex: string) => {
    if (!radio) return;
    await radio.importContact(cardHex);
    await refreshContacts(radio);
  }, [radio, refreshContacts]);

  const setManualAdd = useCallback(async (manual: boolean) => {
    updateSettings({ manualAdd: manual });
    await radio?.setManualAdd(manual);
  }, [radio, updateSettings]);

  const clearHistory = useCallback(() => {
    setMessages({});
    setReadMarks({});
  }, []);

  return {
    settings, updateSettings, status, error, setError, self, device, batteryMv, contacts, heard, channels,
    weatherChannel, weatherPending: weatherPendingSince !== null, messages, unread, transport: radio?.transport ?? null,
    connect, disconnect, sendMessage, requestWeather, markRead, sendAdvert, refreshContacts, clearHistory,
    addContact, removeContact, shareContact, exportContact, importContact, setManualAdd,
  };
}

export type Mesh = ReturnType<typeof useMesh>;

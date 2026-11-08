import { DEFAULT_TEMPLATE } from './weather';

export interface Settings {
  onboarded: boolean;
  zip: string;
  weatherChannel: string;
  weatherTemplate: string;
  /** Heard nodes are held for approval instead of being added automatically. */
  manualAdd: boolean;
}

export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface ChatMessage {
  id: string;
  /** "ch:#name" for channels, "dm:<pubkey hex>" for direct messages */
  convo: string;
  from: string;
  text: string;
  ts: number;
  outgoing: boolean;
  status?: MessageStatus;
  hops?: number;
  snr?: number | null;
}

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  zip: '',
  weatherChannel: '#weather',
  weatherTemplate: DEFAULT_TEMPLATE,
  manualAdd: true,
};

export const MAX_PER_CONVO = 200;
const SETTINGS_KEY = 'mcc.settings.v1';
const MESSAGES_KEY = 'mcc.messages.v1';
const READ_KEY = 'mcc.read.v1';

type KV = Pick<Storage, 'getItem' | 'setItem'>;

function storage(): KV | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function read<T>(key: string, fallback: T, kv: KV | null = storage()): T {
  try {
    const raw = kv?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown, kv: KV | null = storage()): void {
  try {
    kv?.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or storage disabled: keep running in memory
  }
}

export function loadSettings(kv?: KV): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(SETTINGS_KEY, {}, kv ?? storage()) };
}

export function saveSettings(settings: Settings, kv?: KV): void {
  write(SETTINGS_KEY, settings, kv ?? storage());
}

export type MessageMap = Record<string, ChatMessage[]>;

export function loadMessages(kv?: KV): MessageMap {
  return read<MessageMap>(MESSAGES_KEY, {}, kv ?? storage());
}

export function saveMessages(map: MessageMap, kv?: KV): void {
  write(MESSAGES_KEY, map, kv ?? storage());
}

/** Returns a new map with the message appended (or replaced by id), capped per conversation. */
export function upsertMessage(map: MessageMap, message: ChatMessage): MessageMap {
  const list = map[message.convo] ?? [];
  const index = list.findIndex((m) => m.id === message.id);
  const next = index >= 0 ? list.map((m, i) => (i === index ? { ...m, ...message } : m)) : [...list, message];
  next.sort((a, b) => a.ts - b.ts);
  return { ...map, [message.convo]: next.slice(-MAX_PER_CONVO) };
}

export function loadReadMarks(kv?: KV): Record<string, number> {
  return read<Record<string, number>>(READ_KEY, {}, kv ?? storage());
}

export function saveReadMarks(marks: Record<string, number>, kv?: KV): void {
  write(READ_KEY, marks, kv ?? storage());
}

export function channelConvo(name: string): string {
  return `ch:${name}`;
}

export function dmConvo(pubKeyHex: string): string {
  return `dm:${pubKeyHex}`;
}

export type ContactKind = 'chat' | 'repeater' | 'room' | 'sensor' | 'unknown';

export interface Contact {
  publicKey: string; // hex
  name: string;
  kind: ContactKind;
  lastAdvert: number; // epoch secs
  hops: number | null; // null = flood / unknown path
  lat?: number;
  lon?: number;
}

export interface Channel {
  idx: number;
  name: string;
}

export interface SelfInfo {
  name: string;
  publicKey: string;
  txPower: number;
  maxTxPower: number;
  radioFreq: number; // MHz
  radioBw: number; // kHz
  radioSf: number;
  radioCr: number;
  lat?: number;
  lon?: number;
}

export interface DeviceInfo {
  firmware: string;
  model: string;
}

export type Incoming =
  | { kind: 'channel'; channelIdx: number; text: string; ts: number; hops: number | null; snr: number | null }
  | { kind: 'direct'; pubKeyPrefix: string; text: string; ts: number; hops: number | null; snr: number | null };

export type RadioEvent =
  | { type: 'message'; message: Incoming }
  | { type: 'contacts-changed' }
  | { type: 'heard'; contact: Contact }
  | { type: 'disconnected' };

export interface Radio {
  readonly transport: 'ble' | 'serial';
  getSelfInfo(): Promise<SelfInfo>;
  getDeviceInfo(): Promise<DeviceInfo | null>;
  getBatteryMv(): Promise<number | null>;
  getContacts(): Promise<Contact[]>;
  getChannels(): Promise<Channel[]>;
  /** Finds the channel by name or installs it (hashtag key) in the first free slot. */
  ensureHashtagChannel(name: string): Promise<Channel>;
  sendDirect(publicKeyHex: string, text: string): Promise<void>;
  sendChannel(idx: number, text: string): Promise<void>;
  sendAdvert(flood: boolean): Promise<void>;
  addContact(contact: Contact): Promise<void>;
  removeContact(publicKeyHex: string): Promise<void>;
  /** Broadcasts a contact's card to nearby nodes. */
  shareContact(publicKeyHex: string): Promise<void>;
  /** Returns a contact card as hex (the advert packet), or the node's own card when no key is given. */
  exportContact(publicKeyHex?: string): Promise<string>;
  importContact(cardHex: string): Promise<void>;
  setManualAdd(manual: boolean): Promise<void>;
  syncClock(): Promise<void>;
  drainMessages(): Promise<void>;
  on(listener: (event: RadioEvent) => void): () => void;
  close(): Promise<void>;
}

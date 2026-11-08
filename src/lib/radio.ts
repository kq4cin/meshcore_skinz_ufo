import WebBleConnection from '@liamcottle/meshcore.js/src/connection/web_ble_connection.js';
import WebSerialConnection from '@liamcottle/meshcore.js/src/connection/web_serial_connection.js';
import Constants from '@liamcottle/meshcore.js/src/constants.js';
import { hashtagSecret, normalizeHashtag } from './hashtag';
import { fromHex, toHex } from './hex';
import { CommandQueue, withTimeout } from './queue';
import type { Channel, Contact, ContactKind, DeviceInfo, Radio, RadioEvent, SelfInfo } from './types';

const KINDS: Record<number, ContactKind> = { 1: 'chat', 2: 'repeater', 3: 'room', 4: 'sensor' };

function toContact(c: any): Contact {
  return {
    publicKey: toHex(c.publicKey),
    name: c.advName || toHex(c.publicKey).slice(0, 8),
    kind: KINDS[c.type] ?? 'unknown',
    lastAdvert: c.lastAdvert,
    hops: c.outPathLen >= 0 ? c.outPathLen : null,
    lat: c.advLat ? c.advLat / 1e6 : undefined,
    lon: c.advLon ? c.advLon / 1e6 : undefined,
  };
}

export function supportsBluetooth(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export function supportsSerial(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

export async function connectRadio(transport: 'ble' | 'serial'): Promise<Radio> {
  if (transport === 'ble' && !supportsBluetooth()) throw new Error('Bluetooth is not available in this browser. On iPhone use the Bluefy browser; on Android use Chrome.');
  if (transport === 'serial' && !supportsSerial()) throw new Error('USB serial is not available in this browser. Use desktop Chrome or Edge.');
  const connection = transport === 'ble' ? await WebBleConnection.open() : await WebSerialConnection.open();
  if (!connection) throw new Error('No device selected');
  await withTimeout(new Promise<void>((resolve) => connection.once('connected', () => resolve())), 20_000);
  return new MeshRadio(connection, transport);
}

class MeshRadio implements Radio {
  private readonly queue = new CommandQueue();
  private readonly listeners = new Set<(event: RadioEvent) => void>();
  private draining = false;
  private drainAgain = false;

  constructor(private readonly conn: any, readonly transport: 'ble' | 'serial') {
    conn.on(Constants.PushCodes.MsgWaiting, () => void this.drainMessages());
    conn.on(Constants.PushCodes.Advert, () => this.emit({ type: 'contacts-changed' }));
    conn.on(Constants.PushCodes.NewAdvert, (c: any) => {
      this.emit({ type: 'heard', contact: toContact(c) });
      this.emit({ type: 'contacts-changed' });
    });
    conn.on(Constants.PushCodes.PathUpdated, () => this.emit({ type: 'contacts-changed' }));
    conn.on('disconnected', () => this.emit({ type: 'disconnected' }));
  }

  on(listener: (event: RadioEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: RadioEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  getSelfInfo(): Promise<SelfInfo> {
    return this.queue.run(async () => {
      const info = await this.conn.getSelfInfo(8000);
      return {
        name: info.name,
        publicKey: toHex(info.publicKey),
        txPower: info.txPower,
        maxTxPower: info.maxTxPower,
        radioFreq: info.radioFreq / 1000,
        radioBw: info.radioBw / 1000,
        radioSf: info.radioSf,
        radioCr: info.radioCr,
        lat: info.advLat ? info.advLat / 1e6 : undefined,
        lon: info.advLon ? info.advLon / 1e6 : undefined,
      };
    });
  }

  getDeviceInfo(): Promise<DeviceInfo | null> {
    return this.queue
      .run(async () => {
        const info = await this.conn.deviceQuery(Constants.SupportedCompanionProtocolVersion);
        return { firmware: `v${info.firmwareVer} (${info.firmware_build_date})`, model: info.manufacturerModel };
      })
      .catch(() => null);
  }

  getBatteryMv(): Promise<number | null> {
    return this.queue.run(async () => (await this.conn.getBatteryVoltage()).batteryMilliVolts ?? null).catch(() => null);
  }

  getContacts(): Promise<Contact[]> {
    return this.queue.run(async () => {
      const raw: any[] = await this.conn.getContacts();
      return raw.map(toContact);
    }, 20_000);
  }

  getChannels(): Promise<Channel[]> {
    return this.queue.run(async () => {
      const raw: any[] = await this.conn.getChannels();
      return raw.filter((c) => c.name).map((c) => ({ idx: c.channelIdx, name: c.name }));
    }, 20_000);
  }

  async ensureHashtagChannel(name: string): Promise<Channel> {
    const tag = normalizeHashtag(name);
    const secret = await hashtagSecret(tag);
    return this.queue.run(async () => {
      const all: any[] = await this.conn.getChannels();
      const existing = all.find((c) => c.name?.toLowerCase() === tag);
      if (existing) return { idx: existing.channelIdx, name: existing.name };
      const free = all.find((c) => !c.name);
      if (!free) throw new Error('No free channel slots on the radio. Remove a channel and try again.');
      await this.conn.setChannel(free.channelIdx, tag, secret);
      return { idx: free.channelIdx, name: tag };
    }, 25_000);
  }

  sendDirect(publicKeyHex: string, text: string): Promise<void> {
    return this.queue.run(async () => void (await this.conn.sendTextMessage(fromHex(publicKeyHex), text)));
  }

  sendChannel(idx: number, text: string): Promise<void> {
    return this.queue.run(() => this.conn.sendChannelTextMessage(idx, text));
  }

  sendAdvert(flood: boolean): Promise<void> {
    return this.queue.run(() => (flood ? this.conn.sendFloodAdvert() : this.conn.sendZeroHopAdvert()));
  }

  addContact(c: Contact): Promise<void> {
    const type = Number(Object.keys(KINDS).find((k) => KINDS[Number(k)] === c.kind) ?? 0);
    return this.queue.run(() => this.conn.addOrUpdateContact(
      fromHex(c.publicKey), type, 0, -1, new Uint8Array(64), c.name, c.lastAdvert || Math.floor(Date.now() / 1000),
      Math.round((c.lat ?? 0) * 1e6), Math.round((c.lon ?? 0) * 1e6),
    ));
  }

  removeContact(publicKeyHex: string): Promise<void> {
    return this.queue.run(() => this.conn.removeContact(fromHex(publicKeyHex)));
  }

  shareContact(publicKeyHex: string): Promise<void> {
    return this.queue.run(() => this.conn.shareContact(fromHex(publicKeyHex)));
  }

  exportContact(publicKeyHex?: string): Promise<string> {
    return this.queue.run(async () => toHex((await this.conn.exportContact(publicKeyHex ? fromHex(publicKeyHex) : null)).advertPacketBytes));
  }

  importContact(cardHex: string): Promise<void> {
    return this.queue.run(() => this.conn.importContact(fromHex(cardHex)));
  }

  setManualAdd(manual: boolean): Promise<void> {
    return this.queue.run(() => this.conn.setOtherParams(manual));
  }

  syncClock(): Promise<void> {
    return this.queue.run<void>(() => this.conn.syncDeviceTime()).catch(() => undefined);
  }

  async drainMessages(): Promise<void> {
    if (this.draining) {
      this.drainAgain = true;
      return;
    }
    this.draining = true;
    try {
      do {
        this.drainAgain = false;
        for (let i = 0; i < 100; i++) {
          const next = await this.queue.run(() => this.conn.syncNextMessage());
          if (!next) break;
          this.handleSynced(next);
        }
      } while (this.drainAgain);
    } catch (error) {
      console.warn('Message sync failed', error);
    } finally {
      this.draining = false;
    }
  }

  private handleSynced(next: any): void {
    const hopsOf = (pathLen: number) => (pathLen === 0xff ? 0 : pathLen);
    if (next.channelMessage) {
      const m = next.channelMessage;
      this.emit({ type: 'message', message: { kind: 'channel', channelIdx: m.channelIdx, text: m.text, ts: m.senderTimestamp, hops: hopsOf(m.pathLen), snr: m.snr } });
    } else if (next.contactMessage) {
      const m = next.contactMessage;
      this.emit({ type: 'message', message: { kind: 'direct', pubKeyPrefix: toHex(m.pubKeyPrefix), text: m.text, ts: m.senderTimestamp, hops: hopsOf(m.pathLen), snr: m.snr } });
    }
  }

  async close(): Promise<void> {
    try {
      await this.conn.close();
    } finally {
      this.emit({ type: 'disconnected' });
    }
  }
}

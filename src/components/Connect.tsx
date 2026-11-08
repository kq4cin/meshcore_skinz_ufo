import type { Mesh } from '../hooks/useMesh';
import { supportsBluetooth, supportsSerial } from '../lib/radio';
import { BluetoothIcon, Crest, UsbIcon } from './Icons';

export function ConnectPanel({ mesh, compact = false }: { mesh: Mesh; compact?: boolean }) {
  const ble = supportsBluetooth();
  const serial = supportsSerial();
  const busy = mesh.status === 'connecting';
  return (
    <section className={`connect ${compact ? 'connect-compact' : ''}`} aria-labelledby="connect-title">
      {!compact && <Crest className="connect-crest" />}
      <h2 id="connect-title" className="display">{busy ? 'Connecting…' : 'Connect your radio'}</h2>
      {!compact && <p className="muted">Pair a MeshCore companion radio to chat off-grid.</p>}
      {mesh.error && <p className="alert" role="alert">{mesh.error}</p>}
      <button className="btn btn-connect" disabled={busy || !ble} onClick={() => mesh.connect('ble')}>
        <BluetoothIcon className="btn-icon" /> {busy ? 'Connecting…' : 'Connect'}
      </button>
      {serial && (
        <button className="btn btn-ghost" disabled={busy} onClick={() => mesh.connect('serial')}>
          <UsbIcon className="btn-icon" /> Use USB instead
        </button>
      )}
      {!ble && !serial && (
        <p className="muted small">This browser can’t reach radios. Use Chrome on Android or desktop, or Bluefy on iPhone.</p>
      )}
    </section>
  );
}

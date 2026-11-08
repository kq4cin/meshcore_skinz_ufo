import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { Mesh } from '../hooks/useMesh';
import { mappableContacts } from '../lib/contacts';
import { dmConvo } from '../lib/store';
import { initials } from '../lib/format';
import { ConnectPanel } from './Connect';

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const pin = (label: string, cls: string) =>
  L.divIcon({ className: '', html: `<span class="map-pin ${cls}">${label}</span>`, iconSize: [32, 32], iconAnchor: [16, 16] });

export function MapTab({ mesh, openDm }: { mesh: Mesh; openDm: (convo: string) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);
  const dmRef = useRef(openDm);
  dmRef.current = openDm;
  const online = mesh.status === 'online';

  useEffect(() => {
    if (!online || !el.current) return;
    const m = L.map(el.current, { zoomControl: true }).setView([39, -98], 4);
    L.tileLayer(TILES, { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    fitted.current = false;
    return () => { m.remove(); map.current = null; layer.current = null; };
  }, [online]);

  const points = mappableContacts(mesh.contacts);
  const me = mesh.self?.lat != null && mesh.self?.lon != null && (mesh.self.lat !== 0 || mesh.self.lon !== 0) ? mesh.self : null;

  useEffect(() => {
    const m = map.current;
    const group = layer.current;
    if (!m || !group) return;
    group.clearLayers();
    const bounds: L.LatLngTuple[] = [];
    for (const p of points) {
      const marker = L.marker([p.lat, p.lon], { icon: pin(initials(p.name), `kind-${p.kind}`), title: p.name }).addTo(group);
      const box = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = p.name;
      box.append(title);
      if (p.kind === 'chat' || p.kind === 'room') {
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary map-dm';
        btn.textContent = 'Message';
        btn.onclick = () => dmRef.current(dmConvo(p.publicKey));
        box.append(document.createElement('br'), btn);
      }
      marker.bindPopup(box);
      bounds.push([p.lat, p.lon]);
    }
    if (me) {
      L.marker([me.lat!, me.lon!], { icon: pin('Me', 'kind-me'), title: 'You' }).addTo(group);
      bounds.push([me.lat!, me.lon!]);
    }
    if (!fitted.current && bounds.length) {
      m.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      fitted.current = true;
    }
  }, [points.length, me?.lat, me?.lon, mesh.contacts, online]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!online) return <div className="page narrow"><ConnectPanel mesh={mesh} /></div>;
  return (
    <div className="map-wrap">
      <div ref={el} className="map" aria-label="Map of nearby nodes" />
      {points.length === 0 && !me && <p className="map-note small muted">No contacts have shared a position yet.</p>}
    </div>
  );
}

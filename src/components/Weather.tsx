import { useEffect, useState } from 'react';
import type { Mesh } from '../hooks/useMesh';
import { timeAgo } from '../lib/format';
import { normalizeHashtag } from '../lib/hashtag';
import { channelConvo } from '../lib/store';
import { parseWeatherReport } from '../lib/weather';
import { RefreshIcon, WeatherGlyph, WeatherTabIcon } from './Icons';
import { WeatherSetup } from './WeatherSetup';

export function WeatherTab({ mesh }: { mesh: Mesh }) {
  const { settings, updateSettings } = mesh;
  const [editing, setEditing] = useState(false);
  const tag = normalizeHashtag(settings.weatherChannel);
  const reports = (mesh.messages[channelConvo(tag)] ?? []).filter((m) => !m.outgoing).slice().reverse();
  const [latest, ...older] = reports;
  const configured = !!settings.zip && !!tag;
  const online = mesh.status === 'online';
  const ready = online && !!mesh.weatherChannel;
  const { markRead } = mesh;

  useEffect(() => markRead(channelConvo(tag)), [tag, reports.length, markRead]);

  if (!configured || editing) {
    return (
      <div className="page narrow">
        <section className="card">
          <WeatherTabIcon className="card-icon" />
          <h2 className="display">Local weather</h2>
          <p className="muted">Enter your ZIP or location and the hashtag channel your weather bot listens on.</p>
          <WeatherSetup
            zip={settings.zip} channel={settings.weatherChannel} template={settings.weatherTemplate} submitLabel="Save"
            secondary={configured ? { label: 'Cancel', onClick: () => setEditing(false) } : undefined}
            onSubmit={(zip, weatherChannel, weatherTemplate) => { updateSettings({ zip, weatherChannel, weatherTemplate }); setEditing(false); }}
          />
        </section>
      </div>
    );
  }

  const report = latest ? parseWeatherReport(latest.text) : null;

  return (
    <div className="page narrow weather">
      <button className="chip" onClick={() => setEditing(true)} aria-label="Change ZIP/location or channel">
        <strong>{settings.zip}</strong> · {tag} <span className="chip-edit">Edit</span>
      </button>

      <section className="card hero" aria-live="polite">
        {report ? (
          <>
            <div className="hero-top">
              <WeatherGlyph kind={report.icon} className="hero-glyph" />
              <div>
                {report.temp && <div className="hero-temp">{report.temp}</div>}
                {report.condition && <div className="hero-cond">{report.condition}</div>}
              </div>
            </div>
            <p className="hero-body">{report.body}</p>
            <p className="small muted">{timeAgo(latest.ts)} · from {latest.from}</p>
          </>
        ) : (
          <div className="hero-empty">
            <WeatherGlyph kind="unknown" className="hero-glyph" />
            <p className="muted">No report yet. Tap <strong>Get weather</strong> to ask the bot.</p>
          </div>
        )}
      </section>

      <button className="btn btn-primary btn-wide" disabled={!ready || mesh.weatherPending} onClick={() => void mesh.requestWeather()}>
        <RefreshIcon className={`btn-icon ${mesh.weatherPending ? 'spin' : ''}`} />
        {mesh.weatherPending ? 'Waiting for bot…' : 'Get weather'}
      </button>
      {!online && <p className="small muted center">Connect your radio to request a forecast.</p>}
      {online && !mesh.weatherChannel && <p className="small muted center">Adding {tag} to your radio…</p>}

      {older.length > 0 && (
        <details className="history">
          <summary>Earlier reports ({older.length})</summary>
          <ul className="list">
            {older.slice(0, 20).map((m) => {
              const r = parseWeatherReport(m.text);
              return (
                <li key={m.id} className="history-row">
                  <WeatherGlyph kind={r.icon} className="history-glyph" />
                  <span className="row-main"><span className="row-sub wrap">{m.text}</span></span>
                  <span className="small muted">{timeAgo(m.ts)}</span>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </div>
  );
}

import { useState } from 'react';
import type { Mesh } from '../hooks/useMesh';
import { Crest, WeatherTabIcon } from './Icons';
import { WeatherSetup } from './WeatherSetup';

export function Onboarding({ mesh }: { mesh: Mesh }) {
  const [step, setStep] = useState(0);
  const { settings, updateSettings } = mesh;
  const finish = () => updateSettings({ onboarded: true });

  return (
    <div className="sheet-backdrop">
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="onb-title">
        <div className="steps" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className={i <= step ? 'on' : ''} />)}</div>
        {step === 0 && (
          <>
            <Crest className="sheet-crest" />
            <h2 id="onb-title" className="display">Welcome to MeshCore</h2>
            <p className="muted">Off-grid messaging over LoRa — plus local weather from your mesh weather bot.</p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={finish}>Skip</button>
              <button className="btn btn-primary" onClick={() => setStep(1)}>Get started</button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <WeatherTabIcon className="sheet-icon" />
            <h2 id="onb-title" className="display">What’s your ZIP or location?</h2>
            <p className="muted">Enter whatever your weather bot responds to. It’s sent only when you ask for a forecast.</p>
            <WeatherSetup
              fields="zip" zip={settings.zip} channel={settings.weatherChannel} submitLabel="Next"
              secondary={{ label: 'Back', onClick: () => setStep(0) }}
              onSubmit={(zip) => { updateSettings({ zip }); setStep(2); }}
            />
          </>
        )}
        {step === 2 && (
          <>
            <WeatherTabIcon className="sheet-icon" />
            <h2 id="onb-title" className="display">Weather channel</h2>
            <p className="muted">Which hashtag channel does your weather bot use?</p>
            <WeatherSetup
              fields="channel" zip={settings.zip} channel={settings.weatherChannel} submitLabel="Finish"
              secondary={{ label: 'Back', onClick: () => setStep(1) }}
              onSubmit={(_, weatherChannel) => updateSettings({ weatherChannel, onboarded: true })}
            />
          </>
        )}
      </div>
    </div>
  );
}

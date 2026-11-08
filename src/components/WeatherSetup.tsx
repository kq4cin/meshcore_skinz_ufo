import { useState, type FormEvent } from 'react';
import { isValidHashtag, normalizeHashtag } from '../lib/hashtag';
import { DEFAULT_TEMPLATE, MAX_LOCATION_LENGTH, buildWeatherRequest } from '../lib/weather';

interface Props {
  zip: string;
  channel: string;
  submitLabel: string;
  onSubmit: (zip: string, channel: string, template: string) => void;
  /** When set, an "Advanced" section lets the user change the bot request format. */
  template?: string;
  /** Which field(s) to show; onboarding shows them one at a time. */
  fields?: 'both' | 'zip' | 'channel';
  secondary?: { label: string; onClick: () => void };
}

export function WeatherSetup({ zip: initialZip, channel: initialChannel, submitLabel, onSubmit, fields = 'both', secondary, template: initialTemplate }: Props) {
  const [template, setTemplate] = useState(initialTemplate ?? DEFAULT_TEMPLATE);
  const [zip, setZip] = useState(initialZip);
  const [channel, setChannel] = useState(initialChannel || '#weather');
  const [touched, setTouched] = useState(false);
  const zipOk = fields === 'channel' || zip.trim().length > 0;
  const channelOk = fields === 'zip' || isValidHashtag(channel);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (zipOk && channelOk) onSubmit(zip.trim(), normalizeHashtag(channel), template.trim() || DEFAULT_TEMPLATE);
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      {fields !== 'channel' && (
        <label className="field">
          <span className="field-label">ZIP code or location</span>
          <input
            name="zip" autoComplete="postal-code" placeholder="30301" maxLength={MAX_LOCATION_LENGTH} value={zip}
            aria-invalid={touched && !zipOk} onChange={(e) => setZip(e.target.value)} autoFocus={fields === 'zip'}
          />
          <span className="field-hint">Whatever your weather bot responds to — a ZIP, city, or other text.</span>
          {touched && !zipOk && <span className="field-error">Enter a ZIP code or location.</span>}
        </label>
      )}
      {fields !== 'zip' && (
        <label className="field">
          <span className="field-label">Weather hashtag channel</span>
          <input
            name="channel" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="#weather" value={channel}
            aria-invalid={touched && !channelOk} onChange={(e) => setChannel(e.target.value)} onBlur={() => setChannel(normalizeHashtag(channel) || channel)}
            autoFocus={fields === 'channel'}
          />
          <span className="field-hint">The channel your weather bot listens on. We’ll add it to your radio.</span>
          {touched && !channelOk && <span className="field-error">Use letters, numbers, - or _.</span>}
        </label>
      )}
      {initialTemplate !== undefined && (
        <details className="advanced">
          <summary>Advanced</summary>
          <label className="field">
            <span className="field-label">Bot request format</span>
            <input name="template" value={template} spellCheck={false} autoCapitalize="none" onChange={(e) => setTemplate(e.target.value)} />
            <span className="field-hint">{'{zip}'} is replaced with your ZIP or location. Sends: <code>{buildWeatherRequest(zip || '30301', template)}</code></span>
          </label>
        </details>
      )}
      <div className="form-actions">
        {secondary && <button type="button" className="btn btn-ghost" onClick={secondary.onClick}>{secondary.label}</button>}
        <button type="submit" className="btn btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}

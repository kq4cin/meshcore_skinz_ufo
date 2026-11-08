export const DEFAULT_TEMPLATE = '{zip}';

/** Max length of the ZIP/location text sent to the weather bot. */
export const MAX_LOCATION_LENGTH = 64;

export function buildWeatherRequest(zip: string, template: string = DEFAULT_TEMPLATE): string {
  const tpl = template.trim() || DEFAULT_TEMPLATE;
  return tpl.includes('{zip}') ? tpl.split('{zip}').join(zip) : `${tpl} ${zip}`;
}

export interface WeatherReport {
  temp?: string;
  condition?: string;
  icon: WeatherIcon;
  body: string;
}

export type WeatherIcon = 'sun' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog' | 'wind' | 'unknown';

const ICON_RULES: Array<[WeatherIcon, RegExp]> = [
  ['storm', /thunder|t-?storm|lightning|tornado|severe/i],
  ['snow', /snow|sleet|flurr|blizzard|ice/i],
  ['rain', /rain|shower|drizzle/i],
  ['fog', /fog|mist|haze|smoke/i],
  ['cloud', /cloud|overcast/i],
  ['sun', /sun|clear|fair/i],
  ['wind', /wind|breez|gust/i],
];

/** Best-effort extraction of temperature and condition from a free-form bot reply. */
export function parseWeatherReport(text: string): WeatherReport {
  const body = text.trim();
  const tempMatch = body.match(/(-?\d{1,3}(?:\.\d)?)\s*°?\s*([FC])\b/i) ?? body.match(/(-?\d{1,3})\s*°/);
  const temp = tempMatch ? `${Math.round(Number(tempMatch[1]))}°${tempMatch[2]?.toUpperCase() ?? ''}` : undefined;
  const icon = ICON_RULES.find(([, re]) => re.test(body))?.[0] ?? 'unknown';
  const conditionMatch = body.match(/\b(sunny|clear|fair|partly cloudy|mostly cloudy|cloudy|overcast|rain|showers|drizzle|thunderstorms?|snow|sleet|fog|haze|windy)\b/i);
  const condition = conditionMatch ? conditionMatch[1].replace(/\b\w/g, (c) => c.toUpperCase()) : undefined;
  return { temp, condition, icon, body };
}

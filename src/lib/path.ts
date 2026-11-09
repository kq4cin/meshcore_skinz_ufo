/**
 * Decodes a MeshCore path_len byte into a hop count.
 * Firmware packs the path-hash size into the top 2 bits (`(size - 1) << 6`) and the
 * hop count into the low 6 bits. 0xFF means no known hop count (direct-routed / unknown path).
 */
export function hopsFromPathLen(pathLen: number | null | undefined): number | null {
  if (pathLen == null) return null;
  const byte = pathLen & 0xff;
  if (byte === 0xff) return null;
  return byte & 63;
}

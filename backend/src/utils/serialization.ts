export function serializeReadings(readings: any): string {
  if (typeof readings === 'string') return readings;
  return JSON.stringify(readings);
}

export function parseReadings(readingsStr: string | null): any {
  if (!readingsStr) return [];
  try {
    return JSON.parse(readingsStr);
  } catch (e) {
    console.error('Failed to parse readings:', e);
    return [];
  }
}

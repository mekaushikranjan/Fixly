interface MobilePingRecord {
  timestamp: number;
  platform: string;
  version?: string;
}

let latestPing: MobilePingRecord | null = null;

export function recordMobilePing(platform: string, version?: string): void {
  latestPing = {
    timestamp: Date.now(),
    platform,
    version,
  };
}

export function getLastMobilePing(): MobilePingRecord | null {
  return latestPing;
}

export function isMobileActive(withinMs: number = 15 * 60 * 1000): boolean {
  if (!latestPing) return false;
  return Date.now() - latestPing.timestamp < withinMs;
}


export type DeviceStatus = {
  system?: { product?: string; firmware?: string; mode?: string; uptime?: string; uptimeSeconds?: number; bootCount?: number; resetReason?: string }
  health?: { overall?: string; gps?: string; storage?: string; logger?: string; wifi?: string }
  board?: Record<string, string | number | boolean>
  wifi?: { ssid?: string; password?: string; ip?: string; connectedClients?: number; uptimeSeconds?: number }
  gps?: { connected?: boolean; source?: string; validFix?: boolean; fixType?: number; satellites?: number; latitude?: number; longitude?: number; speedKmh?: number; heading?: number; heightM?: number; sampleRateHz?: number; lastPacketAgeMs?: number; packetCount?: number; checksumErrors?: number; demoSource?: string }
  storage?: { type?: string; filesystem?: string; ready?: boolean; totalBytes?: number; usedBytes?: number; freeBytes?: number; usedPercent?: number; sessionCount?: number; writeErrors?: number }
  logger?: { state?: string; recording?: boolean; currentFile?: string; samplesWritten?: number; startSpeedKmh?: number; stopSpeedKmh?: number; stopDelaySeconds?: number; recordingSeconds?: number; lastWriteAgeMs?: number }
}

export type DeviceSession = { file: string; sizeBytes: number; complete?: boolean; downloadUrl: string; generatedByRaceSync?: boolean }
export type DeviceSessionsResponse = { device: string; count: number; sessions: DeviceSession[] }

export type VBoxSample = {
  index: number
  sats: number
  timeRaw: number
  timeSeconds: number
  latitude: number
  longitude: number
  velocityKmh: number
  heading: number
  height: number
  verticalVelocity: number
  samplePeriod: number
  solutionType: number
  channels: Record<string, number>
}

export type StartLine = { a: { latitude: number; longitude: number }; b: { latitude: number; longitude: number } }
export type Lap = { lapNumber: number; startIndex: number; endIndex: number; lapTimeSeconds: number; distanceMeters: number; maxSpeedKmh: number; avgSpeedKmh: number }
export type ParsedSession = { filename: string; trackName: string; samplePeriod: number; samples: VBoxSample[]; laps: Lap[]; startLine?: StartLine; channelNames: string[]; maxSpeedKmh: number; durationSeconds: number; rawText: string }

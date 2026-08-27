export type DeviceStatus = {
  system?: {
    product?: string
    firmware?: string
    mode?: string
    uptimeSeconds?: number
    uptime?: string
    bootCount?: number
    resetReason?: string
  }
  health?: {
    overall?: string
    gps?: string
    storage?: string
    logger?: string
    wifi?: string
  }
  board?: Record<string, string | number | boolean>
  wifi?: {
    status?: string
    mode?: string
    ssid?: string
    password?: string
    ip?: string
    connectedClients?: number
    uptimeSeconds?: number
  }
  gps?: {
    connected?: boolean
    source?: string
    validFix?: boolean
    fixType?: number
    satellites?: number
    latitude?: number
    longitude?: number
    speedKmh?: number
    heading?: number
    heightM?: number
    sampleRateHz?: number
    lastPacketAgeMs?: number
    bytesReceived?: number
    packetCount?: number
    checksumErrors?: number
    demoSource?: string
  }
  storage?: {
    type?: string
    filesystem?: string
    ready?: boolean
    totalBytes?: number
    usedBytes?: number
    freeBytes?: number
    usedPercent?: number
    sessionCount?: number
    writeErrors?: number
  }
  logger?: {
    state?: string
    recording?: boolean
    currentFile?: string
    samplesWritten?: number
    startSpeedKmh?: number
    stopSpeedKmh?: number
    stopDelaySeconds?: number
    recordingSeconds?: number
    lastWriteAgeMs?: number
  }
  power?: Record<string, unknown>
}

export type DeviceSession = {
  id: number
  file: string
  sizeBytes: number
  complete?: boolean
  active?: boolean
  protected?: boolean
  deletable?: boolean
  generatedByRaceSync?: boolean
  downloadUrl: string
  deleteUrl?: string
}

export type DeviceSessionsResponse = {
  device: string
  count: number
  sessions: DeviceSession[]
}

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

export type TimingReference = {
  /**
   * Racelogic [laptiming] stores two extremely close GPS points.
   * They identify the timing location and track direction.
   *
   * RaceSync uses their midpoint as the timing-line centre and
   * constructs a finite line perpendicular to their direction.
   */
  source: 'VBOX_LAPTIMING' | 'KNOWN_CIRCUIT' | 'AUTO_DERIVED'
  referenceA: {
    latitude: number
    longitude: number
  }
  referenceB: {
    latitude: number
    longitude: number
  }
  centre: {
    latitude: number
    longitude: number
  }
  halfWidthMeters: number
}

export type LapCrossing = {
  sampleIndex: number
  timeSeconds: number
  interpolation: number
  latitude: number
  longitude: number
}

export type Lap = {
  lapNumber: number
  startIndex: number
  endIndex: number
  startTimeSeconds: number
  endTimeSeconds: number
  lapTimeSeconds: number
  distanceMeters: number
  maxSpeedKmh: number
  avgSpeedKmh: number
}

export type ParsedSession = {
  id: string
  filename: string
  trackName: string
  samplePeriod: number
  samples: VBoxSample[]
  laps: Lap[]
  timingReference?: TimingReference
  crossings: LapCrossing[]
  channelNames: string[]
  maxSpeedKmh: number
  durationSeconds: number
  rawText: string
}

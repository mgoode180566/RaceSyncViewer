import type {
  ParsedSession,
  TimingReference,
  VBoxSample,
} from '../types'

import {
  detectLapsFromVBoxTiming,
} from '../laps/LapDetector'


function vboxMinutesToLatitude(
  raw: number,
): number {
  return (
    raw /
    60
  )
}


function vboxMinutesToLongitude(
  raw: number,
): number {
  // The sample VBOX records west longitude as a positive
  // total-minutes number. RaceSync converts it to normal
  // signed decimal degrees.
  return (
    -raw /
    60
  )
}


function vboxTimeToSeconds(
  raw: number,
): number {
  const hours =
    Math.floor(
      raw /
      10000,
    )

  const minutes =
    Math.floor(
      (
        raw %
        10000
      ) /
      100,
    )

  const seconds =
    raw -
    hours * 10000 -
    minutes * 100

  return (
    hours * 3600 +
    minutes * 60 +
    seconds
  )
}


function normaliseTime(
  samples: VBoxSample[],
)
{
  if (
    samples.length ===
    0
  ) {
    return
  }

  let dayOffset =
    0

  let previous =
    samples[0]
      .timeSeconds


  for (
    let i = 1;
    i < samples.length;
    i++
  ) {
    let current =
      samples[i]
        .timeSeconds +
      dayOffset


    if (
      current <
      previous -
      12 * 3600
    ) {
      dayOffset +=
        24 * 3600

      current =
        samples[i]
          .timeSeconds +
        dayOffset
    }


    samples[i]
      .timeSeconds =
      current

    previous =
      current
  }
}


function parseSections(
  text: string,
): Map<string, string[]> {
  const sections =
    new Map<
      string,
      string[]
    >()

  let currentSection =
    ''


  for (
    const rawLine
    of text.split(
      /\r?\n/,
    )
  ) {
    const line =
      rawLine.trim()

    if (!line) {
      continue
    }


    const sectionMatch =
      line.match(
        /^\[(.+)]$/,
      )


    if (
      sectionMatch
    ) {
      currentSection =
        sectionMatch[1]
          .trim()
          .toLowerCase()

      if (
        !sections.has(
          currentSection,
        )
      ) {
        sections.set(
          currentSection,
          [],
        )
      }

      continue
    }


    if (
      currentSection
    ) {
      sections
        .get(
          currentSection,
        )
        ?.push(
          line,
        )
    }
  }


  return sections
}


/**
 * Parse Racelogic:
 *
 * Start +61.407310 +3124.095880 +61.407430 +3124.095780
 *
 * The fields are:
 *
 *   longitude1 latitude1 longitude2 latitude2
 *
 * in total arc-minutes.
 *
 * The pair is a very short orientation reference, not a
 * 20-30 metre physical line across the track.
 */
function parseVBoxTimingReference(
  lines: string[],
): TimingReference | undefined {
  const startLine =
    lines.find(
      line =>
        /^Start\b/i.test(
          line,
        ),
    )


  if (
    !startLine
  ) {
    return undefined
  }


  const matches =
    startLine.match(
      /[+-]?\d+(?:\.\d+)?/g,
    )


  if (
    !matches ||
    matches.length <
    4
  ) {
    return undefined
  }


  const [
    longitude1Raw,
    latitude1Raw,
    longitude2Raw,
    latitude2Raw,
  ] =
    matches
      .slice(
        0,
        4,
      )
      .map(
        Number,
      )


  const referenceA = {
    latitude:
      vboxMinutesToLatitude(
        latitude1Raw,
      ),

    longitude:
      vboxMinutesToLongitude(
        longitude1Raw,
      ),
  }


  const referenceB = {
    latitude:
      vboxMinutesToLatitude(
        latitude2Raw,
      ),

    longitude:
      vboxMinutesToLongitude(
        longitude2Raw,
      ),
  }


  return {
    source:
      'VBOX_LAPTIMING',

    referenceA,

    referenceB,

    centre: {
      latitude:
        (
          referenceA.latitude +
          referenceB.latitude
        ) /
        2,

      longitude:
        (
          referenceA.longitude +
          referenceB.longitude
        ) /
        2,
    },

    halfWidthMeters:
      30,
  }
}


function detectTrackName(
  samples: VBoxSample[],
): string {
  if (
    samples.length ===
    0
  ) {
    return 'Unknown circuit'
  }


  const averageLatitude =
    samples.reduce(
      (
        total,
        sample,
      ) =>
        total +
        sample.latitude,

      0,
    ) /
    samples.length


  const averageLongitude =
    samples.reduce(
      (
        total,
        sample,
      ) =>
        total +
        sample.longitude,

      0,
    ) /
    samples.length


  const silverstoneLatitude =
    52.0733

  const silverstoneLongitude =
    -1.0147


  const northSouth =
    (
      averageLatitude -
      silverstoneLatitude
    ) *
    111_320


  const eastWest =
    (
      averageLongitude -
      silverstoneLongitude
    ) *
    111_320 *
    Math.cos(
      averageLatitude *
      Math.PI /
      180,
    )


  if (
    Math.hypot(
      northSouth,
      eastWest,
    ) <
    5_000
  ) {
    return 'Silverstone'
  }


  return 'Unknown circuit'
}


export function parseVBox(
  text: string,
  filename: string,
): ParsedSession {
  const sections =
    parseSections(
      text,
    )


  const dataLines =
    sections.get(
      'data',
    ) ??
    []


  const columnLine =
    (
      sections.get(
        'column names',
      ) ??
      []
    )[0] ??
    ''


  const columns =
    columnLine
      .split(
        /\s+/,
      )
      .filter(
        Boolean,
      )


  const samples:
    VBoxSample[] =
    []


  for (
    const line
    of dataLines
  ) {
    const values =
      line
        .split(
          /\s+/,
        )
        .map(
          Number,
        )


    if (
      values.length <
      12
    ) {
      continue
    }


    if (
      values
        .slice(
          0,
          12,
        )
        .some(
          value =>
            !Number.isFinite(
              value,
            ),
        )
    ) {
      continue
    }


    const channels:
      Record<
        string,
        number
      > =
      {}


    for (
      let i = 12;
      i < values.length;
      i++
    ) {
      channels[
        columns[i] ??
        `channel${i}`
      ] =
        values[i]
    }


    samples.push(
      {
        index:
          samples.length,

        sats:
          values[0],

        timeRaw:
          values[1],

        timeSeconds:
          vboxTimeToSeconds(
            values[1],
          ),

        latitude:
          vboxMinutesToLatitude(
            values[2],
          ),

        longitude:
          vboxMinutesToLongitude(
            values[3],
          ),

        velocityKmh:
          values[4],

        heading:
          values[5],

        height:
          values[6],

        verticalVelocity:
          values[7],

        samplePeriod:
          values[8] >
            0 &&
          values[8] <=
            1
            ? values[8]
            : 0.040,

        solutionType:
          values[9],

        channels,
      },
    )
  }


  if (
    samples.length ===
    0
  ) {
    throw new Error(
      'No VBOX telemetry samples were found.',
    )
  }


  normaliseTime(
    samples,
  )


  // ----------------------------------------------------------
  // LAP DETECTION PRIORITY
  //
  // 1. VBOX [laptiming] line
  // 2. Later: known-circuit database
  // 3. Later: automatic repeated-loop derivation
  // ----------------------------------------------------------

  const timingReference =
    parseVBoxTimingReference(
      sections.get(
        'laptiming',
      ) ??
      [],
    )


  const lapResult =
    timingReference
      ? detectLapsFromVBoxTiming(
          samples,
          timingReference,
          {
            lineHalfWidthMeters:
              30,

            minimumLapTimeSeconds:
              20,

            maximumLapTimeSeconds:
              600,

            minimumCrossingSpeedKmh:
              15,
          },
        )
      : {
          laps: [],
          crossings: [],
          timingReference:
            undefined,
        }


  const channelNames =
    [
      ...new Set(
        samples.flatMap(
          sample =>
            Object.keys(
              sample.channels,
            ),
        ),
      ),
    ]


  const samplePeriod =
    samples.find(
      sample =>
        sample.samplePeriod >
        0,
    )?.samplePeriod ??
    0.040


  return {
    id:
      `${filename}-${Date.now()}`,

    filename,

    trackName:
      detectTrackName(
        samples,
      ),

    samplePeriod,

    samples,

    laps:
      lapResult.laps,

    timingReference:
      lapResult.timingReference,

    crossings:
      lapResult.crossings,

    channelNames,

    maxSpeedKmh:
      Math.max(
        ...samples.map(
          sample =>
            sample.velocityKmh,
        ),
      ),

    durationSeconds:
      samples[
        samples.length -
        1
      ].timeSeconds -
      samples[0]
        .timeSeconds,

    rawText:
      text,
  }
}

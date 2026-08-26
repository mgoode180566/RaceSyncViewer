import type {
  Lap,
  LapCrossing,
  TimingReference,
  VBoxSample,
} from '../types'

type XY = {
  x: number
  y: number
}

const EARTH_RADIUS_METERS = 6_371_000

export type LapDetectionOptions = {
  lineHalfWidthMeters?: number
  minimumLapTimeSeconds?: number
  maximumLapTimeSeconds?: number
  minimumCrossingSpeedKmh?: number
}

export type LapDetectionResult = {
  laps: Lap[]
  crossings: LapCrossing[]
  timingReference: TimingReference
}

function localProjection(
  latitude: number,
  longitude: number,
  referenceLatitude: number,
  referenceLongitude: number,
): XY {
  const referenceLatitudeRadians =
    referenceLatitude *
    Math.PI /
    180

  return {
    x:
      (
        longitude -
        referenceLongitude
      ) *
      Math.PI /
      180 *
      EARTH_RADIUS_METERS *
      Math.cos(
        referenceLatitudeRadians,
      ),

    y:
      (
        latitude -
        referenceLatitude
      ) *
      Math.PI /
      180 *
      EARTH_RADIUS_METERS,
  }
}

function vectorLength(
  vector: XY,
): number {
  return Math.hypot(
    vector.x,
    vector.y,
  )
}

function normalise(
  vector: XY,
): XY {
  const length =
    vectorLength(
      vector,
    )

  if (
    length <
    1e-9
  ) {
    throw new Error(
      'The VBOX laptiming reference points are identical.',
    )
  }

  return {
    x:
      vector.x /
      length,

    y:
      vector.y /
      length,
  }
}

function dot(
  a: XY,
  b: XY,
): number {
  return (
    a.x * b.x +
    a.y * b.y
  )
}

function subtract(
  a: XY,
  b: XY,
): XY {
  return {
    x:
      a.x -
      b.x,

    y:
      a.y -
      b.y,
  }
}

function distanceMeters(
  a: XY,
  b: XY,
): number {
  return Math.hypot(
    a.x -
      b.x,

    a.y -
      b.y,
  )
}

function interpolate(
  a: number,
  b: number,
  fraction: number,
): number {
  return (
    a +
    (
      b -
      a
    ) *
    fraction
  )
}

function buildLap(
  lapNumber: number,
  start: LapCrossing,
  end: LapCrossing,
  samples: VBoxSample[],
  points: XY[],
): Lap {
  const startIndex =
    Math.max(
      0,
      start.sampleIndex,
    )

  const endIndex =
    Math.min(
      samples.length - 1,
      end.sampleIndex,
    )

  let distance =
    0

  let speedTotal =
    0

  let speedCount =
    0

  let maximumSpeed =
    0

  for (
    let i =
      startIndex + 1;
    i <= endIndex;
    i++
  ) {
    distance +=
      distanceMeters(
        points[i - 1],
        points[i],
      )
  }

  for (
    let i =
      startIndex;
    i <= endIndex;
    i++
  ) {
    const speed =
      samples[i]
        .velocityKmh

    speedTotal +=
      speed

    speedCount++

    maximumSpeed =
      Math.max(
        maximumSpeed,
        speed,
      )
  }

  return {
    lapNumber,
    startIndex,
    endIndex,

    startTimeSeconds:
      start.timeSeconds,

    endTimeSeconds:
      end.timeSeconds,

    lapTimeSeconds:
      end.timeSeconds -
      start.timeSeconds,

    distanceMeters:
      distance,

    maxSpeedKmh:
      maximumSpeed,

    avgSpeedKmh:
      speedCount > 0
        ? speedTotal /
          speedCount
        : 0,
  }
}


/**
 * Detect complete laps from the Racelogic [laptiming] Start record.
 *
 * Important detail:
 *
 * The two VBOX Start coordinates are NOT treated as the physical
 * endpoints of a track-width timing line. In the Silverstone sample
 * they are only about 0.23 m apart.
 *
 * They define the timing location and an orientation vector.
 *
 * RaceSync:
 *
 *  1. converts those reference points and all samples to local X/Y;
 *  2. uses the reference-pair midpoint as timing-line centre;
 *  3. determines the actual direction of travel from nearby samples;
 *  4. constructs a finite timing line perpendicular to that direction;
 *  5. detects trajectory crossings through the finite line;
 *  6. interpolates the exact crossing timestamp between 25 Hz samples;
 *  7. forms complete laps from consecutive accepted crossings.
 */
export function detectLapsFromVBoxTiming(
  samples: VBoxSample[],
  timingReference: TimingReference,
  options: LapDetectionOptions = {},
): LapDetectionResult {
  if (
    samples.length <
    2
  ) {
    throw new Error(
      'Not enough GPS samples for lap detection.',
    )
  }

  const halfWidthMeters =
    options.lineHalfWidthMeters ??
    timingReference.halfWidthMeters ??
    30

  const minimumLapTimeSeconds =
    options.minimumLapTimeSeconds ??
    20

  const maximumLapTimeSeconds =
    options.maximumLapTimeSeconds ??
    600

  const minimumCrossingSpeedKmh =
    options.minimumCrossingSpeedKmh ??
    15


  // ----------------------------------------------------------
  // LOCAL COORDINATE SYSTEM
  // ----------------------------------------------------------

  const referenceLatitude =
    timingReference
      .centre
      .latitude

  const referenceLongitude =
    timingReference
      .centre
      .longitude

  const points =
    samples.map(
      sample =>
        localProjection(
          sample.latitude,
          sample.longitude,
          referenceLatitude,
          referenceLongitude,
        ),
    )


  const referenceA =
    localProjection(
      timingReference
        .referenceA
        .latitude,

      timingReference
        .referenceA
        .longitude,

      referenceLatitude,
      referenceLongitude,
    )


  const referenceB =
    localProjection(
      timingReference
        .referenceB
        .latitude,

      timingReference
        .referenceB
        .longitude,

      referenceLatitude,
      referenceLongitude,
    )


  const centre: XY = {
    x:
      (
        referenceA.x +
        referenceB.x
      ) /
      2,

    y:
      (
        referenceA.y +
        referenceB.y
      ) /
      2,
  }


  // ----------------------------------------------------------
  // REFERENCE DIRECTION
  //
  // The pair may point either with or against vehicle travel.
  // We therefore determine its sign using actual trajectory data
  // near the timing point.
  // ----------------------------------------------------------

  let travelAxis =
    normalise(
      subtract(
        referenceB,
        referenceA,
      ),
    )


  // Find trajectory segments within 40 m of the timing centre.
  // Their mean direction tells us which way the bike actually
  // travels through the timing area.

  let meanTravelX =
    0

  let meanTravelY =
    0

  let nearbySegments =
    0

  for (
    let i = 1;
    i < points.length;
    i++
  ) {
    const midpoint: XY = {
      x:
        (
          points[i - 1].x +
          points[i].x
        ) /
        2,

      y:
        (
          points[i - 1].y +
          points[i].y
        ) /
        2,
    }

    if (
      distanceMeters(
        midpoint,
        centre,
      ) >
      40
    ) {
      continue
    }

    const movement =
      subtract(
        points[i],
        points[i - 1],
      )

    const movementLength =
      vectorLength(
        movement,
      )

    if (
      movementLength <
      0.05
    ) {
      continue
    }

    meanTravelX +=
      movement.x /
      movementLength

    meanTravelY +=
      movement.y /
      movementLength

    nearbySegments++
  }


  if (
    nearbySegments >
    0
  ) {
    const meanTravel =
      normalise(
        {
          x:
            meanTravelX,

          y:
            meanTravelY,
        },
      )

    // Flip the reference axis so negative -> positive means
    // forward travel through the timing line.

    if (
      dot(
        meanTravel,
        travelAxis,
      ) <
      0
    ) {
      travelAxis = {
        x:
          -travelAxis.x,

        y:
          -travelAxis.y,
      }
    }
  }


  // Timing-line direction is perpendicular to travel.

  const lineAxis: XY = {
    x:
      -travelAxis.y,

    y:
      travelAxis.x,
  }


  // ----------------------------------------------------------
  // CROSSINGS
  // ----------------------------------------------------------

  const crossings:
    LapCrossing[] =
    []

  let lastAcceptedCrossingTime =
    Number.NEGATIVE_INFINITY


  for (
    let i = 1;
    i < samples.length;
    i++
  ) {
    const previousPoint =
      points[i - 1]

    const currentPoint =
      points[i]


    // Signed distance along travel axis.
    //
    // A forward crossing is:
    //
    //     negative -> positive

    const previousSide =
      dot(
        subtract(
          previousPoint,
          centre,
        ),
        travelAxis,
      )

    const currentSide =
      dot(
        subtract(
          currentPoint,
          centre,
        ),
        travelAxis,
      )


    if (
      !(
        previousSide <
        0 &&
        currentSide >=
        0
      )
    ) {
      continue
    }


    const denominator =
      previousSide -
      currentSide


    if (
      Math.abs(
        denominator,
      ) <
      1e-9
    ) {
      continue
    }


    const fraction =
      Math.max(
        0,
        Math.min(
          1,
          previousSide /
          denominator,
        ),
      )


    const crossingPoint: XY = {
      x:
        interpolate(
          previousPoint.x,
          currentPoint.x,
          fraction,
        ),

      y:
        interpolate(
          previousPoint.y,
          currentPoint.y,
          fraction,
        ),
    }


    // The timing line is finite.
    //
    // Reject another part of the circuit crossing the infinite
    // mathematical line away from the actual S/F location.

    const lateralDistance =
      Math.abs(
        dot(
          subtract(
            crossingPoint,
            centre,
          ),
          lineAxis,
        ),
      )


    if (
      lateralDistance >
      halfWidthMeters
    ) {
      continue
    }


    const crossingSpeed =
      interpolate(
        samples[i - 1]
          .velocityKmh,

        samples[i]
          .velocityKmh,

        fraction,
      )


    if (
      crossingSpeed <
      minimumCrossingSpeedKmh
    ) {
      continue
    }


    const crossingTime =
      interpolate(
        samples[i - 1]
          .timeSeconds,

        samples[i]
          .timeSeconds,

        fraction,
      )


    // Debounce/noise rejection.
    //
    // Nothing inside one believable lap duration can become
    // another accepted S/F crossing.

    if (
      crossingTime -
      lastAcceptedCrossingTime <
      minimumLapTimeSeconds
    ) {
      continue
    }


    crossings.push(
      {
        sampleIndex:
          i,

        timeSeconds:
          crossingTime,

        interpolation:
          fraction,

        latitude:
          interpolate(
            samples[i - 1]
              .latitude,

            samples[i]
              .latitude,

            fraction,
          ),

        longitude:
          interpolate(
            samples[i - 1]
              .longitude,

            samples[i]
              .longitude,

            fraction,
          ),
      },
    )


    lastAcceptedCrossingTime =
      crossingTime
  }


  // ----------------------------------------------------------
  // COMPLETE LAPS
  //
  // First partial segment before crossing #1 is ignored.
  // Final partial segment after the last crossing is ignored.
  // ----------------------------------------------------------

  const laps:
    Lap[] =
    []


  for (
    let crossingIndex = 1;
    crossingIndex <
    crossings.length;
    crossingIndex++
  ) {
    const start =
      crossings[
        crossingIndex -
        1
      ]

    const end =
      crossings[
        crossingIndex
      ]

    const lapTime =
      end.timeSeconds -
      start.timeSeconds


    if (
      lapTime <
        minimumLapTimeSeconds ||
      lapTime >
        maximumLapTimeSeconds
    ) {
      continue
    }


    laps.push(
      buildLap(
        laps.length +
        1,

        start,
        end,

        samples,
        points,
      ),
    )
  }


  return {
    laps,
    crossings,

    timingReference: {
      ...timingReference,

      halfWidthMeters,
    },
  }
}

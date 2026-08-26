import {
  Box,
  Stack,
  Typography,
} from '@mui/material'

import type {
  ParsedSession,
  VBoxSample,
} from '../types'

import {
  lapColour,
} from './lapColours'


function pointsForLap(
  session: ParsedSession,
  lapNumber: number,
): VBoxSample[] {
  const lap =
    session.laps.find(
      item =>
        item.lapNumber ===
        lapNumber,
    )

  if (!lap) {
    return []
  }

  return session.samples.slice(
    lap.startIndex,
    lap.endIndex +
      1,
  )
}


export function TrackMap(
  {
    session,
    selectedLapNumbers,
  }:
  {
    session: ParsedSession
    selectedLapNumbers: number[]
  },
) {
  if (
    session.samples.length ===
    0
  ) {
    return null
  }


  const width =
    900

  const height =
    540

  const padding =
    30


  const minLatitude =
    Math.min(
      ...session.samples.map(
        sample =>
          sample.latitude,
      ),
    )

  const maxLatitude =
    Math.max(
      ...session.samples.map(
        sample =>
          sample.latitude,
      ),
    )

  const minLongitude =
    Math.min(
      ...session.samples.map(
        sample =>
          sample.longitude,
      ),
    )

  const maxLongitude =
    Math.max(
      ...session.samples.map(
        sample =>
          sample.longitude,
      ),
    )


  const latitudeMidpoint =
    (
      minLatitude +
      maxLatitude
    ) /
    2


  const longitudeScale =
    Math.cos(
      latitudeMidpoint *
      Math.PI /
      180,
    )


  const longitudeSpan =
    Math.max(
      1e-9,
      (
        maxLongitude -
        minLongitude
      ) *
      longitudeScale,
    )


  const latitudeSpan =
    Math.max(
      1e-9,
      maxLatitude -
      minLatitude,
    )


  const scale =
    Math.min(
      (
        width -
        padding *
        2
      ) /
      longitudeSpan,

      (
        height -
        padding *
        2
      ) /
      latitudeSpan,
    )


  const x =
    (
      longitude:
        number,
    ) =>
      padding +
      (
        longitude -
        minLongitude
      ) *
      longitudeScale *
      scale


  const y =
    (
      latitude:
        number,
    ) =>
      height -
      padding -
      (
        latitude -
        minLatitude
      ) *
      scale


  const makePolyline =
    (
      samples:
        VBoxSample[],
    ) => {
      const step =
        Math.max(
          1,
          Math.floor(
            samples.length /
            4000,
          ),
        )

      return samples
        .filter(
          (
            _,
            index,
          ) =>
            index %
            step ===
            0,
        )
        .map(
          sample =>
            `${x(
              sample.longitude,
            ).toFixed(
              1,
            )},${y(
              sample.latitude,
            ).toFixed(
              1,
            )}`,
        )
        .join(
          ' ',
        )
    }


  return (
    <Stack spacing={1}>

      <Stack
        direction="row"
        gap={1}
        flexWrap="wrap"
      >
        {selectedLapNumbers.map(
          lapNumber =>
            (
              <Stack
                key={
                  lapNumber
                }
                direction="row"
                alignItems="center"
                spacing={0.5}
              >
                <Box
                  sx={{
                    width:
                      10,
                    height:
                      10,
                    borderRadius:
                      '50%',
                    bgcolor:
                      lapColour(
                        lapNumber,
                      ),
                  }}
                />

                <Typography
                  variant="caption"
                >
                  Lap {lapNumber}
                </Typography>
              </Stack>
            ),
        )}
      </Stack>


      <Box
        component="svg"
        viewBox={
          `0 0 ${width} ${height}`
        }
        sx={{
          width:
            '100%',
          display:
            'block',
          bgcolor:
            'background.default',
          borderRadius:
            2,
          border:
            1,
          borderColor:
            'divider',
        }}
      >

        <polyline
          points={
            makePolyline(
              session.samples,
            )
          }
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />


        {selectedLapNumbers.map(
          lapNumber => {
            const samples =
              pointsForLap(
                session,
                lapNumber,
              )

            if (
              samples.length ===
              0
            ) {
              return null
            }

            return (
              <polyline
                key={
                  lapNumber
                }
                points={
                  makePolyline(
                    samples,
                  )
                }
                fill="none"
                stroke={
                  lapColour(
                    lapNumber,
                  )
                }
                strokeWidth="4"
                vectorEffect="non-scaling-stroke"
              />
            )
          },
        )}

      </Box>

    </Stack>
  )
}

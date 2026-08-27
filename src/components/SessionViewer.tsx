import {
  useMemo,
  useState,
} from 'react'

import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'

import MapIcon from '@mui/icons-material/Map'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'

import type {
  Lap,
  ParsedSession,
} from '../types'

import {
  LapSelector,
} from './LapSelector'

import {
  TrackMap,
} from './TrackMap'

import {
  SatelliteMap,
} from './SatelliteMap'

import {
  TelemetryChart,
} from './TelemetryChart'


function formatLapTime(
  seconds: number,
): string {
  const minutes =
    Math.floor(
      seconds /
      60,
    )

  const remaining =
    seconds -
    minutes *
    60

  return (
    `${minutes}:` +
    remaining
      .toFixed(
        3,
      )
      .padStart(
        6,
        '0',
      )
  )
}


function formatDuration(
  seconds: number,
): string {
  const minutes =
    Math.floor(
      seconds /
      60,
    )

  return (
    `${minutes}m ` +
    `${(
      seconds -
      minutes *
      60
    ).toFixed(
      1,
    )}s`
  )
}


type MapMode =
  'track' |
  'satellite'


export function SessionViewer(
  {
    session,
  }:
  {
    session:
      ParsedSession
  },
) {
  const [
    selectedLapNumbers,
    setSelectedLapNumbers,
  ] =
    useState<
      number[]
    >(
      () =>
        session.laps.map(
          lap =>
            lap.lapNumber,
        ),
    )


  const [
    channel,
    setChannel,
  ] =
    useState(
      'Speed',
    )


  const [
    mapMode,
    setMapMode,
  ] =
    useState<
      MapMode
    >(
      'track',
    )


  // Absolute sample index currently highlighted by the telemetry graph.
  // The same index is consumed by both the offline circuit map and
  // the Google satellite map.
  const [
    cursorSampleIndex,
    setCursorSampleIndex,
  ] =
    useState<
      number |
      undefined
    >()


  const bestLap =
    useMemo<
      Lap |
      undefined
    >(
      () =>
        session.laps.length >
        0
          ? session.laps.reduce(
              (
                best,
                current,
              ) =>
                current.lapTimeSeconds <
                best.lapTimeSeconds
                  ? current
                  : best,
            )
          : undefined,

      [
        session.laps,
      ],
    )


  const selectedLaps =
    useMemo(
      () =>
        session.laps.filter(
          lap =>
            selectedLapNumbers.includes(
              lap.lapNumber,
            ),
        ),

      [
        session.laps,
        selectedLapNumbers,
      ],
    )


  return (
    <Stack spacing={2}>

      <Stack
        direction={{
          xs:
            'column',
          md:
            'row',
        }}
        gap={1}
        alignItems={{
          md:
            'center',
        }}
      >
        <Typography
          variant="h4"
          fontWeight={800}
        >
          {session.trackName}
        </Typography>

        <Chip
          label={
            session.filename
          }
          size="small"
        />

        <Chip
          label={
            `${(
              1 /
              session.samplePeriod
            ).toFixed(
              0,
            )} Hz`
          }
          size="small"
          color="info"
        />

        <Chip
          label={
            `${session.laps.length} complete laps`
          }
          size="small"
          color={
            session.laps.length >
            0
              ? 'success'
              : 'warning'
          }
        />

        {session.timingReference &&
          (
            <Chip
              label="VBOX timing line"
              size="small"
              variant="outlined"
            />
          )}
      </Stack>


      <Typography
        variant="body2"
        color="text.secondary"
      >
        {session.samples.length.toLocaleString()}
        {' samples · '}
        {formatDuration(
          session.durationSeconds,
        )}
        {' · max '}
        {session.maxSpeedKmh.toFixed(
          1,
        )}
        {' km/h · '}
        {selectedLapNumbers.length}
        {' laps selected'}
      </Typography>


      {bestLap &&
        (
          <Card variant="outlined">
            <CardContent>
              <Stack
                direction={{
                  xs:
                    'column',
                  sm:
                    'row',
                }}
                gap={3}
              >
                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Best lap
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight={800}
                  >
                    {formatLapTime(
                      bestLap.lapTimeSeconds,
                    )}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Lap
                  </Typography>

                  <Typography
                    variant="h5"
                    fontWeight={700}
                  >
                    {bestLap.lapNumber}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}


      <Grid
        container
        spacing={2}
      >

        <Grid
          size={{
            xs:
              12,
            lg:
              3,
          }}
        >
          <Card variant="outlined">
            <CardContent>

              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
              >
                Laps
              </Typography>


              <LapSelector
                laps={
                  session.laps
                }
                selectedLapNumbers={
                  selectedLapNumbers
                }
                onSelectionChange={
                  setSelectedLapNumbers
                }
              />

            </CardContent>
          </Card>
        </Grid>


        <Grid
          size={{
            xs:
              12,
            lg:
              9,
          }}
        >
          <Stack spacing={2}>

            <Card variant="outlined">
              <CardContent>

                <Stack
                  direction={{
                    xs:
                      'column',
                    sm:
                      'row',
                  }}
                  justifyContent="space-between"
                  alignItems={{
                    sm:
                      'center',
                  }}
                  gap={1}
                  mb={2}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Circuit
                  </Typography>


                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={
                      mapMode
                    }
                    onChange={
                      (
                        _,
                        value:
                          MapMode |
                          null,
                      ) => {
                        if (
                          value
                        ) {
                          setMapMode(
                            value,
                          )
                        }
                      }
                    }
                  >
                    <ToggleButton
                      value="track"
                    >
                      <MapIcon
                        sx={{
                          mr:
                            0.5,
                        }}
                      />
                      Track
                    </ToggleButton>

                    <ToggleButton
                      value="satellite"
                    >
                      <SatelliteAltIcon
                        sx={{
                          mr:
                            0.5,
                        }}
                      />
                      Satellite
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Stack>


                {mapMode ===
                  'track'
                  ? (
                    <TrackMap
                      session={
                        session
                      }
                      selectedLapNumbers={
                        selectedLapNumbers
                      }
                      cursorSampleIndex={
                        cursorSampleIndex
                      }
                    />
                  )
                  : (
                    <SatelliteMap
                      session={
                        session
                      }
                      selectedLapNumbers={
                        selectedLapNumbers
                      }
                      cursorSampleIndex={
                        cursorSampleIndex
                      }
                    />
                  )}

              </CardContent>
            </Card>


            <Card variant="outlined">
              <CardContent>

                <TelemetryChart
                  session={
                    session
                  }
                  selectedLap={
                    selectedLaps.length ===
                    1
                      ? selectedLaps[0]
                      : undefined
                  }
                  channel={
                    channel
                  }
                  onChannelChange={
                    setChannel
                  }
                  onSampleHover={
                    setCursorSampleIndex
                  }
                  cursorSampleIndex={
                    cursorSampleIndex
                  }
                />

              </CardContent>
            </Card>

          </Stack>
        </Grid>

      </Grid>

    </Stack>
  )
}

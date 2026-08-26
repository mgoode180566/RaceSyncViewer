import { useMemo, useState } from 'react'

import {
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'

import type {
  Lap,
  ParsedSession,
} from '../types'

import { TrackMap } from './TrackMap'
import { TelemetryChart } from './TelemetryChart'


// ============================================================
// FORMAT LAP TIME
// ============================================================

function formatLapTime(seconds: number)
{
  const minutes =
    Math.floor(seconds / 60)

  const remaining =
    seconds -
    minutes * 60

  return `${minutes}:${remaining
    .toFixed(3)
    .padStart(6, '0')}`
}


// ============================================================
// FORMAT SESSION DURATION
// ============================================================

function formatDuration(seconds: number)
{
  const minutes =
    Math.floor(seconds / 60)

  const remaining =
    seconds -
    minutes * 60

  return `${minutes}m ${remaining.toFixed(1)}s`
}


// ============================================================
// COMPONENT
// ============================================================

export function SessionViewer(
  {
    session,
  }:
  {
    session: ParsedSession
  },
)
{
  // ----------------------------------------------------------
  // SELECTED LAP
  // ----------------------------------------------------------

  const [
    selectedLapNumber,
    setSelectedLapNumber,
  ] =
    useState<number | undefined>(
      session.laps[0]?.lapNumber,
    )


  // ----------------------------------------------------------
  // TELEMETRY CHANNEL
  // ----------------------------------------------------------

  const [
    channel,
    setChannel,
  ] =
    useState('Speed')


  // ----------------------------------------------------------
  // FIND SELECTED LAP
  // ----------------------------------------------------------

  const selectedLap =
    useMemo<Lap | undefined>(
      () =>
        session.laps.find(
          lap =>
            lap.lapNumber ===
            selectedLapNumber,
        ),

      [
        selectedLapNumber,
        session.laps,
      ],
    )


  // ----------------------------------------------------------
  // FIND BEST LAP
  // ----------------------------------------------------------

  const bestLap =
    useMemo<Lap | undefined>(
      () =>
      {
        if (
          session.laps.length === 0
        )
        {
          return undefined
        }

        return session.laps.reduce(
          (
            fastest,
            current,
          ) =>
            current.lapTimeSeconds <
            fastest.lapTimeSeconds
              ? current
              : fastest,
        )
      },

      [
        session.laps,
      ],
    )


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <Stack spacing={2}>

      {/* ======================================================
          SESSION HEADER
          ====================================================== */}

      <div>

        <Stack
          direction={{
            xs: 'column',
            sm: 'row',
          }}
          gap={1}
          alignItems={{
            sm: 'center',
          }}
        >

          <Typography
            variant="h4"
            fontWeight={800}
          >
            {session.trackName}
          </Typography>


          <Chip
            label={session.filename}
            size="small"
          />


          <Chip
            label={
              `${(
                1 /
                session.samplePeriod
              ).toFixed(0)} Hz`
            }
            size="small"
            color="info"
          />

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

          {session.maxSpeedKmh.toFixed(1)}
          {' km/h'}
        </Typography>

      </div>


      {/* ======================================================
          MAIN VIEW
          ====================================================== */}

      <Grid
        container
        spacing={2}
      >

        {/* ====================================================
            LAP LIST
            ==================================================== */}

        <Grid
          size={{
            xs: 12,
            lg: 3,
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


              {session.laps.length === 0
                ? (
                  <Typography
                    color="text.secondary"
                    variant="body2"
                  >
                    No laps were detected.

                    The complete GPS trace
                    and telemetry are still
                    available.
                  </Typography>
                )
                : (
                  <List disablePadding>

                    {session.laps.map(
                      lap =>
                        (
                          <ListItemButton
                            key={
                              lap.lapNumber
                            }
                            selected={
                              lap.lapNumber ===
                              selectedLapNumber
                            }
                            onClick={
                              () =>
                                setSelectedLapNumber(
                                  lap.lapNumber,
                                )
                            }
                            sx={{
                              borderRadius: 1,
                            }}
                          >

                            <ListItemText
                              primary={
                                `Lap ${lap.lapNumber}`
                              }
                              secondary={
                                `${formatLapTime(
                                  lap.lapTimeSeconds,
                                )} · ${lap.maxSpeedKmh.toFixed(
                                  1,
                                )} km/h`
                              }
                            />


                            {bestLap?.lapNumber ===
                              lap.lapNumber && (
                              <Chip
                                size="small"
                                label="BEST"
                                color="success"
                              />
                            )}

                          </ListItemButton>
                        ),
                    )}

                  </List>
                )}


              <Divider
                sx={{
                  my: 2,
                }}
              />


              <ListItemButton
                selected={
                  selectedLapNumber ===
                  undefined
                }
                onClick={
                  () =>
                    setSelectedLapNumber(
                      undefined,
                    )
                }
                sx={{
                  borderRadius: 1,
                }}
              >

                <ListItemText
                  primary="Full session"
                />

              </ListItemButton>

            </CardContent>

          </Card>

        </Grid>


        {/* ====================================================
            MAP + TELEMETRY
            ==================================================== */}

        <Grid
          size={{
            xs: 12,
            lg: 9,
          }}
        >

          <Stack spacing={2}>

            <Card variant="outlined">

              <CardContent>

                <TrackMap
                  session={session}
                  selectedLap={
                    selectedLap
                  }
                />

              </CardContent>

            </Card>


            <Card variant="outlined">

              <CardContent>

                <TelemetryChart
                  session={session}
                  selectedLap={
                    selectedLap
                  }
                  channel={channel}
                  onChannelChange={
                    setChannel
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
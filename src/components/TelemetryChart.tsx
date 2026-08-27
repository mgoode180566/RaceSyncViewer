import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type {
  Lap,
  ParsedSession,
} from '../types'


type ChartRow = {
  time: number
  value: number
  sampleIndex: number
}


export function TelemetryChart(
  {
    session,
    selectedLap,
    channel,
    onChannelChange,
    onSampleHover,
    cursorSampleIndex,
  }:
  {
    session: ParsedSession
    selectedLap?: Lap
    channel: string
    onChannelChange: (value: string) => void
    onSampleHover?: (sampleIndex?: number) => void
    cursorSampleIndex?: number
  },
) {
  const startIndex =
    selectedLap?.startIndex ??
    0

  const endIndex =
    selectedLap?.endIndex ??
    (
      session.samples.length -
      1
    )

  const source =
    session.samples.slice(
      startIndex,
      endIndex +
      1,
    )

  const step =
    Math.max(
      1,
      Math.floor(
        source.length /
        1800,
      ),
    )

  const timeZero =
    source[0]?.timeSeconds ??
    0


  const data:
    ChartRow[] =
    source
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
        sample => ({
          time:
            Number(
              (
                sample.timeSeconds -
                timeZero
              ).toFixed(
                3,
              ),
            ),

          value:
            channel ===
            'Speed'
              ? sample.velocityKmh
              : (
                  sample.channels[
                    channel
                  ] ??
                  0
                ),

          // VBoxSample.index is the absolute position in
          // session.samples and is therefore exactly what
          // the circuit map needs.
          sampleIndex:
            sample.index,
        }),
      )


  const cursorTime =
    cursorSampleIndex !==
      undefined &&
    cursorSampleIndex >=
      startIndex &&
    cursorSampleIndex <=
      endIndex
      ? (
          session.samples[
            cursorSampleIndex
          ].timeSeconds -
          timeZero
        )
      : undefined


  const handleMouseMove =
    (
      state:
        any,
    ) => {
      const payload =
        state?.activePayload?.[0]
          ?.payload as
          ChartRow |
          undefined

      if (
        payload &&
        Number.isFinite(
          payload.sampleIndex,
        )
      ) {
        onSampleHover?.(
          payload.sampleIndex,
        )
      }
    }


  return (
    <Stack spacing={2}>

      <Stack
        direction={{
          xs:
            'column',
          sm:
            'row',
        }}
        gap={2}
        alignItems={{
          sm:
            'center',
        }}
      >
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{
            flex:
              1,
          }}
        >
          Telemetry
          {' '}
          {selectedLap
            ? `· Lap ${selectedLap.lapNumber}`
            : '· Full session'}
          {' · '}
          move the pointer across the graph to locate the bike on the circuit
        </Typography>


        <FormControl
          size="small"
          sx={{
            minWidth:
              220,
          }}
        >
          <InputLabel>
            Channel
          </InputLabel>

          <Select
            label="Channel"
            value={
              channel
            }
            onChange={
              event =>
                onChannelChange(
                  event.target.value,
                )
            }
          >
            <MenuItem value="Speed">
              Speed (km/h)
            </MenuItem>

            {session.channelNames.map(
              name =>
                (
                  <MenuItem
                    value={
                      name
                    }
                    key={
                      name
                    }
                  >
                    {name}
                  </MenuItem>
                ),
            )}
          </Select>
        </FormControl>
      </Stack>


      <Box
        sx={{
          height:
            330,
        }}
        onMouseLeave={
          () =>
            onSampleHover?.(
              undefined,
            )
        }
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart
            data={
              data
            }
            onMouseMove={
              handleMouseMove
            }
            onMouseLeave={
              () =>
                onSampleHover?.(
                  undefined,
                )
            }
          >
            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="time"
              type="number"
              domain={[
                'dataMin',
                'dataMax',
              ]}
              tickFormatter={
                value =>
                  `${value}s`
              }
            />

            <YAxis
              domain={[
                'auto',
                'auto',
              ]}
            />


            <Tooltip
              formatter={
                (
                  value,
                ) => [
                  Number(
                    value,
                  ).toFixed(
                    2,
                  ),
                  channel,
                ]
              }
              labelFormatter={
                value =>
                  `${value}s`
              }
            />


            {cursorTime !==
              undefined &&
              (
                <ReferenceLine
                  x={
                    cursorTime
                  }
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
              )}


            <Line
              dataKey="value"
              type="monotone"
              dot={false}
              activeDot={{
                r:
                  5,
              }}
              isAnimationActive={
                false
              }
              stroke="currentColor"
              strokeWidth={
                2
              }
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

    </Stack>
  )
}

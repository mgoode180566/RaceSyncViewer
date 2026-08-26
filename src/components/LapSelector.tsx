import {
  Box,
  Checkbox,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'

import type {
  Lap,
} from '../types'

import {
  lapColour,
} from './lapColours'


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
    minutes * 60

  return (
    `${minutes}:` +
    remaining
      .toFixed(3)
      .padStart(
        6,
        '0',
      )
  )
}


export function LapSelector(
  {
    laps,
    selectedLapNumbers,
    onSelectionChange,
  }:
  {
    laps: Lap[]
    selectedLapNumbers: number[]
    onSelectionChange: (lapNumbers: number[]) => void
  },
) {
  const allSelected =
    laps.length > 0 &&
    selectedLapNumbers.length ===
      laps.length


  const toggleAll =
    () => {
      onSelectionChange(
        allSelected
          ? []
          : laps.map(
              lap =>
                lap.lapNumber,
            ),
      )
    }


  const toggleLap =
    (
      lapNumber: number,
    ) => {
      if (
        selectedLapNumbers.includes(
          lapNumber,
        )
      ) {
        onSelectionChange(
          selectedLapNumbers.filter(
            value =>
              value !==
              lapNumber,
          ),
        )

        return
      }

      onSelectionChange(
        [
          ...selectedLapNumbers,
          lapNumber,
        ].sort(
          (
            a,
            b,
          ) =>
            a -
            b,
        ),
      )
    }


  return (
    <Stack spacing={1}>

      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
      >
        <Checkbox
          checked={
            allSelected
          }
          indeterminate={
            selectedLapNumbers.length >
              0 &&
            !allSelected
          }
          onChange={
            toggleAll
          }
        />

        <Typography
          variant="body2"
          fontWeight={700}
        >
          {allSelected
            ? 'Clear all laps'
            : 'Select all laps'}
        </Typography>
      </Stack>


      <Divider />


      <List
        dense
        disablePadding
      >
        {laps.map(
          lap => {
            const checked =
              selectedLapNumbers.includes(
                lap.lapNumber,
              )

            return (
              <ListItemButton
                key={
                  lap.lapNumber
                }
                selected={
                  checked
                }
                onClick={
                  () =>
                    toggleLap(
                      lap.lapNumber,
                    )
                }
                sx={{
                  borderRadius:
                    1,
                  mb:
                    0.5,
                }}
              >
                <Checkbox
                  checked={
                    checked
                  }
                  size="small"
                  onClick={
                    event =>
                      event.stopPropagation()
                  }
                  onChange={
                    () =>
                      toggleLap(
                        lap.lapNumber,
                      )
                  }
                />


                <Box
                  sx={{
                    width:
                      12,
                    height:
                      12,
                    borderRadius:
                      '50%',
                    bgcolor:
                      lapColour(
                        lap.lapNumber,
                      ),
                    mr:
                      1.5,
                    flexShrink:
                      0,
                  }}
                />


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
              </ListItemButton>
            )
          },
        )}
      </List>

    </Stack>
  )
}

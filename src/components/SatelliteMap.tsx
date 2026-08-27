import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  ParsedSession,
} from '../types'

import {
  lapColour,
} from './lapColours'


declare global {
  interface Window {
    google?: any
  }
}


const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY


let googleMapsPromise:
  Promise<void> |
  undefined


function loadGoogleMaps():
  Promise<void> {
  if (
    window.google
      ?.maps
  ) {
    return Promise.resolve()
  }


  if (
    googleMapsPromise
  ) {
    return googleMapsPromise
  }


  googleMapsPromise =
    new Promise(
      (
        resolve,
        reject,
      ) => {
        if (
          !GOOGLE_MAPS_API_KEY
        ) {
          reject(
            new Error(
              'VITE_GOOGLE_MAPS_API_KEY is not configured.',
            ),
          )

          return
        }


        const existing =
          document.querySelector(
            'script[data-racesync-google-maps="true"]',
          ) as
            HTMLScriptElement |
            null


        if (
          existing
        ) {
          existing.addEventListener(
            'load',
            () =>
              resolve(),
          )

          existing.addEventListener(
            'error',
            () =>
              reject(
                new Error(
                  'Google Maps failed to load.',
                ),
              ),
          )

          return
        }


        const script =
          document.createElement(
            'script',
          )

        script.dataset
          .racesyncGoogleMaps =
          'true'

        script.async =
          true

        script.defer =
          true

        script.src =
          'https://maps.googleapis.com/maps/api/js' +
          `?key=${encodeURIComponent(
            GOOGLE_MAPS_API_KEY,
          )}`


        script.onload =
          () =>
            resolve()


        script.onerror =
          () =>
            reject(
              new Error(
                'Google Maps failed to load.',
              ),
            )


        document.head.appendChild(
          script,
        )
      },
    )


  return googleMapsPromise
}


export function SatelliteMap(
  {
    session,
    selectedLapNumbers,
  }:
  {
    session: ParsedSession
    selectedLapNumbers: number[]
  },
) {
  const containerRef =
    useRef<
      HTMLDivElement |
      null
    >(
      null,
    )

  const mapRef =
    useRef<any>(
      null,
    )

  const polylinesRef =
    useRef<any[]>(
      [],
    )

  const [
    error,
    setError,
  ] =
    useState<
      string |
      undefined
    >()


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    )


  useEffect(
    () => {
      let cancelled =
        false


      loadGoogleMaps()
        .then(
          () => {
            if (
              cancelled ||
              !containerRef.current ||
              !window.google
                ?.maps
            ) {
              return
            }


            if (
              !mapRef.current
            ) {
              mapRef.current =
                new window.google.maps.Map(
                  containerRef.current,
                  {
                    center: {
                      lat:
                        session.samples[0]
                          ?.latitude ??
                        0,

                      lng:
                        session.samples[0]
                          ?.longitude ??
                        0,
                    },

                    zoom:
                      16,

                    mapTypeId:
                      'satellite',

                    disableDefaultUI:
                      false,

                    streetViewControl:
                      false,

                    mapTypeControl:
                      true,
                  },
                )
            }


            setLoading(
              false,
            )
          },
        )
        .catch(
          problem => {
            if (
              cancelled
            ) {
              return
            }

            setError(
              problem instanceof
              Error
                ? problem.message
                : 'Google Maps failed to load.',
            )

            setLoading(
              false,
            )
          },
        )


      return () => {
        cancelled =
          true
      }
    },
    [
      session,
    ],
  )


  useEffect(
    () => {
      const google =
        window.google

      const map =
        mapRef.current


      if (
        !google
          ?.maps ||
        !map
      ) {
        return
      }


      polylinesRef.current
        .forEach(
          polyline =>
            polyline.setMap(
              null,
            ),
        )


      polylinesRef.current =
        []


      const bounds =
        new google.maps
          .LatLngBounds()


      for (
        const lapNumber
        of selectedLapNumbers
      ) {
        const lap =
          session.laps.find(
            item =>
              item.lapNumber ===
              lapNumber,
          )


        if (!lap) {
          continue
        }


        const samples =
          session.samples.slice(
            lap.startIndex,
            lap.endIndex +
              1,
          )


        const path =
          samples.map(
            sample => ({
              lat:
                sample.latitude,

              lng:
                sample.longitude,
            }),
          )


        if (
          path.length ===
          0
        ) {
          continue
        }


        const polyline =
          new google.maps.Polyline(
            {
              map,
              path,

              strokeColor:
                lapColour(
                  lapNumber,
                ),

              strokeOpacity:
                0.95,

              strokeWeight:
                4,
            },
          )


        polylinesRef.current.push(
          polyline,
        )


        path.forEach(
          point =>
            bounds.extend(
              point,
            ),
        )
      }


      if (
        !bounds.isEmpty()
      ) {
        map.fitBounds(
          bounds,
        )
      }
    },
    [
      session,
      selectedLapNumbers,
      loading,
    ],
  )


  if (
    error
  ) {
    return (
      <Alert severity="info">
        {error}
        {' '}
        Add a Google Maps browser API key to
        {' '}
        <code>
          VITE_GOOGLE_MAPS_API_KEY
        </code>
        {' '}
        to enable satellite view.
      </Alert>
    )
  }


  return (
    <Stack spacing={1}>

      <Typography
        variant="subtitle2"
        color="text.secondary"
      >
        Satellite view · selected laps
      </Typography>


      <Box
        sx={{
          position:
            'relative',
          width:
            '100%',
          minHeight:
            540,
          borderRadius:
            2,
          overflow:
            'hidden',
          border:
            1,
          borderColor:
            'divider',
        }}
      >
        {loading &&
          (
            <Box
              sx={{
                position:
                  'absolute',
                inset:
                  0,
                display:
                  'grid',
                placeItems:
                  'center',
                zIndex:
                  2,
                bgcolor:
                  'background.paper',
              }}
            >
              <CircularProgress />
            </Box>
          )}


        <Box
          ref={
            containerRef
          }
          sx={{
            width:
              '100%',
            height:
              540,
          }}
        />
      </Box>

    </Stack>
  )
}

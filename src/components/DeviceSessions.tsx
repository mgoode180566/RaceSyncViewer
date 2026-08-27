import {
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'

import DownloadIcon from '@mui/icons-material/Download'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import RefreshIcon from '@mui/icons-material/Refresh'

import {
  useState,
} from 'react'

import type {
  DeviceSession,
} from '../types'


const formatBytes =
  (
    bytes: number,
  ) => {
    if (
      bytes >=
      1024 * 1024
    ) {
      return (
        `${(
          bytes /
          1024 /
          1024
        ).toFixed(
          1,
        )} MB`
      )
    }

    return (
      `${(
        bytes /
        1024
      ).toFixed(
        0,
      )} KB`
    )
  }


export function DeviceSessions(
  {
    sessions,
    loading,
    error,
    activeDownloadId,
    activeDeleteId,
    onRefresh,
    onDownload,
    onDelete,
  }:
  {
    sessions:
      DeviceSession[]

    loading:
      boolean

    error?:
      string

    activeDownloadId?:
      number

    activeDeleteId?:
      number

    onRefresh:
      () => void

    onDownload:
      (
        session:
          DeviceSession,
      ) => void

    onDelete:
      (
        session:
          DeviceSession,
      ) => void
  },
) {
  const [
    deleteCandidate,
    setDeleteCandidate,
  ] =
    useState<
      DeviceSession |
      undefined
    >()


  const busy =
    activeDownloadId !==
      undefined ||
    activeDeleteId !==
      undefined


  const confirmDelete =
    () => {
      if (
        !deleteCandidate
      ) {
        return
      }

      const session =
        deleteCandidate

      setDeleteCandidate(
        undefined,
      )

      onDelete(
        session,
      )
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
        justifyContent="space-between"
        alignItems={{
          sm:
            'center',
        }}
        gap={1}
      >
        <div>
          <Typography
            variant="h5"
            fontWeight={800}
          >
            Sessions on RaceSync
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Download a session to this browser, or remove a completed recording from the logger.
          </Typography>
        </div>


        <Button
          startIcon={
            <RefreshIcon />
          }
          onClick={
            onRefresh
          }
          disabled={
            loading ||
            busy
          }
        >
          Refresh
        </Button>
      </Stack>


      {loading &&
        (
          <LinearProgress />
        )}


      {error &&
        (
          <Alert severity="warning">
            {error}
          </Alert>
        )}


      {sessions.map(
        session => {
          const downloading =
            activeDownloadId ===
            session.id

          const deleting =
            activeDeleteId ===
            session.id

          const canDelete =
            session.deletable ===
              true &&
            !session.active &&
            !session.protected


          return (
            <Card
              key={
                session.id
              }
              variant="outlined"
            >
              <CardContent>

                <Stack
                  direction={{
                    xs:
                      'column',
                    sm:
                      'row',
                  }}
                  justifyContent="space-between"
                  gap={1}
                >
                  <div>
                    <Typography
                      fontWeight={800}
                    >
                      {session.file}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Session #{session.id}
                      {' · '}
                      {formatBytes(
                        session.sizeBytes,
                      )}
                    </Typography>
                  </div>


                  <Stack
                    direction="row"
                    gap={1}
                    flexWrap="wrap"
                  >
                    {session.generatedByRaceSync
                      ? (
                        <Chip
                          size="small"
                          label="RaceSync recording"
                        />
                      )
                      : (
                        <Chip
                          size="small"
                          color="info"
                          label="Demo source"
                        />
                      )}


                    {session.active &&
                      (
                        <Chip
                          size="small"
                          color="warning"
                          label="Recording"
                        />
                      )}


                    {session.protected &&
                      (
                        <Chip
                          size="small"
                          variant="outlined"
                          label="Protected"
                        />
                      )}


                    {session.complete &&
                      !session.active &&
                      (
                        <Chip
                          size="small"
                          color="success"
                          label="Complete"
                        />
                      )}
                  </Stack>

                </Stack>

              </CardContent>


              <CardActions>

                <Button
                  startIcon={
                    <DownloadIcon />
                  }
                  disabled={
                    busy
                  }
                  onClick={
                    () =>
                      onDownload(
                        session,
                      )
                  }
                >
                  {downloading
                    ? 'Downloading…'
                    : 'Download & view'}
                </Button>


                <Button
                  color="error"
                  startIcon={
                    <DeleteOutlineIcon />
                  }
                  disabled={
                    busy ||
                    !canDelete
                  }
                  onClick={
                    () =>
                      setDeleteCandidate(
                        session,
                      )
                  }
                >
                  {deleting
                    ? 'Deleting…'
                    : 'Delete'}
                </Button>

              </CardActions>

            </Card>
          )
        },
      )}


      {!loading &&
        !error &&
        sessions.length ===
          0 &&
        (
          <Alert severity="info">
            No VBO sessions were reported by RaceSync.
          </Alert>
        )}


      <Dialog
        open={
          deleteCandidate !==
          undefined
        }
        onClose={
          () =>
            setDeleteCandidate(
              undefined,
            )
        }
      >
        <DialogTitle>
          Delete session from RaceSync?
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            {deleteCandidate
              ? (
                <>
                  This will permanently remove <strong>{deleteCandidate.file}</strong> (session #{deleteCandidate.id}) from the logger.
                  A copy already downloaded to this browser is not affected.
                </>
              )
              : null}
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={
              () =>
                setDeleteCandidate(
                  undefined,
                )
            }
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={
              confirmDelete
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Stack>
  )
}

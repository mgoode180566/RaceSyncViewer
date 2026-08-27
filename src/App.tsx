import {
  useEffect,
  useState,
} from 'react'

import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Tab,
  Tabs,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from '@mui/material'

import type {
  DeviceSession,
  DeviceStatus,
  ParsedSession,
} from './types'

import {
  deleteSession,
  downloadSession,
  fetchSessions,
  fetchStatus,
} from './services/raceSyncApi'

import {
  parseVBox,
} from './vbo/vboParser'

import {
  listStoredSessions,
  saveSession,
} from './storage/sessionDb'

import {
  StatusPanel,
} from './components/StatusPanel'

import {
  DeviceSessions,
} from './components/DeviceSessions'

import {
  SessionViewer,
} from './components/SessionViewer'


const theme =
  createTheme(
    {
      palette: {
        mode:
          'dark',
      },
    },
  )


export default function App()
{
  const [
    tab,
    setTab,
  ] =
    useState(
      0,
    )

  const [
    status,
    setStatus,
  ] =
    useState<
      DeviceStatus |
      undefined
    >()

  const [
    statusError,
    setStatusError,
  ] =
    useState<
      string |
      undefined
    >()

  const [
    sessions,
    setSessions,
  ] =
    useState<
      DeviceSession[]
    >(
      [],
    )

  const [
    sessionsError,
    setSessionsError,
  ] =
    useState<
      string |
      undefined
    >()

  const [
    sessionsLoading,
    setSessionsLoading,
  ] =
    useState(
      false,
    )

  const [
    activeDownloadId,
    setActiveDownloadId,
  ] =
    useState<
      number |
      undefined
    >()

  const [
    activeDeleteId,
    setActiveDeleteId,
  ] =
    useState<
      number |
      undefined
    >()

  const [
    viewerSession,
    setViewerSession,
  ] =
    useState<
      ParsedSession |
      undefined
    >()

  const [
    storedSessions,
    setStoredSessions,
  ] =
    useState<
      ParsedSession[]
    >(
      [],
    )

  const [
    message,
    setMessage,
  ] =
    useState<
      {
        severity:
          'success' |
          'error' |
          'info'

        text:
          string
      } |
      undefined
    >()


  const loadStatus =
    async () => {
      try {
        setStatus(
          await fetchStatus(),
        )

        setStatusError(
          undefined,
        )
      }
      catch (error) {
        setStatusError(
          error instanceof
          Error
            ? error.message
            : 'Device unavailable',
        )
      }
    }


  const loadSessions =
    async () => {
      setSessionsLoading(
        true,
      )

      try {
        const result =
          await fetchSessions()

        setSessions(
          result.sessions ??
          [],
        )

        setSessionsError(
          undefined,
        )
      }
      catch (error) {
        setSessionsError(
          error instanceof
          Error
            ? error.message
            : 'Could not list sessions',
        )
      }
      finally {
        setSessionsLoading(
          false,
        )
      }
    }


  const refreshStored =
    async () => {
      try {
        setStoredSessions(
          await listStoredSessions(),
        )
      }
      catch {
        // IndexedDB may be unavailable in some browser privacy modes.
      }
    }


  useEffect(
    () => {
      loadStatus()
      loadSessions()
      refreshStored()

      const timer =
        window.setInterval(
          loadStatus,
          3000,
        )

      return () =>
        window.clearInterval(
          timer,
        )
    },
    [],
  )


  const openDeviceSession =
    async (
      session:
        DeviceSession,
    ) => {
      setActiveDownloadId(
        session.id,
      )

      setMessage(
        undefined,
      )

      try {
        const text =
          await downloadSession(
            session,
          )

        const parsed =
          parseVBox(
            text,
            session.file,
          )

        await saveSession(
          parsed,
        ).catch(
          () =>
            undefined,
        )

        await refreshStored()

        setViewerSession(
          parsed,
        )

        setMessage(
          {
            severity:
              'success',

            text:
              `${session.file} downloaded from RaceSync and stored locally.`,
          },
        )

        setTab(
          2,
        )
      }
      catch (error) {
        setMessage(
          {
            severity:
              'error',

            text:
              `Unable to open session: ${
                error instanceof
                Error
                  ? error.message
                  : 'unknown error'
              }`,
          },
        )
      }
      finally {
        setActiveDownloadId(
          undefined,
        )
      }
    }


  const deleteDeviceSession =
    async (
      session:
        DeviceSession,
    ) => {
      setActiveDeleteId(
        session.id,
      )

      setMessage(
        undefined,
      )

      try {
        const result =
          await deleteSession(
            session,
          )

        // Remove immediately from the current UI, then refresh
        // from the logger to ensure our state matches the device.
        setSessions(
          previous =>
            previous.filter(
              item =>
                item.id !==
                session.id,
            ),
        )

        await Promise.all(
          [
            loadSessions(),
            loadStatus(),
          ],
        )

        setMessage(
          {
            severity:
              'success',

            text:
              `${result.file} deleted from RaceSync. Storage is now ${result.usedPercent.toFixed(
                1,
              )}% used.`,
          },
        )
      }
      catch (error) {
        setMessage(
          {
            severity:
              'error',

            text:
              `Unable to delete session: ${
                error instanceof
                Error
                  ? error.message
                  : 'unknown error'
              }`,
          },
        )
      }
      finally {
        setActiveDeleteId(
          undefined,
        )
      }
    }


  const openLocalFile =
    async (
      file?:
        File,
    ) => {
      if (!file) {
        return
      }

      try {
        const parsed =
          parseVBox(
            await file.text(),
            file.name,
          )

        await saveSession(
          parsed,
        ).catch(
          () =>
            undefined,
        )

        await refreshStored()

        setViewerSession(
          parsed,
        )

        setTab(
          2,
        )
      }
      catch (error) {
        setMessage(
          {
            severity:
              'error',

            text:
              error instanceof
              Error
                ? error.message
                : 'Could not parse file',
          },
        )
      }
    }


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />


      <AppBar
        position="sticky"
        color="default"
        elevation={0}
      >
        <Toolbar>
          <Typography
            variant="h6"
            fontWeight={900}
            sx={{
              flex:
                1,
            }}
          >
            RaceSync
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            ESP32 browser viewer
          </Typography>
        </Toolbar>


        <Tabs
          value={
            tab
          }
          onChange={
            (
              _,
              value,
            ) =>
              setTab(
                value,
              )
          }
        >
          <Tab label="Device" />
          <Tab label="Sessions" />
          <Tab label="Viewer" />
        </Tabs>
      </AppBar>


      <Container
        maxWidth="xl"
        sx={{
          py:
            3,
        }}
      >
        {message &&
          (
            <Alert
              sx={{
                mb:
                  2,
              }}
              severity={
                message.severity
              }
              onClose={
                () =>
                  setMessage(
                    undefined,
                  )
              }
            >
              {message.text}
            </Alert>
          )}


        {tab ===
          0 &&
          (
            <StatusPanel
              status={
                status
              }
              error={
                statusError
              }
            />
          )}


        {tab ===
          1 &&
          (
            <Box>

              <DeviceSessions
                sessions={
                  sessions
                }
                loading={
                  sessionsLoading
                }
                error={
                  sessionsError
                }
                activeDownloadId={
                  activeDownloadId
                }
                activeDeleteId={
                  activeDeleteId
                }
                onRefresh={
                  loadSessions
                }
                onDownload={
                  openDeviceSession
                }
                onDelete={
                  deleteDeviceSession
                }
              />


              <Box mt={4}>
                <Typography
                  variant="h6"
                  fontWeight={800}
                >
                  Stored in this browser
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  mb={1}
                >
                  Deleting a session from RaceSync does not remove a copy already downloaded here.
                </Typography>


                {storedSessions.map(
                  session =>
                    (
                      <Button
                        key={
                          session.filename
                        }
                        variant="outlined"
                        sx={{
                          m:
                            0.5,
                        }}
                        onClick={
                          () => {
                            setViewerSession(
                              session,
                            )

                            setTab(
                              2,
                            )
                          }
                        }
                      >
                        {session.trackName}
                        {' · '}
                        {session.filename}
                      </Button>
                    ),
                )}
              </Box>


              <Box mt={4}>
                <Button
                  component="label"
                  variant="outlined"
                >
                  Open local VBO

                  <input
                    hidden
                    type="file"
                    accept=".vbo,text/plain"
                    onChange={
                      event =>
                        openLocalFile(
                          event.target.files?.[0],
                        )
                    }
                  />
                </Button>
              </Box>

            </Box>
          )}


        {tab ===
          2 &&
          (
            viewerSession
              ? (
                <SessionViewer
                  session={
                    viewerSession
                  }
                />
              )
              : (
                <Alert severity="info">
                  Select a RaceSync session to view it.
                </Alert>
              )
          )}

      </Container>
    </ThemeProvider>
  )
}

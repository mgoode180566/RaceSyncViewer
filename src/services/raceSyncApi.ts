import type {
  DeviceSessionsResponse,
  DeviceStatus,
} from '../types'

export const DEVICE_BASE_URL =
  import.meta.env.VITE_RACESYNC_URL ||
  '/racesync'

const checked = async (
  response: Response,
) => {
  if (!response.ok) {
    throw new Error(
      `RaceSync returned ${response.status} ${response.statusText}`,
    )
  }

  return response
}

export const fetchStatus =
  async (): Promise<DeviceStatus> => {

    const response =
      await checked(
        await fetch(
          `${DEVICE_BASE_URL}/api/status`,
          {
            cache: 'no-store',
          },
        ),
      )

    return response.json()
  }


export const fetchSessions =
  async (): Promise<DeviceSessionsResponse> => {

    const response =
      await checked(
        await fetch(
          `${DEVICE_BASE_URL}/api/sessions`,
          {
            cache: 'no-store',
          },
        ),
      )

    return response.json()
  }


export const downloadSession =
  async (
    filename: string,
    downloadUrl?: string,
  ): Promise<string> => {

    let path =
      downloadUrl ||
      `/api/sessions/${encodeURIComponent(filename)}`

    // Device returns URLs such as:
    // /api/sessions/VBOX0004.vbo

    if (!path.startsWith('http')) {
      path =
        `${DEVICE_BASE_URL}${path}`
    }

    const response =
      await checked(
        await fetch(
          path,
          {
            cache: 'no-store',
          },
        ),
      )

    return response.text()
  }
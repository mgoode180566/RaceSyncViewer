import type {
  DeviceSession,
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
    let message =
      `RaceSync returned ${response.status} ${response.statusText}`

    try {
      const body =
        await response.json()

      if (
        body &&
        typeof body.error ===
          'string'
      ) {
        message =
          body.error
      }
    } catch {
      // Keep the HTTP status message when the response is not JSON.
    }

    throw new Error(
      message,
    )
  }

  return response
}


function deviceUrl(
  path: string,
): string {
  if (
    path.startsWith(
      'http://',
    ) ||
    path.startsWith(
      'https://',
    )
  ) {
    return path
  }

  return (
    `${DEVICE_BASE_URL}${path}`
  )
}


export async function fetchStatus():
  Promise<DeviceStatus> {
  const response =
    await checked(
      await fetch(
        deviceUrl(
          '/api/status',
        ),
        {
          cache:
            'no-store',
        },
      ),
    )

  return response.json()
}


export async function fetchSessions():
  Promise<DeviceSessionsResponse> {
  const response =
    await checked(
      await fetch(
        deviceUrl(
          '/api/sessions',
        ),
        {
          cache:
            'no-store',
        },
      ),
    )

  return response.json()
}


export async function downloadSession(
  session: DeviceSession,
): Promise<string> {
  const path =
    session.downloadUrl ||
    `/api/sessions/${session.id}`

  const response =
    await checked(
      await fetch(
        deviceUrl(
          path,
        ),
        {
          cache:
            'no-store',
        },
      ),
    )

  return response.text()
}


export type DeleteSessionResponse = {
  deleted: boolean
  id: number
  file: string
  freeBytes: number
  usedBytes: number
  usedPercent: number
}


export async function deleteSession(
  session: DeviceSession,
): Promise<DeleteSessionResponse> {
  if (
    session.deletable ===
    false
  ) {
    throw new Error(
      'This session is protected and cannot be deleted.',
    )
  }

  const path =
    session.deleteUrl ||
    `/api/sessions/${session.id}`

  const response =
    await checked(
      await fetch(
        deviceUrl(
          path,
        ),
        {
          method:
            'DELETE',

          cache:
            'no-store',
        },
      ),
    )

  return response.json()
}

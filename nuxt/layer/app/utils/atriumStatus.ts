/** The HTTP status of a failed API call, or null when it never got one. */
export function atriumStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) {
    return null
  }

  const failed = error as { status?: unknown, statusCode?: unknown, response?: { status?: unknown } }
  const status = failed.status ?? failed.statusCode ?? failed.response?.status

  return typeof status === 'number' ? status : null
}

const rawPatterns = [
  /prisma/i,
  /invocation/i,
  /stack/i,
  /at\s.+\(.+:\d+:\d+\)/i,
  /\/server\//i,
  /sql/i,
  /postgres/i,
]

export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const message = err?.response?.data?.message || err?.message || ''
  if (!message) return fallback
  if (rawPatterns.some((p) => p.test(message))) return fallback
  return message
}


export const LEITNER_MESSAGES = [
  "LEITNER_NO_AVAILABILITY",
  "LEITNER_DISPLAY_AVAILABILITY",
  "LEITNER_REQUEST",
]

export function logConsoleMessage(message, object) {
  if (object) {
    console.group(`[📚 Leitner]: ${message}`)
    console.log(object)
    console.groupEnd()
  } else {
    console.log(`[📚 Leitner]: ${message}`)
  }
}

export function logConsoleError(message, object) {
  if (object) {
    console.group(`[📚 Leitner]: ${message}`)
    console.error(object)
    console.groupEnd()
  } else {
    console.error(`[📚 Leitner]: ${message}`)
  }
}

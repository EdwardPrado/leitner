export const LEITNER_MESSAGES = [
  "LEITNER_NO_AVAILABILITY",
  "LEITNER_DISPLAY_AVAILABILITY",
  "LEITNER_REQUEST",
  "LEITNER_REQUEST_CONVERT_XML",
  "LEITNER_REQUEST_CONVERTED_XML",
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

export function getMatchingBookLink(authors, parsedXml) {
  const REGEX_AFTER_FINAL_SLASH = /(?!.*\/).+/
  let matchingLink

  const items = parsedXml.querySelectorAll("item")

  for (const item of items) {
    const creator = item.childNodes[6]?.textContent
    if (!creator) break

    const normalizedName = cleanupAuthorName(creator)

    for (let i = 0; i < authors.length; i++) {
      if (normalizedName === authors[i]) {
        const link = item.querySelector("link")?.textContent
        if (link) matchingLink = link

        break
      }
    }

    if (matchingLink) break
  }

  return matchingLink?.match(REGEX_AFTER_FINAL_SLASH)
}

function cleanupAuthorName(name) {
  const cleanedName = name.replaceAll(". ", ".")
  const parts = cleanedName.split(",").map((p) => p.trim())

  if (parts.length === 2) {
    return `${parts[1]} ${parts[0]}`
  }

  return cleanedName.trim()
}

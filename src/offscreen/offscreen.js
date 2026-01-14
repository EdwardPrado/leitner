import { getMatchingBookLink, LEITNER_MESSAGES, logConsoleError } from "../util"

chrome.runtime.onMessage.addListener(async (message) => {
  handleIncomingMessage(message)
})

function handleIncomingMessage(message) {
  try {
    if (message.type === LEITNER_MESSAGES[3]) {
      const parser = new DOMParser()
      const parsedRes = parser.parseFromString(message.rawXML, "text/xml")

      if (parsedRes.querySelectorAll("item").length !== 0) {
        chrome.runtime.sendMessage({
          type: LEITNER_MESSAGES[4],
          isStocked: true,
          bookLink: getMatchingBookLink(message.authors, parsedRes),
          tabId: message.tabId,
        })
      } else {
        chrome.runtime.sendMessage({
          type: LEITNER_MESSAGES[4],
          isStocked: false,
          tabId: message.tabId,
        })
      }
    }
  } catch (e) {
    logConsoleError("offscreen.js", e)
  }
}

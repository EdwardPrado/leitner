import { getMatchingBookLink, LEITNER_MESSAGES, logConsoleError } from "./util"

initiateOffscreen()

chrome.tabs.query({ active: true }).then((tabs) => {
  for (const tab of tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    })
  }
})

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === LEITNER_MESSAGES[2]) {
    await queryTitle(message.title, message.authors)
  } else if (message.type === LEITNER_MESSAGES[4]) {
    if (message.isStocked) {
      await queryBookID(message.bookLink)
    } else {
      sendNotStocked()
    }
  }
})

async function queryTitle(title, authors) {
  const library = await getLibraryLink()

  if (library) {
    await fetch(
      `https://gateway.bibliocommons.com/v2/libraries/${library}/rss/search?locked=false&searchType=bl&query=title:(${title})+++formatcode:(BOARD_BK%20OR%20BK%20OR%20GRAPHIC_NOVEL%20OR%20LPRINT%20OR%20BIG_BK%20OR%20PAPERBACK%20OR%20PICTURE_BOOK%20)`
    )
      .then((rawRes) => rawRes.text())
      .then(async (res) => {
        try {
          const parser = new DOMParser()
          const parsedRes = parser.parseFromString(res, "text/xml")

          await sendXMLEntries(parsedRes, authors)
        } catch (e) {
          await chromeHandleXMLRes(res, authors)
        }
      })
      .catch((error) => logConsoleError(`queryTitle`, error))
  }
}

async function queryBookID(id) {
  let availableCopies = 0
  let totalCopies = 0
  let heldCopies = 0

  const library = await getLibraryLink()

  if (library) {
    await fetch(
      `https://gateway.bibliocommons.com/v2/libraries/${library}/bibs/${id}/availability`
    )
      .then((rawRes) => rawRes.json())
      .then(async (res) => {
        if (res.entities?.availabilities) {
          availableCopies = res.entities.availabilities[id].availableCopies
          totalCopies = res.entities.availabilities[id].totalCopies
          heldCopies = res.entities.availabilities[id].heldCopies

          chrome.tabs.query({ active: true }).then((tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: LEITNER_MESSAGES[1],
              availableCopies,
              totalCopies,
              heldCopies,
              link: `https://${library}.bibliocommons.com/v2/record/${id}?&utm_content=title_link&utm_medium=onpage_catalog_view`,
            })
          })
        } else {
          chrome.tabs.query({ active: true }).then((tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: LEITNER_MESSAGES[0],
            })
          })
        }
      })
      .catch((error) => logConsoleError(`queryBookId`, error))
  }
}

async function getLibraryLink() {
  const REGEX_BIBLIO_NAME =
    /(?:^|\/\/|www\.)([a-zA-Z0-9-]+)\.bibliocommons\.com/

  try {
    return await chrome.storage.local
      .get("libraryInfo")
      .then((res) => res?.libraryInfo?.link.match(REGEX_BIBLIO_NAME)[1])
  } catch (e) {
    logConsoleError(getLibraryLink, e)
  }
}

async function sendXMLEntries(parsedRes, authors) {
  try {
    if (parsedRes.querySelectorAll("item").length !== 0) {
      await queryBookID(getMatchingBookLink(authors, parsedRes))
    } else {
      sendNotStocked()
    }
  } catch (e) {
    sendNotStocked()
  }
}

function sendNotStocked() {
  chrome.tabs.query({ active: true }).then((tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: LEITNER_MESSAGES[0],
    })
  })
}

async function chromeHandleXMLRes(res, authors) {
  chrome.runtime.sendMessage({
    type: LEITNER_MESSAGES[3],
    rawXML: res,
    authors,
  })
}

async function initiateOffscreen() {
  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL("offscreen.html"),
    reasons: ["DOM_PARSER"],
    justification: "Parsing XML",
  })
}

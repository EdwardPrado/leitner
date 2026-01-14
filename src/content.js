import { LEITNER_MESSAGES, logConsoleError } from "./util"

const TIMEOUT_DELAY = 2000
const REGEX_BOOK_URL = /^.*hardcover\.app\/books\/[^\/]+$/
const LEITNER_STATUS = "RAN"

sessionStorage.removeItem(LEITNER_STATUS)

let lastUrl = location.href

onNavigation()

// Detects page changes since Hardcover is a SPA so it doesn't trigger page change naturally
new MutationObserver(() => {
  sessionStorage.removeItem(LEITNER_STATUS)
  if (location.href !== lastUrl) {
    lastUrl = location.href
    onNavigation()
  }
}).observe(document, { subtree: true, childList: true })

function onNavigation() {
  // Prevent script from running again if user switches away then back to this tab
  if (!sessionStorage.getItem(LEITNER_STATUS)) {
    if (location.href.match(REGEX_BOOK_URL)) {
      sessionStorage.setItem(LEITNER_STATUS, "true")
      sendBiblioRequest()
    }
  }
}

chrome.runtime.onMessage.addListener(async (message) => {
  handleIncomingMessage(message)
})

function addAvailabilityElement(elementDetails) {
  try {
    const parentNode = document.querySelector(
      ".min-h-screenHeightWithoutHeader"
    ).childNodes[5]

    const newNodeContainer = document.createElement("div")
    const superHeader = newNodeContainer.appendChild(
      document.createElement("div")
    )
    const content = newNodeContainer.appendChild(document.createElement("a"))

    if (elementDetails["Subheader"]) {
      const subHeader = newNodeContainer.appendChild(
        document.createElement("div")
      )

      subHeader.innerText = elementDetails["Subheader"]
      subHeader.classList.add("text-gray-600", "dark:text-gray-400", "text-md")
    }

    if (elementDetails["Superheader"]) {
      superHeader.innerText = elementDetails["Superheader"]
      superHeader.classList.add(
        "text-gray-600",
        "dark:text-gray-400",
        "text-sm",
        "font-semibold"
      )
    }

    if (elementDetails["Highlighted"]) {
      const highlightedSuperheader = superHeader.appendChild(
        document.createElement("span")
      )

      highlightedSuperheader.innerText = elementDetails["Highlighted"]
      highlightedSuperheader.classList.add(
        "font-semibold",
        "whitespace-nowrap",
        "bg-accent",
        "text-accent-foreground",
        "rounded-lg",
        "text-xs",
        "px-1",
        "py-0.5",
        "ml-2"
      )
    }

    content.innerText = elementDetails["Content"]

    content.classList.add(
      "font-serif",
      "text-gray-800",
      "dark:text-gray-200",
      "text-2xl",
      "transition-all",
      "underline-offset-2",
      "text-gray-800",
      "dark:text-gray-100",
      "text-md"
    )

    if (elementDetails["Link"]) {
      content.setAttribute("href", elementDetails["Link"])

      content.classList.add("underline", "hover:no-underline")
    }

    parentNode.insertBefore(newNodeContainer, parentNode.childNodes[0])
  } catch (e) {
    logConsoleError("addAvailabilityElement", e)
  }
}

function sendBiblioRequest() {
  // window.onload, DOMContentLoaded, and document.onload either fail to, or consistently fail to, run timeout code
  setTimeout(() => {
    const title = document.querySelector("h1").innerText
    const rawAuthors = document.getElementsByClassName(
      "transition-all underline-offset-2 text-md underline hover:no-underline flex-inline flex-row items-center"
    )
    let authors = []

    for (let i = 0; i < rawAuthors.length; i++) {
      authors.push(rawAuthors[i].textContent)
    }

    // the HTML has duplicate entries for the authors at smaller screen sizes hidden within it
    authors = [...new Set(authors)]

    chrome.runtime.sendMessage({
      type: LEITNER_MESSAGES[2],
      title,
      authors,
    })
  }, TIMEOUT_DELAY)
}

async function getLibraryInfo() {
  try {
    return await chrome.storage.local
      .get("libraryInfo")
      .then((res) => res.libraryInfo)
  } catch (e) {
    logConsoleError("getLibraryInfo", e)
  }
}

async function handleIncomingMessage(message) {
  const libraryName = await getLibraryInfo()

  if (message.type === LEITNER_MESSAGES[1]) {
    try {
      const details = {}

      details["Superheader"] = `${libraryName.name} Public Library`
      details["Link"] = message.link
      details[
        "Highlighted"
      ] = `${message.availableCopies} of ${message.totalCopies} copies available`

      if (message.heldCopies > 0) {
        if (message.heldCopies > 1) {
          details["Subheader"] = `${message.heldCopies} copies on hold`
        } else {
          details["Subheader"] = `${message.heldCopies} copy on hold`
        }
      }

      if (message.availableCopies !== 0) {
        details["Content"] = "Borrow Book"
      } else {
        details["Content"] = "Hold Book"
      }

      addAvailabilityElement(details)
    } catch (e) {
      logConsoleError("handleIncomingMessage - Available", e)
    }
  } else if (message.type === LEITNER_MESSAGES[0]) {
    try {
      const details = {}

      details["Superheader"] = `${libraryName.name} Public Library`
      details["Content"] = "Not Stocked"

      addAvailabilityElement(details)
    } catch (e) {
      logConsoleError("handleIncomingMessage - Unavailable", e)
    }
  }
}

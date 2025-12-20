const TIMEOUT_DELAY = 2000;
const REGEX_BOOK_URL = /^.*hardcover\.app\/books\/[^\/]+$/;

let lastUrl = location.href;

if (location.href.match(REGEX_BOOK_URL)) {
  sendBiblioRequest();
}

// Detects page changes since Hardcover is a SPA so it doesn't trigger page change naturally
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    onNavigation();
  }
}).observe(document, { subtree: true, childList: true });

function onNavigation() {
  if (location.href.match(REGEX_BOOK_URL)) {
    sendBiblioRequest();
  }
}

// TODO:
// Need to display message when the book isn't stocked at the library
// When there's a large amount of authors click the "View More" option so they're all available when pulling authors

browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === "LEITNER_DISPLAY_AVAILABILITY") {
    const parentNode = document.querySelector(
      ".min-h-screenHeightWithoutHeader"
    ).childNodes[5];

    const newNodeContainer = document.createElement("div");
    const superHeader = newNodeContainer.appendChild(
      document.createElement("div")
    );
    const content = newNodeContainer.appendChild(document.createElement("a"));
    const subHeader = newNodeContainer.appendChild(
      document.createElement("div")
    );

    superHeader.innerText = "Ottawa Public Library";
    superHeader.classList.add(
      "text-gray-600",
      "dark:text-gray-400",
      "text-sm",
      "font-semibold"
    );

    const highlightedSuperheader = superHeader.appendChild(
      document.createElement("span")
    );
    highlightedSuperheader.innerText = `${message.availableCopies} of ${message.totalCopies} copies available`;
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
    );

    if (message.heldCopies > 0) {
      if (message.heldCopies > 1) {
        subHeader.innerText = `${message.heldCopies} copies on hold`;
      } else {
        subHeader.innerText = `${message.heldCopies} copy on hold`;
      }
    }

    subHeader.classList.add("text-gray-600", "dark:text-gray-400", "text-md");

    if (message.availableCopies !== 0) {
      content.innerText = "Borrow Book";
    } else {
      content.innerText = "Hold Book";
    }

    content.setAttribute("href", message.link);

    content.classList.add(
      "font-serif",
      "text-gray-800",
      "dark:text-gray-200",
      "text-2xl",
      "transition-all",
      "underline-offset-2",
      "text-gray-800",
      "dark:text-gray-100",
      "text-md",
      "underline",
      "hover:no-underline"
    );

    parentNode.insertBefore(newNodeContainer, parentNode.childNodes[0]);
  } else if (message.type === "LEITNER_NO_AVAILABILITY") {
  }
});

function sendBiblioRequest() {
  // window.onload, DOMContentLoaded, and document.onload either fail to, or consistently fail to, run timeout code
  setTimeout(() => {
    const title = document.querySelector("h1").innerText;
    const rawAuthors = document.getElementsByClassName(
      "transition-all underline-offset-2 text-gray-800 dark:text-gray-100 text-md underline hover:no-underline flex-inline flex-row items-center"
    );
    let authors = [];

    for (let i = 0; i < rawAuthors.length; i++) {
      authors.push(rawAuthors[i].textContent);
    }

    // the HTML has duplicate entries for the authors at smaller screen sizes hidden within it
    authors = [...new Set(authors)];

    browser.runtime.sendMessage({
      type: "LEITNER_REQUEST",
      title,
      authors,
    });
  }, TIMEOUT_DELAY);
}

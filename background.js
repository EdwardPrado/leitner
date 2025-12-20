const REGEX_AFTER_FINAL_SLASH = /(?!.*\/).+/;
const LIBRARY = "ottawa";

browser.tabs.query({ active: true }).then((tabs) => {
  for (const tab of tabs) {
    browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
  }
});

browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === "LEITNER_REQUEST") {
    await queryTitle(message.title, message.authors);
  }
});

async function queryTitle(title, authors) {
  await fetch(
    `https://gateway.bibliocommons.com/v2/libraries/${LIBRARY}/rss/search?locked=false&searchType=bl&query=title:(${title})+++formatcode:(BOARD_BK%20OR%20BK%20OR%20GRAPHIC_NOVEL%20OR%20LPRINT%20OR%20BIG_BK%20OR%20PAPERBACK%20OR%20PICTURE_BOOK%20)`
  )
    .then((rawRes) => rawRes.text())
    .then(async (res) => {
      const parser = new DOMParser();
      const parsedRes = parser.parseFromString(res, "text/xml");

      await queryBookID(getMatchingBookLink(authors, parsedRes));

      // if (bookLink == null || bookLink == undefined) {
      //   console.log("bookLink = ", bookLink);
      //   browser.tabs.sendMessage(tabs[0].id, {
      //     type: "LEITNER_NO_AVAILABILITY",
      //   });
      // } else {
      //   await queryBookID(bookLink);
      // }
    })
    .catch((error) => console.error(`📚 Leitner: ${error}`));
}

async function queryBookID(id) {
  let availableCopies = 0;
  let totalCopies = 0;
  let heldCopies = 0;

  await fetch(
    `https://gateway.bibliocommons.com/v2/libraries/${LIBRARY}/bibs/${id}/availability`
  )
    .then((rawRes) => rawRes.json())
    .then(async (res) => {
      availableCopies = res.entities.availabilities[id].availableCopies;
      totalCopies = res.entities.availabilities[id].totalCopies;
      heldCopies = res.entities.availabilities[id].heldCopies;

      browser.tabs.query({ active: true }).then((tabs) => {
        browser.tabs.sendMessage(tabs[0].id, {
          type: "LEITNER_DISPLAY_AVAILABILITY",
          availableCopies,
          totalCopies,
          heldCopies,
          link: `https://${LIBRARY}.bibliocommons.com/v2/record/${id}?&utm_content=title_link&utm_medium=onpage_catalog_view`,
        });
      });
    })
    .catch((error) => console.error(`📚 Leitner: ${error}`))
    .finally(() => console.log("📚 Leitner: done fetch"));
}

function cleanupAuthorName(name) {
  const parts = name.split(",").map((p) => p.trim());
  if (parts.length === 2) {
    return `${parts[1]} ${parts[0]}`;
  }

  return name.trim();
}

function getMatchingBookLink(authors, parsedXml) {
  let matchingLink;

  const items = parsedXml.querySelectorAll("item");

  for (const item of items) {
    const creator = item.childNodes[6]?.textContent;
    if (!creator) break;

    const normalizedName = cleanupAuthorName(creator);

    for (let i = 0; i < authors.length; i++) {
      if (normalizedName === authors[i]) {
        `📚 Leitner: ${normalizedName} vs ${authors[i]}`;

        const link = item.querySelector("link")?.textContent;
        if (link) matchingLink = link;

        break;
      }
    }

    if (matchingLink) break;
  }

  return matchingLink?.match(REGEX_AFTER_FINAL_SLASH);
}

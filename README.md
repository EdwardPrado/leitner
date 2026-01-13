## Leitner Extension

Leitner lists your local Library's availability of a book on [Hardcover.app](https://hardcover.app/).

### Supported Libraries

Any library using [Bibliocommons](https://www.bibliocommons.com/)

## Setup

This project supports building the extension for both Firefox and Chrome.

### Prerequisites

- [Node.js](https://nodejs.org/)
- npm (included with Node.js)

### Developing

- Run `npm i` to install project dependencies
- Run `npm run build` to create builds for Firefox and Chrome.

### Testing in Browser

> ⚠️ Extensions have to be manually reloaded each time a change is made.
>
> ⚠️ Extensions added to Firefox do not persist when the browser is closed.

**Firefox**

1. Navigate to `about:debugging#/runtime/this-firefox`
2. Press `Load Temporary Add-on`
3. Select the `manifest.json` file under `distro/firefox/` after running the build command

**Chrome**

1. Navigate to `chrome://extensions/`
2. Press `Load unpacked`
3. Select the `manifest.json` file under `distro/chrome/` after running the build command

## Namesake

The extension was named after Jurgen Leitner from the Audio Drama The Magnus Archives.

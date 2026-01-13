import esbuild from "esbuild"
import fs from "fs"
import path from "path"

const OUTPUT_DIR = "distro"

fs.rmSync(OUTPUT_DIR, { recursive: true, force: true })

async function build(targetBrowser) {
  const targetDir = `${OUTPUT_DIR}/${targetBrowser}`

  if (targetBrowser == "chrome") {
    await esbuild.build({
      entryPoints: {
        background: "src/background.js",
        content: "src/content.js",
        popup: "src/popup/popup.css",
        offscreen: "src/offscreen/offscreen.js",
      },
      bundle: true,
      format: "iife",
      target: "chrome116",
      outdir: targetDir,
      entryNames: "[name]",
      loader: {
        ".css": "css",
        ".js": "js",
      },
      sourcemap: false,
      minify: false,
    })

    fs.copyFileSync(
      "src/offscreen/offscreen.html",
      path.join(targetDir, "offscreen.html")
    )
  } else {
    await esbuild.build({
      entryPoints: {
        background: "src/background.js",
        content: "src/content.js",
        popup: "src/popup/popup.css",
      },
      bundle: true,
      format: "iife",
      target: "firefox109",
      outdir: targetDir,
      entryNames: "[name]",
      loader: {
        ".js": "js",
      },
      sourcemap: false,
      minify: false,
    })
  }

  const baseManifest = JSON.parse(fs.readFileSync("src/manifest.base.json"))
  const targetManifest = JSON.parse(
    fs.readFileSync(`src/manifest.${targetBrowser}.json`)
  )

  const manifest = { ...baseManifest, ...targetManifest }

  fs.writeFileSync(
    path.join(targetDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  )

  fs.copyFileSync("src/popup/popup.html", path.join(targetDir, "popup.html"))
  fs.copyFileSync("src/popup/popup.js", path.join(targetDir, "popup.js"))

  console.log(`Built ${targetBrowser} distro`)
}

build("firefox")
build("chrome")

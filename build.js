import esbuild from "esbuild"
import fs from "fs"
import path from "path"

const OUTPUT_DIR = "distro/firefox"

fs.rmSync(OUTPUT_DIR, { recursive: true, force: true })

async function build() {
  await esbuild.build({
    entryPoints: {
      background: "src/background.js",
      content: "src/content.js",
      popup: "src/popup.css",
    },
    bundle: true,
    format: "iife",
    target: ["firefox149"],
    outdir: OUTPUT_DIR,
    entryNames: "[name]",
    loader: {
      ".css": "css",
      ".js": "js",
    },
    sourcemap: false,
    minify: false,
  })

  const baseManifest = JSON.parse(fs.readFileSync("src/manifest.base.json"))
  const targetManifest = JSON.parse(
    fs.readFileSync("src/manifest.firefox.json")
  )

  const manifest = { ...baseManifest, ...targetManifest }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  )

  fs.copyFileSync("src/popup.html", path.join(OUTPUT_DIR, "popup.html"))
  fs.copyFileSync("src/popup.js", path.join(OUTPUT_DIR, "popup.js"))

  console.log("Built extension")
}

build()

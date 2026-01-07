import esbuild from "esbuild"
import fs from "fs"
import path from "path"

const OUTPUT_DIR = "distro/firefox"

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

async function build() {
  await esbuild.build({
    entryPoints: {
      background: "src/background.js",
      content: "src/content.js",
    },
    bundle: true,
    format: "iife",
    target: ["firefox149"],
    outdir: OUTPUT_DIR,
    entryNames: "[name]",
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

  console.log("Built extension")
}

build()

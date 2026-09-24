#!/usr/bin/env node
/**
 * Builds optional voice-extra zips for GitHub Releases.
 * Run after `npm ci` (devDependencies include kokoro-js and picovoice).
 */
import { execSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'release')
const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
const stagingRoot = path.join(outDir, 'voice-extras-staging')

function run(cmd, cwd = root) {
  execSync(cmd, { cwd, stdio: 'inherit', env: process.env })
}

function buildExtra(id, packages) {
  const staging = path.join(stagingRoot, id)
  rmSync(staging, { recursive: true, force: true })
  mkdirSync(staging, { recursive: true })

  const pkg = {
    name: `ambient-voice-extra-${id}`,
    private: true,
    dependencies: Object.fromEntries(packages.map((name) => [name, '*'])),
  }
  writeFileSync(path.join(staging, 'package.json'), JSON.stringify(pkg, null, 2))

  run('npm install --omit=dev --no-package-lock --no-audit --no-fund', staging)

  const zipName = `${id}-mac-${arch}.zip`
  const zipPath = path.join(outDir, zipName)
  rmSync(zipPath, { force: true })
  run(`zip -rq "${zipPath}" node_modules`, staging)
  console.log(`[voice-extras] ${zipPath}`)
}

mkdirSync(outDir, { recursive: true })

buildExtra('kokoro', ['kokoro-js'])
buildExtra('picovoice', ['@picovoice/porcupine-node', '@picovoice/pvrecorder-node'])

console.log('[voice-extras] Done. Attach zips to the GitHub release.')

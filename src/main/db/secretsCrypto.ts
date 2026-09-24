import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { safeStorage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

const MASTER_KEY_FILE = 'master.key'
let masterKey: Buffer | null = null

function getMasterKeyPath(): string {
  return path.join(app.getPath('userData'), MASTER_KEY_FILE)
}

export function initMasterKey(): void {
  const keyPath = getMasterKeyPath()

  if (safeStorage.isEncryptionAvailable()) {
    if (fs.existsSync(keyPath)) {
      const encrypted = fs.readFileSync(keyPath)
      masterKey = Buffer.from(safeStorage.decryptString(encrypted), 'hex')
    } else {
      masterKey = randomBytes(32)
      const encrypted = safeStorage.encryptString(masterKey.toString('hex'))
      fs.writeFileSync(keyPath, encrypted)
    }
    return
  }

  console.warn('[secretsCrypto] safeStorage unavailable — using dev-only unencrypted key')
  if (fs.existsSync(keyPath)) {
    masterKey = Buffer.from(fs.readFileSync(keyPath, 'utf-8'), 'hex')
  } else {
    masterKey = randomBytes(32)
    fs.writeFileSync(keyPath, masterKey.toString('hex'))
  }
}

export function encryptSecret(plaintext: string): Buffer {
  if (!masterKey) initMasterKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', masterKey!, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted])
}

export function decryptSecret(blob: Buffer): string {
  if (!masterKey) initMasterKey()
  const iv = blob.subarray(0, 12)
  const tag = blob.subarray(12, 28)
  const data = blob.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', masterKey!, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

export const MASKED_SECRET = '••••••••'

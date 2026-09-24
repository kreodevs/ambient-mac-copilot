import type { ProviderProfile, ProviderPreset } from '../../shared/types.js'
import { getDatabase } from './database.js'
import { decryptSecret, encryptSecret } from './secretsCrypto.js'

interface ProviderRow {
  id: string
  name: string
  preset: string
  base_url: string
  supports_system_one: number
}

export function listProviders(): ProviderProfile[] {
  const rows = getDatabase()
    .prepare('SELECT * FROM providers ORDER BY name')
    .all() as ProviderRow[]

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    preset: row.preset as ProviderPreset,
    baseUrl: row.base_url,
    supportsSystemOne: row.supports_system_one === 1,
    apiKeyMasked: hasProviderSecret(row.id),
  }))
}

export function getProvider(id: string): ProviderProfile | null {
  const row = getDatabase()
    .prepare('SELECT * FROM providers WHERE id = ?')
    .get(id) as ProviderRow | undefined
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    preset: row.preset as ProviderPreset,
    baseUrl: row.base_url,
    supportsSystemOne: row.supports_system_one === 1,
    apiKeyMasked: hasProviderSecret(row.id),
  }
}

export function getProviderApiKey(id: string): string | null {
  const row = getDatabase()
    .prepare('SELECT api_key_enc FROM provider_secrets WHERE provider_id = ?')
    .get(id) as { api_key_enc: Buffer } | undefined
  if (!row) return null
  return decryptSecret(row.api_key_enc)
}

export function upsertProvider(profile: ProviderProfile): void {
  getDatabase()
    .prepare(
      `INSERT INTO providers (id, name, preset, base_url, supports_system_one)
       VALUES (@id, @name, @preset, @baseUrl, @supportsSystemOne)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         preset = excluded.preset,
         base_url = excluded.base_url,
         supports_system_one = excluded.supports_system_one`,
    )
    .run({
      id: profile.id,
      name: profile.name,
      preset: profile.preset,
      baseUrl: profile.baseUrl,
      supportsSystemOne: profile.supportsSystemOne ? 1 : 0,
    })
}

export function deleteProvider(id: string): void {
  getDatabase().prepare('DELETE FROM providers WHERE id = ?').run(id)
}

export function updateProviderSecret(providerId: string, apiKey: string): void {
  const enc = encryptSecret(apiKey)
  getDatabase()
    .prepare(
      `INSERT INTO provider_secrets (provider_id, api_key_enc) VALUES (?, ?)
       ON CONFLICT(provider_id) DO UPDATE SET api_key_enc = excluded.api_key_enc`,
    )
    .run(providerId, enc)
}

export function hasProviderSecret(providerId: string): boolean {
  const row = getDatabase()
    .prepare('SELECT 1 FROM provider_secrets WHERE provider_id = ?')
    .get(providerId)
  return !!row
}

export function getAppSecret(key: string): string | null {
  const row = getDatabase()
    .prepare('SELECT value_enc FROM app_secrets WHERE key = ?')
    .get(key) as { value_enc: Buffer } | undefined
  if (!row) return null
  return decryptSecret(row.value_enc)
}

export function setAppSecret(key: string, value: string): void {
  const enc = encryptSecret(value)
  getDatabase()
    .prepare(
      `INSERT INTO app_secrets (key, value_enc) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value_enc = excluded.value_enc`,
    )
    .run(key, enc)
}

export function hasAppSecret(key: string): boolean {
  const row = getDatabase().prepare('SELECT 1 FROM app_secrets WHERE key = ?').get(key)
  return !!row
}

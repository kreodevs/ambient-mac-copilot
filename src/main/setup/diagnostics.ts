import { app } from 'electron'
import { getSettings } from '../config/settingsStore.js'
import { hasProviderSecret } from '../db/providerRepository.js'
import { probeAllAutomationPermissions } from './automationPermission.js'
import { checkAllPermissions, checkPrerequisites } from './bootstrap.js'

export interface DiagnosticCheck {
  id: string
  label: string
  ok: boolean
  detail?: string
  fixHint?: string
}

export interface DiagnosticsReport {
  ok: boolean
  checks: DiagnosticCheck[]
  version: string
  ranAt: number
}

function check(id: string, label: string, ok: boolean, detail?: string, fixHint?: string): DiagnosticCheck {
  return { id, label, ok, detail, fixHint }
}

export async function runDiagnostics(): Promise<DiagnosticsReport> {
  const checks: DiagnosticCheck[] = []
  const settings = getSettings()
  const perms = await checkAllPermissions()
  const prereqs = await checkPrerequisites()
  const automation = await probeAllAutomationPermissions()

  for (const probe of automation) {
    checks.push(
      check(
        `automation_${probe.target}`,
        `Automatización: ${probe.label}`,
        probe.ok,
        probe.ok ? 'Acceso concedido' : probe.error,
        probe.ok
          ? undefined
          : 'Ajustes del Sistema → Privacidad → Automatización → activa Electron (o la app empaquetada).',
      ),
    )
  }

  checks.push(
    check(
      'microphone',
      'Micrófono',
      perms.microphoneGranted,
      perms.microphone,
      'Ajustes del Sistema → Privacidad → Micrófono',
    ),
    check(
      'screen',
      'Grabación de pantalla',
      perms.screenGranted,
      perms.screen,
      'Ajustes del Sistema → Privacidad → Grabación de pantalla',
    ),
    check(
      'speech',
      'Reconocimiento de voz',
      perms.speechGranted,
      perms.speech,
      'Ajustes del Sistema → Privacidad → Reconocimiento de voz',
    ),
    check(
      'ffmpeg',
      'ffmpeg',
      prereqs.ffmpeg.installed,
      prereqs.ffmpeg.path,
      'brew install ffmpeg o indica la ruta en Ajustes → Audio',
    ),
    check(
      'blackhole',
      'BlackHole 2ch',
      prereqs.blackhole.installed,
      prereqs.blackhole.installed ? 'Instalado' : 'No detectado',
      'Instala BlackHole 2ch para grabación de reuniones',
    ),
    check(
      'openrouter',
      'OpenRouter API key',
      hasProviderSecret('openrouter-main'),
      hasProviderSecret('openrouter-main') ? 'Configurada' : 'Falta',
      'Define OPENROUTER_API_KEY o añádela en Ajustes → Proveedores',
    ),
  )

  const jevProvider = settings.providers.find((p) => p.id === settings.agents.jev.providerId)
  const jevOk =
    settings.agents.jev.enabled &&
    !!jevProvider?.supportsSystemOne &&
    hasProviderSecret(jevProvider.id)

  checks.push(
    check(
      'jev',
      'Jev Router (System One)',
      jevOk,
      jevOk
        ? `Modelo ${settings.agents.jev.model}`
        : 'Jev desactivado o proveedor sin System One / sin API key',
      'Ajustes → Agentes → Jev: proveedor con System One y modelo ~typesafe/jev-latest',
    ),
  )

  const ok = checks.every((c) => c.ok)

  return {
    ok,
    checks,
    version: app.getVersion(),
    ranAt: Date.now(),
  }
}

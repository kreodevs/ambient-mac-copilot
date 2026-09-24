import type { EmailDetail, EmailSummary } from '../../bridge/mailService.js'
import * as bridge from '../../bridge/index.js'
import { captureActiveDisplayBase64 } from '../../screen/screenCapture.js'
import { getLLMClientForAgent } from '../../config/providerRegistry.js'
import { getAgentBinding } from '../../config/settingsStore.js'
import { inferMailFlags } from './mailArgs.js'
import { getToolDefinition, IMPLEMENTED_TOOLS } from './catalog.js'
import { createPendingPreview, consumePendingPreview } from './pendingStore.js'
import type { ToolExecuteOptions, ToolRunResult } from './types.js'

function formatEmailListReply(emails: EmailSummary[], label: string): string {
  if (emails.length === 0) return `No hay correos en ${label}.`
  const lines = emails.slice(0, 8).map((e) => `• ${e.sender} — ${e.subject}`)
  const more = emails.length > 8 ? `\n… y ${emails.length - 8} más.` : ''
  return `${emails.length} correo(s) ${label}:\n${lines.join('\n')}${more}`
}

function formatEmailDetailReply(email: EmailDetail): string {
  const preview = email.body.replace(/\s+/g, ' ').slice(0, 400)
  return `**${email.subject}**\nDe: ${email.sender}\n${email.date}\n\n${preview}${email.body.length > 400 ? '…' : ''}`
}

function previewSummary(tool: string, args: Record<string, unknown>): { summary: string; risks: string[] } {
  switch (tool) {
    case 'mail_send':
      return {
        summary: `Enviar correo a ${args.to} — «${args.subject}»`,
        risks: ['Se enviará un correo desde Mail.app'],
      }
    case 'mail_reply':
      return {
        summary: `Responder al correo #${args.messageId}`,
        risks: ['Se enviará una respuesta desde Mail.app'],
      }
    case 'mail_move':
      return {
        summary: `Mover correo #${args.messageId} a «${args.mailboxName}»`,
        risks: ['Reorganiza tu inbox'],
      }
    case 'manage_system':
      if (args.action === 'empty_trash') {
        return {
          summary: 'Vaciar la papelera del sistema',
          risks: ['Elimina archivos de la Papelera de forma permanente'],
        }
      }
      return {
        summary: `Acción de sistema: ${String(args.action ?? 'play')}`,
        risks: ['Modifica el estado de Music.app'],
      }
    case 'create_reminder_note':
      if (args.type === 'note') {
        return {
          summary: `Crear nota «${args.title ?? args.query ?? 'Sin título'}»`,
          risks: ['Escribe en la app Notas'],
        }
      }
      return {
        summary: `Crear recordatorio «${args.title ?? args.query ?? 'Sin título'}»`,
        risks: ['Escribe en la app Recordatorios'],
      }
    default:
      return { summary: `Ejecutar ${tool}`, risks: ['Acción con efectos en el sistema'] }
  }
}

function needsConfirmation(tool: string, args: Record<string, unknown>): boolean {
  const def = getToolDefinition(tool)
  if (!def?.requiresConfirmation) return false
  if (tool === 'manage_system') {
    return args.action === 'empty_trash'
  }
  return true
}

async function runToolBody(
  name: string,
  args: Record<string, unknown>,
): Promise<{ result: unknown; reply: string; actionData?: unknown }> {
  switch (name) {
    case 'mail_triage_inbox': {
      const triage = await bridge.mailTriageInbox({
        limit: (args.limit as number) ?? 10,
        autoArchiveJunk: (args.autoArchiveJunk as boolean) ?? true,
      })
      const reply = `Tienes ${triage.emails.length} correos sin leer. ${triage.archived.length} archivados como spam.`
      return { result: triage, reply, actionData: { type: 'mail_triage', ...triage } }
    }

    case 'mail_list_accounts': {
      const accounts = await bridge.listEmailAccounts()
      const reply = accounts.length
        ? `Cuentas: ${accounts.map((a) => a.name).join(', ')}`
        : 'No hay cuentas en Mail.app.'
      return { result: accounts, reply, actionData: { type: 'email_accounts', accounts } }
    }

    case 'mail_list': {
      const flags = inferMailFlags(String(args.query ?? ''))
      const emails = await bridge.listInboxEmails({
        limit: (args.limit as number) ?? 15,
        unreadOnly: (args.unreadOnly as boolean) ?? flags.unreadOnly,
        todayOnly: (args.todayOnly as boolean) ?? flags.todayOnly,
      })
      const label = flags.todayOnly ? 'de hoy' : flags.unreadOnly ? 'no leídos' : 'en inbox'
      return {
        result: emails,
        reply: formatEmailListReply(emails, label),
        actionData: { type: 'email_list', emails },
      }
    }

    case 'mail_search': {
      const flags = inferMailFlags(String(args.query ?? ''))
      const query = String(args.query ?? '').trim()
      const emails = await bridge.searchEmails(
        query,
        (args.limit as number) ?? 15,
        (args.todayOnly as boolean) ?? flags.todayOnly,
      )
      const label = query ? `que coinciden con «${query}»` : 'en inbox'
      return {
        result: emails,
        reply: formatEmailListReply(emails, label),
        actionData: { type: 'email_list', emails },
      }
    }

    case 'mail_read': {
      if (args.messageId) {
        const email = await bridge.readEmail(String(args.messageId))
        return {
          result: email,
          reply: formatEmailDetailReply(email),
          actionData: { type: 'email_detail', email },
        }
      }
      const query = String(args.query ?? '').trim()
      const result = await bridge.readEmailByQuery(query)
      if ('candidates' in result) {
        return {
          result,
          reply: `Encontré ${result.candidates.length} correos. Indica el ID o sé más específico.`,
          actionData: { type: 'email_list', emails: result.candidates },
        }
      }
      return {
        result,
        reply: formatEmailDetailReply(result),
        actionData: { type: 'email_detail', email: result },
      }
    }

    case 'mail_send': {
      const to = String(args.to ?? '')
      const subject = String(args.subject ?? '')
      const body = String(args.body ?? '')
      if (!to || !subject || !body) {
        throw new Error('Faltan campos: to, subject y body son obligatorios para enviar correo.')
      }
      await bridge.sendEmail({ to, subject, body })
      return { result: true, reply: `Correo enviado a ${to}.` }
    }

    case 'mail_reply': {
      const messageId = String(args.messageId ?? '')
      const body = String(args.body ?? '')
      if (!messageId || !body) {
        throw new Error('Faltan messageId y body para responder.')
      }
      await bridge.replyEmail(messageId, body)
      return { result: true, reply: 'Respuesta enviada.' }
    }

    case 'mail_draft': {
      const to = String(args.to ?? '')
      const subject = String(args.subject ?? '')
      const body = String(args.body ?? '')
      if (!to || !subject || !body) {
        throw new Error('Faltan campos: to, subject y body para el borrador.')
      }
      await bridge.createEmailDraft({
        to,
        subject,
        body,
        replyToMessageId: args.replyToMessageId as string | undefined,
      })
      return { result: true, reply: 'Borrador guardado en Mail.app.' }
    }

    case 'mail_move': {
      const messageId = String(args.messageId ?? '')
      const mailboxName = String(args.mailboxName ?? '')
      if (!messageId || !mailboxName) {
        throw new Error('Faltan messageId y mailboxName.')
      }
      await bridge.moveEmail(messageId, mailboxName, args.accountName as string | undefined)
      return { result: true, reply: `Correo movido a «${mailboxName}».` }
    }

    case 'analyze_current_screen': {
      const image = await captureActiveDisplayBase64()
      const binding = getAgentBinding('screenVision')
      const client = getLLMClientForAgent('screenVision')
      const query = (args.query as string) ?? 'Describe what is on screen'
      const analysis = await client.chatWithVision(
        [{ role: 'user', content: query }],
        image,
        binding.model,
      )
      return { result: analysis, reply: analysis }
    }

    case 'manage_system': {
      const action = (args.action as string) ?? 'play'
      if (action === 'empty_trash') {
        await bridge.emptyTrash()
        return { result: true, reply: 'Papelera vaciada.' }
      }
      if (action === 'pause') {
        await bridge.musicPause()
        return { result: true, reply: 'Música en pausa.' }
      }
      if (action === 'next') {
        await bridge.musicNext()
        return { result: true, reply: 'Siguiente pista.' }
      }
      await bridge.musicPlay()
      return { result: true, reply: 'Reproduciendo música.' }
    }

    case 'create_reminder_note': {
      const title = (args.title as string) ?? (args.query as string) ?? 'Recordatorio'
      if (args.type === 'note') {
        await bridge.createNote(title, (args.content as string) ?? title)
        return { result: true, reply: `Nota «${title}» creada.` }
      }
      await bridge.createReminder(title, args.dueDate as string | undefined)
      return { result: true, reply: `Recordatorio «${title}» creado.` }
    }

    default:
      throw new Error(`Tool no implementada: ${name}`)
  }
}

export async function executeTool(
  name: string,
  args: Record<string, unknown> = {},
  options: ToolExecuteOptions = {},
): Promise<ToolRunResult> {
  if (!IMPLEMENTED_TOOLS.has(name)) {
    const def = getToolDefinition(name)
    if (def && def.phase > 0) {
      return {
        status: 'error',
        error: 'not_implemented',
        reply: `La herramienta «${name}» está planificada para la fase ${def.phase}. Ver PLAN_MEJORAS.md.`,
      }
    }
    return {
      status: 'error',
      error: 'unknown_tool',
      reply: `Herramienta desconocida: ${name}`,
    }
  }

  if (options.previewId) {
    const pending = consumePendingPreview(options.previewId)
    if (!pending) {
      return {
        status: 'error',
        error: 'preview_expired',
        reply: 'La vista previa expiró o ya se usó. Vuelve a solicitar la acción.',
      }
    }
    try {
      const body = await runToolBody(pending.tool, pending.args)
      return { status: 'ok', ...body }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { status: 'error', error: message, reply: message }
    }
  }

  if (needsConfirmation(name, args) && !options.confirm) {
    const { summary, risks } = previewSummary(name, args)
    const { previewId, preview } = createPendingPreview(name, args, {
      tool: name,
      summary,
      args,
      risks,
    })
    const reply = `Vista previa: ${summary}. Confirma para continuar.`
    return {
      status: 'preview',
      previewId,
      preview,
      reply,
      actionData: { type: 'tool_preview', previewId, preview },
    }
  }

  try {
    const body = await runToolBody(name, args)
    return { status: 'ok', ...body }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { status: 'error', error: message, reply: message }
  }
}

export async function confirmToolPreview(previewId: string): Promise<ToolRunResult> {
  return executeTool('', {}, { previewId })
}

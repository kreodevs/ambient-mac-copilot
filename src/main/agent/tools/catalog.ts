import type { ToolDefinition } from './types.js'

export const IMPLEMENTED_PHASE = 1

export const TOOL_CATALOG: ToolDefinition[] = [
  {
    name: 'mail_triage_inbox',
    description: 'Lee correos no leídos y archiva newsletters/spam opcionalmente.',
    phase: 0,
    risks: ['read', 'write'],
    requiresConfirmation: false,
    parameters: {
      limit: { type: 'number', description: 'Máximo de correos a leer' },
      autoArchiveJunk: { type: 'boolean', description: 'Archivar junk automáticamente' },
    },
  },
  {
    name: 'analyze_current_screen',
    description: 'Captura la pantalla activa y la analiza con el agente de visión.',
    phase: 0,
    risks: ['read'],
    requiresConfirmation: false,
    parameters: {
      query: { type: 'string', description: 'Pregunta sobre la pantalla' },
    },
  },
  {
    name: 'manage_system',
    description: 'Controles del sistema: papelera, música.',
    phase: 0,
    risks: ['write', 'destructive'],
    requiresConfirmation: true,
    parameters: {
      action: {
        type: 'string',
        description: 'empty_trash | play | pause | next',
        required: true,
      },
    },
  },
  {
    name: 'create_reminder_note',
    description: 'Crea un recordatorio o nota en apps nativas.',
    phase: 0,
    risks: ['write'],
    requiresConfirmation: true,
    parameters: {
      type: { type: 'string', description: 'reminder | note' },
      title: { type: 'string', description: 'Título' },
      content: { type: 'string', description: 'Cuerpo (notas)' },
      dueDate: { type: 'string', description: 'Fecha ISO (recordatorios)' },
      query: { type: 'string', description: 'Texto libre del usuario' },
    },
  },
  {
    name: 'mail_list_accounts',
    description: 'Lista cuentas configuradas en Mail.app.',
    phase: 1,
    risks: ['read'],
    requiresConfirmation: false,
    parameters: {},
  },
  {
    name: 'mail_list',
    description: 'Lista correos del inbox (hoy, no leídos, límite).',
    phase: 1,
    risks: ['read'],
    requiresConfirmation: false,
    parameters: {
      limit: { type: 'number', description: 'Máximo de resultados' },
      unreadOnly: { type: 'boolean', description: 'Solo no leídos' },
      todayOnly: { type: 'boolean', description: 'Solo correos de hoy' },
    },
  },
  {
    name: 'mail_read',
    description: 'Lee el cuerpo de un correo por ID o búsqueda.',
    phase: 1,
    risks: ['read'],
    requiresConfirmation: false,
    parameters: {
      messageId: { type: 'string', description: 'ID del mensaje' },
      query: { type: 'string', description: 'Búsqueda si no hay ID' },
    },
  },
  {
    name: 'mail_search',
    description: 'Busca correos por asunto o remitente.',
    phase: 1,
    risks: ['read'],
    requiresConfirmation: false,
    parameters: {
      query: { type: 'string', description: 'Texto de búsqueda', required: true },
      todayOnly: { type: 'boolean', description: 'Solo hoy' },
      limit: { type: 'number', description: 'Máximo de resultados' },
    },
  },
  {
    name: 'mail_send',
    description: 'Envía un correo nuevo.',
    phase: 1,
    risks: ['outbound'],
    requiresConfirmation: true,
    parameters: {
      to: { type: 'string', description: 'Destinatario', required: true },
      subject: { type: 'string', description: 'Asunto', required: true },
      body: { type: 'string', description: 'Cuerpo', required: true },
    },
  },
  {
    name: 'mail_reply',
    description: 'Responde a un correo existente.',
    phase: 1,
    risks: ['outbound'],
    requiresConfirmation: true,
    parameters: {
      messageId: { type: 'string', description: 'ID del mensaje', required: true },
      body: { type: 'string', description: 'Cuerpo de la respuesta', required: true },
    },
  },
  {
    name: 'mail_draft',
    description: 'Guarda un borrador en Mail.app (no envía).',
    phase: 1,
    risks: ['write'],
    requiresConfirmation: false,
    parameters: {
      to: { type: 'string', description: 'Destinatario', required: true },
      subject: { type: 'string', description: 'Asunto', required: true },
      body: { type: 'string', description: 'Cuerpo', required: true },
      replyToMessageId: { type: 'string', description: 'ID si es respuesta en borrador' },
    },
  },
  {
    name: 'mail_move',
    description: 'Mueve un correo a otra carpeta.',
    phase: 1,
    risks: ['write'],
    requiresConfirmation: true,
    parameters: {
      messageId: { type: 'string', description: 'ID del mensaje', required: true },
      mailboxName: { type: 'string', description: 'Carpeta destino', required: true },
      accountName: { type: 'string', description: 'Cuenta (opcional)' },
    },
  },
]

export const IMPLEMENTED_TOOLS = new Set(
  TOOL_CATALOG.filter((t) => t.phase <= IMPLEMENTED_PHASE).map((t) => t.name),
)

export function getToolDefinition(name: string): ToolDefinition | undefined {
  return TOOL_CATALOG.find((t) => t.name === name)
}

export function listToolCatalog(): ToolDefinition[] {
  return TOOL_CATALOG
}

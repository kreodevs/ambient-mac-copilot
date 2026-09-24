export type JevChoiceId =
  | 'mail_triage'
  | 'mail_list'
  | 'mail_search'
  | 'mail_read'
  | 'mail_send'
  | 'screen_analysis'
  | 'system_action'
  | 'reminder_note'
  | 'general_chat'
  | 'complex'

export const JEV_CHOICES: Array<{ id: JevChoiceId; label: string }> = [
  { id: 'mail_triage', label: 'Triage inbox: spam, newsletters, archivar' },
  { id: 'mail_list', label: 'Listar correos (hoy, no leídos, inbox)' },
  { id: 'mail_search', label: 'Buscar correos por remitente o asunto' },
  { id: 'mail_read', label: 'Leer el contenido de un correo' },
  { id: 'mail_send', label: 'Enviar, responder o redactar correo' },
  { id: 'screen_analysis', label: 'Pantalla, error visible, qué hay en pantalla' },
  { id: 'system_action', label: 'Basura, música, play/pause' },
  { id: 'reminder_note', label: 'Recordatorio, nota, tarea' },
  { id: 'general_chat', label: 'Preguntas abiertas, razonamiento' },
  { id: 'complex', label: 'Multi-paso, ambiguo' },
]

export const CHOICE_TO_TOOL: Partial<Record<JevChoiceId, string>> = {
  mail_triage: 'mail_triage_inbox',
  mail_list: 'mail_list',
  mail_search: 'mail_search',
  mail_read: 'mail_read',
  mail_send: 'mail_send',
  screen_analysis: 'analyze_current_screen',
  system_action: 'manage_system',
  reminder_note: 'create_reminder_note',
}

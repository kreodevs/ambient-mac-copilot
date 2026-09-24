import { escapeAppleScriptString, runAppleScript } from './osascript.js'

const ROW_SEP = '|||'

export interface EmailAccount {
  id: string
  name: string
}

export interface EmailSummary {
  id: string
  subject: string
  sender: string
  date: string
  read?: boolean
}

export interface EmailDetail extends EmailSummary {
  body: string
}

export interface MailFolder {
  name: string
  account: string
}

function parseRows(result: string, columns: number): string[][] {
  if (!result.trim()) return []
  return result
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(ROW_SEP)
      while (parts.length < columns) parts.push('')
      return parts.slice(0, columns)
    })
}

function toSummary(row: string[]): EmailSummary {
  return {
    id: row[0],
    subject: row[1] || '(sin asunto)',
    sender: row[2] || '',
    date: row[3] || '',
    read: row[4] === 'read',
  }
}

export async function listEmailAccounts(): Promise<EmailAccount[]> {
  const script = `
    tell application "Mail"
      set output to ""
      repeat with acc in accounts
        set output to output & (id of acc as string) & "${ROW_SEP}" & (name of acc) & linefeed
      end repeat
      return output
    end tell
  `
  const result = await runAppleScript(script)
  return parseRows(result, 2).map(([id, name]) => ({ id, name }))
}

export async function listInboxEmails(options: {
  limit?: number
  unreadOnly?: boolean
  todayOnly?: boolean
  accountName?: string
} = {}): Promise<EmailSummary[]> {
  const limit = options.limit ?? 15
  const unreadOnly = options.unreadOnly ?? false
  const todayOnly = options.todayOnly ?? false
  const accountClause = options.accountName
    ? `mailbox "INBOX" of account "${escapeAppleScriptString(options.accountName)}"`
    : 'inbox'

  const script = `
    tell application "Mail"
      set output to ""
      set msgs to messages of ${accountClause}
      set countLimit to ${limit}
      set i to 0
      set todayStart to (current date)
      set hours of todayStart to 0
      set minutes of todayStart to 0
      set seconds of todayStart to 0
      repeat with m in msgs
        if i >= countLimit then exit repeat
        set includeMsg to true
        if ${unreadOnly ? 'true' : 'false'} and read status of m is not unread then set includeMsg to false
        if ${todayOnly ? 'true' : 'false'} and (date received of m) < todayStart then set includeMsg to false
        if includeMsg then
          set readFlag to "read"
          if read status of m is unread then set readFlag to "unread"
          set output to output & (id of m as string) & "${ROW_SEP}" & (subject of m) & "${ROW_SEP}" & (sender of m) & "${ROW_SEP}" & (date received of m as string) & "${ROW_SEP}" & readFlag & linefeed
          set i to i + 1
        end if
      end repeat
      return output
    end tell
  `

  const result = await runAppleScript(script)
  return parseRows(result, 5).map(toSummary)
}

export async function searchEmails(
  query: string,
  limit = 15,
  todayOnly = false,
): Promise<EmailSummary[]> {
  const safeQuery = escapeAppleScriptString(query.toLowerCase())
  const script = `
    tell application "Mail"
      set output to ""
      set msgs to messages of inbox
      set countLimit to ${limit}
      set i to 0
      set q to "${safeQuery}"
      set todayStart to (current date)
      set hours of todayStart to 0
      set minutes of todayStart to 0
      set seconds of todayStart to 0
      repeat with m in msgs
        if i >= countLimit then exit repeat
        if ${todayOnly ? 'true' : 'false'} and (date received of m) < todayStart then
          -- skip
        else
        set subj to (subject of m) as string
        set snd to (sender of m) as string
        if q is "" or subj contains q or snd contains q then
          set readFlag to "read"
          if read status of m is unread then set readFlag to "unread"
          set output to output & (id of m as string) & "${ROW_SEP}" & subj & "${ROW_SEP}" & snd & "${ROW_SEP}" & (date received of m as string) & "${ROW_SEP}" & readFlag & linefeed
          set i to i + 1
        end if
        end if
      end repeat
      return output
    end tell
  `
  const result = await runAppleScript(script)
  return parseRows(result, 5).map(toSummary)
}

export async function readEmail(messageId: string): Promise<EmailDetail> {
  const id = Number.parseInt(messageId, 10)
  if (Number.isNaN(id)) throw new Error(`ID de correo inválido: ${messageId}`)

  const script = `
    tell application "Mail"
      set m to first message whose id is ${id}
      set bodyText to content of m
      if length of bodyText > 12000 then set bodyText to text 1 thru 12000 of bodyText
      set readFlag to "read"
      if read status of m is unread then set readFlag to "unread"
      return (id of m as string) & "${ROW_SEP}" & (subject of m) & "${ROW_SEP}" & (sender of m) & "${ROW_SEP}" & (date received of m as string) & "${ROW_SEP}" & readFlag & "${ROW_SEP}" & bodyText
    end tell
  `
  const result = await runAppleScript(script)
  const row = parseRows(result, 6)[0]
  if (!row) throw new Error(`Correo no encontrado: ${messageId}`)
  const summary = toSummary(row)
  return { ...summary, body: row[5] ?? '' }
}

export async function readEmailByQuery(query: string): Promise<EmailDetail | { candidates: EmailSummary[] }> {
  const matches = await searchEmails(query, 5)
  if (matches.length === 0) {
    throw new Error(`No encontré correos que coincidan con «${query}».`)
  }
  if (matches.length > 1) {
    return { candidates: matches }
  }
  return readEmail(matches[0].id)
}

export async function sendEmail(options: {
  to: string
  subject: string
  body: string
}): Promise<void> {
  const to = escapeAppleScriptString(options.to)
  const subject = escapeAppleScriptString(options.subject)
  const body = escapeAppleScriptString(options.body)

  await runAppleScript(`
    tell application "Mail"
      set newMessage to make new outgoing message with properties {subject:"${subject}", content:"${body}", visible:false}
      tell newMessage
        make new to recipient at end of to recipients with properties {address:"${to}"}
        send
      end tell
    end tell
  `)
}

export async function replyEmail(messageId: string, body: string): Promise<void> {
  const id = Number.parseInt(messageId, 10)
  if (Number.isNaN(id)) throw new Error(`ID de correo inválido: ${messageId}`)
  const safeBody = escapeAppleScriptString(body)

  await runAppleScript(`
    tell application "Mail"
      set origMsg to first message whose id is ${id}
      set replyMsg to reply origMsg
      tell replyMsg
        set content to "${safeBody}"
        send
      end tell
    end tell
  `)
}

export async function createEmailDraft(options: {
  to: string
  subject: string
  body: string
  replyToMessageId?: string
}): Promise<void> {
  const subject = escapeAppleScriptString(options.subject)
  const body = escapeAppleScriptString(options.body)
  const to = escapeAppleScriptString(options.to)

  if (options.replyToMessageId) {
    const id = Number.parseInt(options.replyToMessageId, 10)
    if (Number.isNaN(id)) throw new Error(`ID de correo inválido: ${options.replyToMessageId}`)
    await runAppleScript(`
      tell application "Mail"
        set origMsg to first message whose id is ${id}
        set draftMsg to reply origMsg
        tell draftMsg
          set content to "${body}"
          set subject to "${subject}"
        end tell
      end tell
    `)
    return
  }

  await runAppleScript(`
    tell application "Mail"
      set newMessage to make new outgoing message with properties {subject:"${subject}", content:"${body}", visible:false}
      tell newMessage
        make new to recipient at end of to recipients with properties {address:"${to}"}
      end tell
    end tell
  `)
}

export async function listEmailFolders(accountName?: string): Promise<MailFolder[]> {
  const safeAccount = accountName ? escapeAppleScriptString(accountName) : ''
  const script = accountName
    ? `
    tell application "Mail"
      set output to ""
      repeat with acc in accounts
        if name of acc is "${safeAccount}" then
          repeat with box in mailboxes of acc
            set output to output & (name of acc) & "${ROW_SEP}" & (name of box) & linefeed
          end repeat
        end if
      end repeat
      return output
    end tell
  `
    : `
    tell application "Mail"
      set output to ""
      repeat with acc in accounts
        repeat with box in mailboxes of acc
          set output to output & (name of acc) & "${ROW_SEP}" & (name of box) & linefeed
        end repeat
      end repeat
      return output
    end tell
  `
  const result = await runAppleScript(script)
  return parseRows(result, 2).map(([account, name]) => ({ account, name }))
}

export async function moveEmail(messageId: string, mailboxName: string, accountName?: string): Promise<void> {
  const id = Number.parseInt(messageId, 10)
  if (Number.isNaN(id)) throw new Error(`ID de correo inválido: ${messageId}`)
  const safeMailbox = escapeAppleScriptString(mailboxName)
  const targetMailbox = accountName
    ? `mailbox "${safeMailbox}" of account "${escapeAppleScriptString(accountName)}"`
    : `mailbox "${safeMailbox}" of account 1`

  await runAppleScript(`
    tell application "Mail"
      set m to first message whose id is ${id}
      move m to ${targetMailbox}
    end tell
  `)
}

export async function fetchUnreadEmails(limit = 10): Promise<EmailSummary[]> {
  return listInboxEmails({ limit, unreadOnly: true })
}

export async function archiveMessages(ids: string[]): Promise<void> {
  for (const rawId of ids) {
    const id = Number.parseInt(rawId, 10)
    if (Number.isNaN(id)) continue
    await runAppleScript(`
      tell application "Mail"
        set m to first message whose id is ${id}
        set archiveBox to mailbox "Archive" of account 1
        move m to archiveBox
      end tell
    `)
  }
}

const JUNK_PATTERNS = [/unsubscribe/i, /newsletter/i, /promo/i, /marketing/i, /noreply/i]

export async function mailTriageInbox(options: {
  limit?: number
  autoArchiveJunk?: boolean
}): Promise<{ emails: EmailSummary[]; archived: string[] }> {
  const emails = await fetchUnreadEmails(options.limit ?? 10)
  const archived: string[] = []

  if (options.autoArchiveJunk) {
    const junkIds = emails
      .filter((e) => JUNK_PATTERNS.some((p) => p.test(e.subject) || p.test(e.sender)))
      .map((e) => e.id)

    if (junkIds.length > 0) {
      await archiveMessages(junkIds)
      archived.push(...junkIds)
    }
  }

  return {
    emails: emails.filter((e) => !archived.includes(e.id)),
    archived,
  }
}

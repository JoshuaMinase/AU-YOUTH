// Chat attachments and voice messages: shared limits and helpers (docs/sql/023_chat_media.sql).
// Plain module (no hooks, no browser client) so both the chat page and the send route can import it.

export const CHAT_BUCKET = 'chat-files';
export const CHAT_MAX_BYTES = 10 * 1024 * 1024;      // matches the bucket limit in SQL 023
export const CHAT_GIF_MAX_BYTES = 4 * 1024 * 1024;   // photos are checked by the AI before sending, so keep them small
export const CHAT_MAX_SECONDS = 300;                 // longest voice message (5 minutes)
export const CHAT_MAX_STAGED = 5;                    // files that can be queued in one go

/** 'ticket' is a support-ticket card posted in a department chat (docs/sql/029_ticket_workflow.sql); it carries no file */
export type ChatKind = 'text' | 'image' | 'file' | 'voice' | 'ticket';

/** the file a message carries (messages.attachment_* columns) */
export interface ChatFile { path: string; name: string; type: string; size: number; seconds?: number }

/** extensions people may attach, and the type each one is stored as (must match the bucket list in SQL 023) */
const TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  pdf: 'application/pdf', txt: 'text/plain', csv: 'text/csv',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};
export const FILE_TYPES = Array.from(new Set(Object.values(TYPES)));
export const AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/wav', 'audio/x-m4a'];
/** value for <input type="file" accept> */
export const CHAT_ACCEPT = Object.keys(TYPES).map((e) => `.${e}`).join(',');

export const baseType = (t: string) => t.split(';')[0].trim().toLowerCase();
export const extOf = (name: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase() : '');

/** file name as shown in the chat: no path, no control characters, at most 120 characters */
export function cleanName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? '';
  // eslint-disable-next-line no-control-regex
  const t = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (t.length <= 120) return t || 'file';
  const ext = extOf(t);
  return t.slice(0, 116 - (ext ? ext.length + 1 : 0)) + (ext ? `.${ext}` : '');
}

/** the allowed type of a picked file (by its extension, because some systems send an empty type), or null */
export function chatMime(name: string): string | null {
  return TYPES[extOf(name)] ?? null;
}

/** an error message when the file cannot be attached, otherwise null */
export function checkChatFile(f: { name: string; size: number }): string | null {
  const mime = chatMime(f.name);
  if (!mime) return `"${cleanName(f.name)}" is not a supported file. You can attach photos (JPG, PNG, WebP, GIF), PDF, Word, Excel, PowerPoint, TXT and CSV.`;
  if (f.size <= 0) return `"${cleanName(f.name)}" is empty.`;
  if (f.size > CHAT_MAX_BYTES) return `"${cleanName(f.name)}" is over 10 MB. Please choose a smaller file.`;
  if (mime === 'image/gif' && f.size > CHAT_GIF_MAX_BYTES) return `"${cleanName(f.name)}" is over 4 MB. GIFs can be up to 4 MB.`;
  return null;
}

export function audioExt(mime: string) {
  const t = baseType(mime);
  return t === 'audio/mp4' || t === 'audio/x-m4a' ? 'm4a' : t === 'audio/ogg' ? 'ogg' : t === 'audio/mpeg' ? 'mp3' : t === 'audio/wav' ? 'wav' : t === 'audio/aac' ? 'aac' : 'webm';
}

export const fmtSize = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);
export const fmtDuration = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** what the conversation list and quick chat show for a message */
export function previewOf(m: { kind?: ChatKind; body: string; file?: ChatFile }) {
  if (m.kind === 'image') return m.body || 'Photo';
  if (m.kind === 'voice') return `Voice message${m.file?.seconds ? ` · ${fmtDuration(m.file.seconds)}` : ''}`;
  if (m.kind === 'file') return m.body || m.file?.name || 'File';
  return m.body;
}

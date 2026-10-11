/**
 * What a chat file really is, judged from its first bytes. The browser's "type" can be anything a person types into a
 * request, so the server checks the content before a file is attached to a message (app/api/chat/send/route.ts).
 */
const at = (b: Uint8Array, sig: number[], from = 0) => sig.every((v, i) => b[from + i] === v);
const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));

/** true when the first bytes (`b`, up to 1 KB) fit the claimed type */
export function matchesType(type: string, b: Uint8Array): boolean {
  if (!b.length) return false;
  switch (type) {
    case 'image/jpeg': return at(b, [0xff, 0xd8, 0xff]);
    case 'image/png': return at(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'image/gif': return at(b, ascii('GIF8'));
    case 'image/webp': return at(b, ascii('RIFF')) && at(b, ascii('WEBP'), 8);
    case 'application/pdf': {
      const head = String.fromCharCode(...b.subarray(0, 1024));
      return head.includes('%PDF-');   // the spec allows a little junk before the header
    }
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return at(b, [0x50, 0x4b, 0x03, 0x04]);   // a zip container
    case 'application/msword':
    case 'application/vnd.ms-excel':
    case 'application/vnd.ms-powerpoint':
      return at(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case 'text/plain':
    case 'text/csv':
      if ((b[0] === 0xff && b[1] === 0xfe) || (b[0] === 0xfe && b[1] === 0xff)) return true;   // UTF-16 with a byte-order mark
      return !b.includes(0);   // text has no zero bytes; a picture or program does
    case 'audio/webm': return at(b, [0x1a, 0x45, 0xdf, 0xa3]);
    case 'audio/ogg': return at(b, ascii('OggS'));
    case 'audio/mp4':
    case 'audio/x-m4a': return at(b, ascii('ftyp'), 4);
    case 'audio/mpeg': return at(b, ascii('ID3')) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
    case 'audio/aac': return at(b, ascii('ID3')) || (b[0] === 0xff && (b[1] & 0xf6) === 0xf0);
    case 'audio/wav': return at(b, ascii('RIFF')) && at(b, ascii('WAVE'), 8);
    default: return false;
  }
}

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { Cycle } from '../../data-access';

function encryptionKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required for cycle calendar tokens');
  return createHash('sha256').update(secret).digest();
}

export function hashCalendarToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function createCalendarToken() {
  const token = randomBytes(32).toString('base64url');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const encrypted = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    'base64url',
  );
  return { token, tokenHash: hashCalendarToken(token), tokenCiphertext: encrypted };
}

export function decryptCalendarToken(tokenCiphertext: string) {
  const packed = Buffer.from(tokenCiphertext, 'base64url');
  const iv = packed.subarray(0, 12);
  const authTag = packed.subarray(12, 28);
  const ciphertext = packed.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function escapeText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatDateOnly(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatTimestamp(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

export function buildCycleCalendarFeed(
  teamName: string,
  cycles: Cycle[],
  generatedAt = new Date(),
) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Circle//Cycles//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(`Circle · ${teamName} Cycles`)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const cycle of cycles) {
    const endDateExclusive = addUtcDays(cycle.endDate, 1);
    const description = [
      `Status: ${cycle.status}`,
      `Scope: ${cycle.scope}`,
      `Completed: ${cycle.completed}`,
    ].join('\n');
    const updatedAt = cycle.updatedAt ?? cycle.createdAt ?? generatedAt;

    lines.push(
      'BEGIN:VEVENT',
      `UID:cycle-${escapeText(cycle.id)}@circle`,
      `DTSTAMP:${formatTimestamp(generatedAt)}`,
      `LAST-MODIFIED:${formatTimestamp(updatedAt)}`,
      `DTSTART;VALUE=DATE:${formatDateOnly(cycle.startDate)}`,
      `DTEND;VALUE=DATE:${formatDateOnly(endDateExclusive)}`,
      `SUMMARY:${escapeText(`${teamName} · ${cycle.name}`)}`,
      `DESCRIPTION:${escapeText(description)}`,
      `STATUS:${cycle.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

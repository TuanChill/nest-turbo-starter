import { randomInt } from 'node:crypto';

export function generateRandomToken(): string {
  return randomInt(100000, 1_000_000).toString();
}

export function generateSixDigitCode(): string {
  const code = randomInt(0, 1_000_000);
  return code.toString().padStart(6, '0');
}

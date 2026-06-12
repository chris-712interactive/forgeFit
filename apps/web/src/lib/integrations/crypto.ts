import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function encryptionKey(): Buffer {
  const secret = process.env.INTEGRATIONS_TOKEN_ENCRYPTION_KEY?.trim();
  if (!secret) {
    throw new Error("INTEGRATIONS_TOKEN_ENCRYPTION_KEY is not configured.");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptIntegrationSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptIntegrationSecret(payload: string): string {
  const buffer = Buffer.from(payload, "base64url");
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8"
  );
}

export function isIntegrationEncryptionConfigured(): boolean {
  return Boolean(process.env.INTEGRATIONS_TOKEN_ENCRYPTION_KEY?.trim());
}

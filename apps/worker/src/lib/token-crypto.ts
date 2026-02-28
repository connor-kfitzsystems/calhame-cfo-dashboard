import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const TOKEN_CIPHER_ALGORITHM = "aes-256-gcm" as const;
const TOKEN_IV_BYTES = 12;

function getTokenEncryptionKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("Missing TOKEN_ENCRYPTION_KEY env var");
  }

  const asBase64 = Buffer.from(raw, "base64");
  if (asBase64.length === 32) {
    return asBase64;
  }

  const asHex = Buffer.from(raw, "hex");
  if (asHex.length === 32) {
    return asHex;
  }

  throw new Error(
    "Invalid TOKEN_ENCRYPTION_KEY; expected 32-byte key as base64 or hex"
  );
}

export function encryptTokenForStorage(plaintext: string): string {
  const key = getTokenEncryptionKey();
  const iv = randomBytes(TOKEN_IV_BYTES);

  const cipher = createCipheriv(TOKEN_CIPHER_ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `enc:v1:${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptTokenFromStorage(payload: string): string {
  const parts = payload.split(":");
  const [prefix, version, ivB64, tagB64, ciphertextB64] = parts;
  if (
    parts.length !== 5 ||
    prefix !== "enc" ||
    version !== "v1" ||
    !ivB64 ||
    !tagB64 ||
    !ciphertextB64
  ) {
    throw new Error("Invalid encrypted token payload format");
  }

  const key = getTokenEncryptionKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = createDecipheriv(TOKEN_CIPHER_ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

import { z } from "zod";

/**
 * Primitive schemas shared across API contracts.
 * - Prefer permissive-but-typed parsing (coerce) for IDs/numbers,
 *   while still failing on obviously wrong shapes.
 */

export const Id = z
  .union([z.number(), z.string().regex(/^\d+$/)])
  .transform((v) => Number(v));

export const Int = z.coerce.number().int();
export const Bool = z.coerce.boolean();

// ISO-ish date/time strings (keep permissive: backend formats may vary)
export const DateTimeString = z.string().min(1);
export const NullableDateTimeString = DateTimeString.nullable();

export const StringArray = z.array(z.string());

export const Visibility = z.enum(["PUBLIC", "PRIVATE"]);

// Helper: require at least one of the given keys to be present (non-null/undefined).
export function requireOneOf(keys) {
  return (obj) => keys.some((k) => obj?.[k] != null);
}

export { z };

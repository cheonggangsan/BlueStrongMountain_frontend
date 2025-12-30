import { ApiSchemaError } from "./errors";

/**
 * DEV/TEST 환경 판별 (Vite/Vitest 기준)
 */
export function isDevEnv() {
  return (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env.DEV ||
      import.meta.env.MODE === "test" ||
      import.meta.env.MODE === "development")
  );
}

/**
 * Validate an API response at the service boundary.
 * - Throws ApiSchemaError on mismatch (fast-fail).
 * - Logs details in DEV for debugging.
 *
 * @template T
 * @param {import("zod").ZodType<T>} schema
 * @param {unknown} data
 * @param {string} context
 * @returns {T}
 */
export function assertSchema(schema, data, context) {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const issues = result.error.issues?.map((i) => ({
    path: i.path?.join("."),
    code: i.code,
    message: i.message,
  }));

  // Avoid crashing if import.meta is not available (unit tests / non-vite env)
  if (isDevEnv()) {
    // eslint-disable-next-line no-console
    console.error("[API_SCHEMA_INVALID]", { context, issues, data });
  }

  throw new ApiSchemaError({ context, issues });
}

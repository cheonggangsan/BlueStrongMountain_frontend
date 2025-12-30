import { describe, it, expect } from "vitest";
import { assertSchema } from "@/lib/schema/assertSchema";
import { ApiGroupDetailSchema } from "@/lib/schema/group.schema";
import { ApiSchemaError } from "@/lib/schema/errors";

describe("API contract schemas", () => {
  it("parses GroupDetail with title + ids", () => {
    const input = {
      id: "10",
      title: "Algo Study",
      ownerId: 1,
      managers: ["1", 2],
      members: [1, 2, 3],
      visibility: "PRIVATE",
      createdAt: "2025-01-01T00:00:00",
      updatedAt: "2025-01-02T00:00:00",
    };

    const parsed = assertSchema(ApiGroupDetailSchema, input, "test");
    expect(parsed.id).toBe(10);
    expect(parsed.ownerId).toBe(1);
  });

  it("throws ApiSchemaError with context/issues when required fields are missing", () => {
    try {
      assertSchema(
        ApiGroupDetailSchema,
        { description: "x" },
        "group.detail.test",
      );
      throw new Error("Expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiSchemaError);
      expect(err.code).toBe("API_SCHEMA_INVALID");
      expect(err.context).toBe("group.detail.test");
      expect(Array.isArray(err.issues)).toBe(true);
      expect(err.issues.length).toBeGreaterThan(0);
      expect(err.issues[0]).toHaveProperty("path");
      expect(err.issues[0]).toHaveProperty("code");
      expect(err.issues[0]).toHaveProperty("message");
    }
  });
});

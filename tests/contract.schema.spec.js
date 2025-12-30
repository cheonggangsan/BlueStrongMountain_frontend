import { describe, it, expect } from "vitest";
import { assertSchema } from "@/lib/schema/assertSchema";
import { ApiGroupDetailSchema } from "@/lib/schema/group.schema";

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

  it("throws ApiSchemaError when required fields are missing", () => {
    expect(() =>
      assertSchema(ApiGroupDetailSchema, { title: "x" }, "test"),
    ).toThrowError();
  });
});

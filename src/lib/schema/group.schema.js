import {
  z,
  Id,
  Int,
  Visibility,
  requireOneOf,
  DateTimeString,
} from "./primitives";

/**
 * Group summary returned from GET /groups
 * (fields based on src/services/groupService.js mapping)
 */
export const ApiGroupSummarySchema = z
  .object({
    id: Id,
    title: z.string().min(1),
    ownerId: Id.nullable().optional(),
    visibility: Visibility.optional(),
    memberCount: Int.optional(),
    groupRole: z.string().nullable().optional(),
    description: z.string().optional(),
    createdAt: DateTimeString.optional(),
    updatedAt: DateTimeString.optional(),
  })
  .passthrough();

export const ApiGroupSummaryListSchema = z.array(ApiGroupSummarySchema);

/**
 * Group detail returned from GET /groups/{id}/detail
 */
export const ApiGroupDetailSchema = z
  .object({
    id: Id,
    title: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    ownerId: Id.nullable().optional(),

    managers: z.array(Id).optional(),
    managerIds: z.array(Id).optional(),

    members: z.array(Id).optional(),
    memberIds: z.array(Id).optional(),

    visibility: Visibility.optional(),
    createdAt: DateTimeString.optional(),
    updatedAt: DateTimeString.optional(),
  })
  .passthrough()
  .refine(requireOneOf(["title", "name"]), {
    message: "Group must have title or name",
    path: ["title"],
  });

/**
 * GroupUserDto returned from GET /groups/{id}/users
 * (minimal: keep permissive; enforce IDs)
 */
export const ApiGroupUserSchema = z
  .object({
    userId: Id.optional(),
    id: Id.optional(),
    username: z.string().optional(),
    nickname: z.string().optional(),
    role: z.string().optional(),
  })
  .passthrough()
  .transform((u) => ({ ...u, userId: u.userId ?? u.id }))
  .refine((u) => u.userId != null, {
    message: "User must have id",
    path: ["userId"],
  });

export const ApiGroupUserListSchema = z.array(ApiGroupUserSchema);

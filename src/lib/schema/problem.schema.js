import { z, Id, Int, StringArray, requireOneOf } from "./primitives";

/**
 * Raw problem DTOs used by problemService.normalizeProblem().
 * Accepts both snake_case and camelCase fields.
 */
export const ApiProblemSchema = z
  .object({
    id: Id.optional(),
    problemId: Id.optional(),

    title: z.string().optional(),
    name: z.string().optional(),

    difficulty: Int.optional(),

    tags: StringArray.optional(),

    acceptedUserCount: Int.optional(),
    accepted_user_count: Int.optional(),

    registeredAt: z.string().optional(),
    registered_before: z.string().optional(),
    updatedAt: z.string().optional(),
    createdAt: z.string().optional(),

    reviewCount: Int.optional(),
    review_count: Int.optional(),
    reviewCnt: Int.optional(),
  })
  .passthrough()
  .refine(requireOneOf(["id", "problemId"]), {
    message: "Problem must have id",
    path: ["id"],
  });

export const ApiProblemListSchema = z.array(ApiProblemSchema);

/**
 * Normalized problem shape used in UI (return value of normalizeProblem()).
 * Keeping this helps ensure services don't leak inconsistent models.
 */
export const FrontProblemSchema = z.object({
  id: Id,
  title: z.string(),
  difficulty: z.string(), // label (e.g., "Gold III" / "Unrated")
  tags: z.array(z.string()),
  acceptedUserCount: Int,
  registeredAt: z.string().nullable(),
  reviewCount: Int.optional(),
});
export const FrontProblemListSchema = z.array(FrontProblemSchema);

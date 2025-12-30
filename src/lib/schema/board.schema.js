import { z, Id, Int, NullableDateTimeString } from "./primitives";
import { ApiProblemSchema } from "./problem.schema";

/**
 * Board summary returned from GET /groups/{groupId}/boards
 * (fields based on src/services/boardService.js mapBoardSummaryFromApi)
 */
export const ApiBoardSummarySchema = z
  .object({
    boardId: Id,
    title: z.string().min(1),
    endTime: NullableDateTimeString.optional(),
    problemsCount: Int.optional(),
  })
  .passthrough();

export const ApiBoardSummaryListSchema = z.array(ApiBoardSummarySchema);

/**
 * Board detail returned from GET /groups/{groupId}/boards/{boardId}
 * (fields based on src/services/boardService.js mapBoardDetailFromApi)
 */
export const ApiBoardDetailSchema = z
  .object({
    boardId: Id,
    groupId: Id.optional(),
    title: z.string().min(1),
    content: z.string().optional(),
    startTime: NullableDateTimeString.optional(),
    endTime: NullableDateTimeString.optional(),
    problems: z.array(z.union([ApiProblemSchema, Id])).optional(),
  })
  .passthrough();

/**
 * Board progress returned from GET /groups/{groupId}/boards/{boardId}/userStatus
 */
export const ApiBoardProgressSchema = z
  .object({
    boardId: Id.optional(),
    problemStatus: z
      .array(
        z.object({
          problemId: Id,
          solvedUserIds: z.array(Id).optional(),
        }).passthrough(),
      )
      .optional(),
    userStatus: z
      .array(
        z.object({
          userId: Id,
          username: z.string().optional(),
          solvedProblemIds: z.array(Id).optional(),
          solvedCount: Int.optional(),
          totalCount: Int.optional(),
        }).passthrough(),
      )
      .optional(),
  })
  .passthrough();

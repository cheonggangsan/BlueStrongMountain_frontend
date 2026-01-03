/**
 * Query keys factory (stable, serializable).
 *
 * Tip: Always include requesterId when the server response can differ per user.
 */
export const groupKeys = {
  all: ["groups"],
  list: (options = {}) => [
    "groups",
    "list",
    {
      requesterId: options.requesterId ? Number(options.requesterId) : null,
      name: options.name ?? "",
    },
  ],
  detail: (groupId, requesterId) => [
    "groups",
    "detail",
    Number(groupId),
    requesterId ? Number(requesterId) : null,
  ],
  users: (groupId, requesterId) => [
    "groups",
    "users",
    Number(groupId),
    requesterId ? Number(requesterId) : null,
  ],
};

export const boardKeys = {
  all: ["boards"],
  list: (groupId) => ["boards", "list", Number(groupId)],
  detail: (groupId, boardId) => [
    "boards",
    "detail",
    Number(groupId),
    Number(boardId),
  ],
  userStatus: (groupId, boardId, requesterId) => [
    "boards",
    "userStatus",
    Number(groupId),
    Number(boardId),
    requesterId ? Number(requesterId) : null,
  ],
};

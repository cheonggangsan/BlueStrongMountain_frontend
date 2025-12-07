export const apiMode = {
  auth: import.meta.env.VITE_API_MODE_AUTH ?? "mock", // "mock" | "real"
  group: import.meta.env.VITE_API_MODE_GROUP ?? "mock",
  board: import.meta.env.VITE_API_MODE_BOARD ?? "mock",
  problem: import.meta.env.VITE_API_MODE_PROBLEM ?? "mock",
};

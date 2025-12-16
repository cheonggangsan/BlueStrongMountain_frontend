import { apiMode } from "@/config/apiMode";
import * as boardApi from "@/api/boardApi";
import {
  mockFetchBoards,
  mockFetchBoardById,
  mockCreateBoard,
  mockUpdateBoard,
  mockDeleteBoard,
} from "@/mocks/board.mock";
import { mockGetBoardUserStatus } from "@/mocks/boardUserStatus.mock";

const USE_MOCK_BOARD = apiMode.board === "mock";
const USE_MOCK_BOARD_STATUS = apiMode.boardStatus === "mock";

/** datetime-local 값(YYYY-MM-DDTHH:mm)을 API 예시(초 포함)로 맞춤 */
function toApiDateTime(v) {
  if (!v) return null;
  const s = String(v);
  if (s.length === 16) return `${s}:00`; // 2025-12-20T17:04 -> 2025-12-20T17:04:00
  if (s.length >= 19) return s.slice(0, 19); // 혹시 ms가 있어도 잘라줌
  return s;
}

/** API에서 내려온 endTime(초 포함)을 datetime-local용(분까지만)으로 맞춤 */
function toDatetimeLocal(v) {
  if (!v) return "";
  return String(v).slice(0, 16); // 2025-12-20T17:04:00 -> 2025-12-20T17:04
}

function nowDatetimeLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function mapBoardProgressFromApi(api) {
  return {
    boardId: api.boardId ?? null,
    problemStatus: (api.problemStatus || []).map((p) => ({
      problemId: p.problemId,
      solvedUsers: (p.solvedUserIds || []).map(Number),
    })),
    userStatus: (api.userStatus || []).map((u) => ({
      userId: u.userId,
      username: u.username ?? null,
      solvedProblems: (u.solvedProblemIds || []).map(Number),
    })),
  };
}

function mapBoardSummaryFromApi(apiBoard, groupIdFromArg) {
  return {
    id: apiBoard.boardId,
    groupId: groupIdFromArg ?? null, // 응답에 없으니 인자로 채워줌
    title: apiBoard.title,
    deadline: toDatetimeLocal(apiBoard.endTime),
    problemsCount: apiBoard.problemsCount ?? 0,
  };
}

function normalizeProblemSimpleDto(p) {
  if (p == null) return null;

  // 구버전: [1000, 1409] 같은 형태
  if (typeof p === "number" || typeof p === "string") {
    const id = Number(p);
    return Number.isFinite(id) ? { id } : null;
  }

  // 신버전(swagger): [{ id, title, difficulty }]
  const id = Number(p.id);
  return {
    id: Number.isFinite(id) ? id : null,
    title: p.title ?? null,
    difficulty: p.difficulty ?? null,
  };
}

function mapBoardDetailFromApi(apiBoard) {
  const problems = (apiBoard.problems || [])
    .map(normalizeProblemSimpleDto)
    .filter((p) => p && p.id != null);

  return {
    id: apiBoard.boardId,
    groupId: apiBoard.groupId ?? null,
    title: apiBoard.title,
    content: apiBoard.content ?? "",
    startTime: apiBoard.startTime ?? null,
    endTime: apiBoard.endTime ?? null,

    // ProblemBoard/BoardDetailView에서 쓰는 필드
    deadline: toDatetimeLocal(apiBoard.endTime),
    problems,
    problemsCount: problems.length,
  };
}

function buildCreateBodyFromBoard(board) {
  // board: { title, deadline, content?, problems: {id}[] ... }
  return {
    title: board.title,
    content: board.content ?? "",
    startTime: toApiDateTime(nowDatetimeLocal()),
    endTime: toApiDateTime(board.deadline),
    problemIds: (board.problems || []).map((p) => p.id),
  };
}

function buildUpdateBodyFromBoard(board) {
  return {
    title: board.title,
    endTime: toApiDateTime(board.deadline),
    problemIds: (board.problems || []).map((p) => p.id),
  };
}

export const boardService = {
  async fetchBoards(groupId, options) {
    if (USE_MOCK_BOARD) {
      return mockFetchBoards(groupId);
    }

    const apiBoards = await boardApi.fetchBoards(groupId, options);
    return apiBoards.map((b) => mapBoardSummaryFromApi(b, Number(groupId)));
  },

  async fetchBoardById(groupId, boardId) {
    if (USE_MOCK_BOARD) {
      return mockFetchBoardById(boardId);
    }

    const apiBoard = await boardApi.fetchBoardById(groupId, boardId);
    return mapBoardDetailFromApi(apiBoard);
  },

  async createBoard(board) {
    // board: { groupId, requesterId, title, deadline, content?, problems: [...] }
    if (USE_MOCK_BOARD) {
      // mock DB는 전체 보드 객체를 그대로 저장
      return mockCreateBoard(board);
    }

    const body = buildCreateBodyFromBoard(board);
    return boardApi.createBoard(board.groupId, board.requesterId, body);
  },

  async updateBoard(board) {
    // board: { id, groupId, requesterId, title, deadline, content?, problems: [...] }
    if (USE_MOCK_BOARD) {
      return mockUpdateBoard(board);
    }

    const body = buildUpdateBodyFromBoard(board);
    return boardApi.updateBoard(
      board.groupId,
      board.id,
      board.requesterId,
      body,
    );
  },

  async deleteBoard({ groupId, boardId, requesterId }) {
    if (USE_MOCK_BOARD) {
      return mockDeleteBoard(boardId);
    }

    return boardApi.deleteBoard(groupId, boardId, requesterId);
  },

  async getBoardUserStatus({ groupId, boardId, requesterId }) {
    if (USE_MOCK_BOARD_STATUS) {
      return mockGetBoardUserStatus(groupId, boardId);
    }

    const apiRes = await boardApi.getBoardUserStatus({
      groupId,
      boardId,
      requesterId,
    });
    return mapBoardProgressFromApi(apiRes);
  },
};

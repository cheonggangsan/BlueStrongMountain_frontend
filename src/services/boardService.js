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

export const boardService = {
  async fetchBoards(groupId) {
    if (USE_MOCK_BOARD) {
      return mockFetchBoards(groupId);
    }
    return boardApi.fetchBoards(groupId);
  },

  async fetchBoardById(boardId) {
    if (USE_MOCK_BOARD) {
      return mockFetchBoardById(boardId);
    }
    return boardApi.fetchBoardById(boardId);
  },

  async createBoard(board) {
    if (USE_MOCK_BOARD) {
      return mockCreateBoard(board);
    }
    return boardApi.createBoard(board);
  },

  async updateBoard(updatedBoard) {
    if (USE_MOCK_BOARD) {
      return mockUpdateBoard(updatedBoard);
    }
    const { id, ...payload } = updatedBoard;
    return boardApi.updateBoard(id, payload);
  },

  async deleteBoard(boardId) {
    if (USE_MOCK_BOARD) {
      return mockDeleteBoard(boardId);
    }
    return boardApi.deleteBoard(boardId);
  },

  async getBoardUserStatus(groupId, boardId) {
    if (USE_MOCK_BOARD) {
      return mockGetBoardUserStatus(groupId, boardId);
    }
    return boardApi.getBoardUserStatus(groupId, boardId);
  },
};

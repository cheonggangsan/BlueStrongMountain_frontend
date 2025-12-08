import { ref } from "vue";
import { boardService } from "../services/boardService";

export const boards = ref([]);

/**
 * 그룹 ID에 해당하는 보드 목록을 가져옵니다.
 */
export async function fetchBoards(groupId) {
  const list = await boardService.fetchBoards(groupId);
  boards.value = [...list];
  return boards.value;
}

/**
 * 새 보드를 추가합니다.
 * - 기존 addBoard 이름을 유지 (호출부 영향 최소화)
 */
export async function addBoard(board) {
  const newBoard = await boardService.createBoard(board);
  boards.value = [newBoard, ...boards.value];
  return newBoard;
}

/**
 * 보드를 삭제합니다.
 */
export async function deleteBoard(boardId) {
  await boardService.deleteBoard(boardId);
  const numericId = Number(boardId);
  boards.value = boards.value.filter((b) => b.id !== numericId);
}

/**
 * 보드를 수정합니다.
 */
export async function updateBoard(updatedBoard) {
  const updated = await boardService.updateBoard(updatedBoard);

  const index = boards.value.findIndex((b) => b.id == updated.id);
  if (index !== -1) {
    boards.value.splice(index, 1, updated);
  }

  return updated;
}

/**
 * 특정 보드의 상세 정보를 가져옵니다.
 */
export async function fetchBoardById(boardId) {
  return boardService.fetchBoardById(boardId);
}

/**
 * 보드별 유저 풀이 현황 조회
 */
export async function getBoardUserStatus(groupId, boardId) {
  return boardService.getBoardUserStatus(groupId, boardId);
}

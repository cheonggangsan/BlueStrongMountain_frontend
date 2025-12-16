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
 *
 * board:
 *  - groupId: number
 *  - requesterId: number
 *  - title: string
 *  - deadline?: string (datetime-local 값)
 *  - content?: string
 *  - problems: { id: number, ... }[]
 */
export async function addBoard(board) {
  await boardService.createBoard(board);
}

/**
 * 보드를 삭제합니다.
 *
 * params:
 *  - groupId: number
 *  - boardId: number
 *  - requesterId: number
 */
export async function deleteBoard({ groupId, boardId, requesterId }) {
  await boardService.deleteBoard({ groupId, boardId, requesterId });

  const numericId = Number(boardId);
  boards.value = boards.value.filter((b) => b.id !== numericId);
}

/**
 * 보드를 수정합니다.
 *
 * board:
 *  - id: number
 *  - groupId: number
 *  - requesterId: number
 *  - title: string
 *  - deadline?: string
 *  - content?: string
 *  - problems: { id: number, ... }[]
 */
export async function updateBoard(board) {
  await boardService.updateBoard(board);

  const numericId = Number(board.id);
  const index = boards.value.findIndex((b) => b.id === numericId);

  if (index !== -1) {
    boards.value.splice(index, 1, {
      ...boards.value[index],
      ...board,
    });
  }
}

/**
 * 특정 보드의 상세 정보를 가져옵니다.
 */
export async function fetchBoardById(groupId, boardId) {
  return boardService.fetchBoardById(groupId, boardId);
}

/**
 * 보드별 유저 풀이 현황 조회
 */
export async function getBoardUserStatus(groupId, boardId) {
  return boardService.getBoardUserStatus(groupId, boardId);
}

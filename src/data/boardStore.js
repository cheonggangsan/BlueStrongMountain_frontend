import { ref } from "vue";

export const boards = ref([]);

// 새 보드를 목록 맨 앞에 추가
export function addBoard(board) {
  boards.value = [board, ...boards.value];
}

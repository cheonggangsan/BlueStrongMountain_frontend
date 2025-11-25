import { ref } from "vue";

export const boards = ref([]); // 처음엔 빈 배열

// [테스트용 날짜 생성 함수]
const getDateStr = (diffDays) => {
  const date = new Date();
  date.setDate(date.getDate() + diffDays);
  return date.toISOString().split("T")[0];
};

// 백엔드에서 받아올 데이터라고 가정 (DB 역할)
const MOCK_DB_DATA = [
  { id: 1, title: "Vue.js 프론트엔드 뽀개기", deadline: getDateStr(7), problemsCount: 15 },
  { id: 2, title: "알고리즘 코딩테스트 대비반", deadline: getDateStr(30), problemsCount: 52 },
  { id: 3, title: "자유 주제 아이디어 보드", deadline: null, problemsCount: 3 },
  { id: 4, title: "2023년 상반기 회고", deadline: getDateStr(-100), problemsCount: 8 },
  { id: 5, title: "지난주 CS 스터디 (네트워크)", deadline: getDateStr(-3), problemsCount: 20 },
  { id: 6, title: "사내 해커톤 프로젝트", deadline: getDateStr(1), problemsCount: 0 },
  { id: 7, title: "리액트 vs 뷰 비교 분석", deadline: getDateStr(-1), problemsCount: 5 },
];

const LOCAL_DB = ref(MOCK_DB_DATA);

// --- Actions (API 호출 함수) ---

/**
 * GET /api/v1/groups/{groupsId}/
 * 그룹 ID에 해당하는 보드 목록을 가져옵니다.
 */
export async function fetchBoards(groupId) {
  // 실제 API 호출이라면 아래와 같을 것입니다:
  // const response = await axios.get(`/api/v1/groups/${groupId}/`);
  // boards.value = response.data;

  // [Mocking] 0.5초 뒤에 데이터를 받아온 척 합니다.
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[API Mock] 그룹 ID ${groupId}의 보드 목록 조회 성공`);
      boards.value = [...LOCAL_DB.value]; // 데이터를 Store에 채움
      resolve(boards.value);
    }, 500); // 0.5초 딜레이
  });
}

export function addBoard(board) {
  if (!board.id) board.id = Date.now();
  LOCAL_DB.value = [board, ...LOCAL_DB.value];
  console.log("추가!!!");
  // 실제론: await axios.post('/api/v1/boards', board);
}

export function deleteBoard(id) {
  LOCAL_DB.value = LOCAL_DB.value.filter((board) => board.id !== id);
  // 실제론: await axios.delete(`/api/v1/boards/${id}`);
}

export function updateBoard(updatedBoard) {
  const index = LOCAL_DB.value.findIndex((b) => b.id === updatedBoard.id);
  if (index !== -1) {
    LOCAL_DB.value[index] = updatedBoard;
  }
}

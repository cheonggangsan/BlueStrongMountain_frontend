import { ref } from "vue";
import { MOCK_PROBLEMS } from "/src/api/problemApi";

export const boards = ref([]); // 처음엔 빈 배열

// [테스트용 날짜 생성 함수]
const getDateStr = (diffDays) => {
  const date = new Date();
  date.setDate(date.getDate() + diffDays);
  return date.toISOString().split(".")[0];
  // return date.toISOString().split("T")[0];
};

const MOCK_DB_DATA_WITH_PROBLEMS = [
  {
    id: 1,
    title: "Vue.js 프론트엔드 뽀개기",
    deadline: getDateStr(7),
    // MOCK_PROBLEMS에서 3개 문제의 상세 정보를 할당
    problems: [MOCK_PROBLEMS[0], MOCK_PROBLEMS[1], MOCK_PROBLEMS[2]],
    problemsCount: 3, // problems 배열의 길이와 일치
  },
  {
    id: 2,
    title: "알고리즘 코딩테스트 대비반",
    deadline: getDateStr(30),
    // MOCK_PROBLEMS에서 4개 문제의 상세 정보를 할당
    problems: [
      MOCK_PROBLEMS[3],
      MOCK_PROBLEMS[4],
      MOCK_PROBLEMS[5],
      MOCK_PROBLEMS[6],
    ],
    problemsCount: 4,
  },
  {
    id: 3,
    title: "자유 주제 아이디어 보드",
    deadline: null,
    problems: [MOCK_PROBLEMS[7], MOCK_PROBLEMS[8], MOCK_PROBLEMS[9]],
    problemsCount: 3,
  },
  {
    id: 4,
    title: "2023년 상반기 회고",
    deadline: getDateStr(-100),
    problems: [MOCK_PROBLEMS[10], MOCK_PROBLEMS[11]],
    problemsCount: 2,
  },
  {
    id: 5,
    title: "지난주 CS 스터디 (네트워크)",
    deadline: getDateStr(-3),
    problems: [MOCK_PROBLEMS[12]],
    problemsCount: 1,
  },
  {
    id: 6,
    title: "사내 해커톤 프로젝트",
    deadline: getDateStr(1),
    problems: [],
    problemsCount: 0,
  },
  {
    id: 7,
    title: "리액트 vs 뷰 비교 분석",
    deadline: getDateStr(-1),
    problems: [MOCK_PROBLEMS[13], MOCK_PROBLEMS[14]],
    problemsCount: 2,
  },
];

const LOCAL_DB = ref(MOCK_DB_DATA_WITH_PROBLEMS);

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
  // 🚨 problemsCount를 problems 배열의 길이로 설정
  const newBoard = {
    ...board,
    problemsCount: board.problems ? board.problems.length : 0,
  };
  LOCAL_DB.value = [newBoard, ...LOCAL_DB.value];
  console.log("새 보드 추가 완료. LOCAL_DB에 반영됨.");
}

export function deleteBoard(id) {
  LOCAL_DB.value = LOCAL_DB.value.filter((board) => board.id !== id);
  // 실제론: await axios.delete(`/api/v1/boards/${id}`);
}

/**
 * PUT /api/v1/boards/{boardId}
 * 보드를 수정하고 localDB에 반영합니다.
 */
export function updateBoard(updatedBoard) {
  const index = LOCAL_DB.value.findIndex((b) => b.id == updatedBoard.id);
  if (index !== -1) {
    LOCAL_DB.value[index] = {
      ...LOCAL_DB.value[index],
      ...updatedBoard,
      // 🚨 problemsCount 갱신
      problemsCount: updatedBoard.problems ? updatedBoard.problems.length : 0,
    };
    console.log(`[Mock DB] 보드 ID ${updatedBoard.id} 수정 완료.`);
  } else {
    console.error(
      `수정할 보드 ID ${updatedBoard.id}를 localDB에서 찾을 수 없습니다.`,
    );
  }
}

/**
 * GET /api/v1/boards/{boardId}
 * 특정 보드의 상세 정보를 가져옵니다. (Mocking)
 */
export async function fetchBoardById(id) {
  // 실제 DB 역할을 하는 LOCAL_DB에서 해당 ID를 찾습니다.
  const board = LOCAL_DB.value.find((b) => b.id == id); // == 비교는 ID가 숫자/문자 혼용될 경우를 대비

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (board) {
        console.log(`[API Mock] 보드 ID ${id}의 상세 정보 조회 성공`);
        resolve(board);
      } else {
        console.error(`[API Mock] 보드 ID ${id}를 찾을 수 없습니다.`);
        reject(new Error("Board Not Found"));
      }
    }, 300);
  });
}

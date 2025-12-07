// 보드별 유저 풀이 현황 mock
// key: `${groupId}:${boardId}`
//
// 그룹 구조 참고
// Group 1: owner = 1764919478917, managers = [1, 1764919478917], members = [2,3,4,5]
// Group 2: owner = 2, managers = [2], members = [3,4,5,1764919478917]
// Group 3: owner = 3, managers = [3,1764919478917], members = [4,5,6,7,8]

const MOCK_STATUS_BY_BOARD = {
  // ======================
  // Group 1 - Board 1
  // Vue.js 프론트엔드 뽀개기
  // problems: [1409, 1508, 1000]
  // 참여 유저(예시): 1764919478917(소유자), 1,2,3,4,5
  // ======================
  "1:1": {
    problemStatus: [
      {
        problemId: 1409,
        solvedUsers: [1, 3, 1764919478917], // 김청강, 달피곰, 소유자
      },
      {
        problemId: 1508,
        solvedUsers: [1, 5], // 김청강, 정프론트, 카카카
      },
      {
        problemId: 1000,
        solvedUsers: [2, 3], // 이알고, 달피곰, 카카카
      },
    ],
    userStatus: [
      {
        userId: 1764919478917, // 현재 로그인 유저(가정)
        solvedProblems: [1409],
      },
      {
        userId: 1,
        solvedProblems: [1409, 1508],
      },
      {
        userId: 2,
        solvedProblems: [1000],
      },
      {
        userId: 3,
        solvedProblems: [1409, 1000],
      },
      {
        userId: 4,
        solvedProblems: [],
      },
      {
        userId: 5,
        solvedProblems: [1508],
      },
    ],
  },

  // ======================
  // Group 1 - Board 2
  // 알고리즘 코딩테스트 대비반
  // problems: [1001, 1002, 1003, 1004]
  // 동일 유저풀이 구조 + 카카카/소유자 포함
  // ======================
  "1:2": {
    problemStatus: [
      {
        problemId: 1001,
        solvedUsers: [1, 3, 5],
      },
      {
        problemId: 1002,
        solvedUsers: [1, 2, 5],
      },
      {
        problemId: 1003,
        solvedUsers: [2, 5],
      },
      {
        problemId: 1004,
        solvedUsers: [3, 1764919478917],
      },
    ],
    userStatus: [
      {
        userId: 1764919478917,
        solvedProblems: [1004],
      },
      {
        userId: 1,
        solvedProblems: [1001, 1002],
      },
      {
        userId: 2,
        solvedProblems: [1002, 1003],
      },
      {
        userId: 3,
        solvedProblems: [1001, 1004],
      },
      {
        userId: 4,
        solvedProblems: [],
      },
      {
        userId: 5,
        solvedProblems: [1001, 1002, 1003],
      },
    ],
  },

  // ======================
  // Group 1 - Board 7
  // 리액트 vs 뷰 비교 분석
  // problems: [2004, ...] 라고 가정하고 2004만 사용
  // ======================
  "1:7": {
    problemStatus: [
      {
        problemId: 2004,
        solvedUsers: [1, 2, 5, 1764919478917],
      },
    ],
    userStatus: [
      {
        userId: 1764919478917,
        solvedProblems: [2004],
      },
      {
        userId: 1,
        solvedProblems: [2004],
      },
      {
        userId: 2,
        solvedProblems: [2004],
      },
      {
        userId: 3,
        solvedProblems: [],
      },
      {
        userId: 4,
        solvedProblems: [],
      },
      {
        userId: 5,
        solvedProblems: [2004],
      },
    ],
  },

  // ======================
  // Group 2 - Board 3
  // 자유 주제 아이디어 보드
  // problems: [1005, 1006, 1007]
  // 그룹 2 참여자: 2(소유자),3,4,5,1764919478917
  // 여기에 카카카도 끼워서 테스트용으로 포함
  // ======================
  "2:3": {
    problemStatus: [
      {
        problemId: 1005,
        solvedUsers: [2, 3],
      },
      {
        problemId: 1006,
        solvedUsers: [3, 4],
      },
      {
        problemId: 1007,
        solvedUsers: [4, 5, 1764919478917],
      },
    ],
    userStatus: [
      {
        userId: 2,
        solvedProblems: [1005],
      },
      {
        userId: 3,
        solvedProblems: [1005, 1006],
      },
      {
        userId: 4,
        solvedProblems: [1006, 1007],
      },
      {
        userId: 5,
        solvedProblems: [1007],
      },
      {
        userId: 1764919478917,
        solvedProblems: [1007],
      },
    ],
  },

  // ======================
  // Group 2 - Board 4
  // 2023년 상반기 회고
  // problems: [1008, 1009]
  // ======================
  "2:4": {
    problemStatus: [
      {
        problemId: 1009,
        solvedUsers: [3, 4, 1764919478917],
      },
    ],
    userStatus: [
      {
        userId: 2,
        solvedProblems: [1008],
      },
      {
        userId: 3,
        solvedProblems: [1009],
      },
      {
        userId: 4,
        solvedProblems: [1008, 1009],
      },
      {
        userId: 5,
        solvedProblems: [],
      },
      {
        userId: 1764919478917,
        solvedProblems: [1009],
      },
    ],
  },

  // ======================
  // Group 3 - Board 5
  // 지난주 CS 스터디 (네트워크)
  // problems: [2000]
  // 그룹 3 참여자: 3(소유자), 4,5,6,7,8, 1764919478917(매니저)
  // + 카카카 포함
  // ======================
  "3:5": {
    problemStatus: [
      {
        problemId: 2000,
        solvedUsers: [3, 4, 5, 6, 1764919478917],
      },
    ],
    userStatus: [
      {
        userId: 3,
        solvedProblems: [2000],
      },
      {
        userId: 4,
        solvedProblems: [2000],
      },
      {
        userId: 5,
        solvedProblems: [2000],
      },
      {
        userId: 6,
        solvedProblems: [2000],
      },
      {
        userId: 7,
        solvedProblems: [],
      },
      {
        userId: 8,
        solvedProblems: [],
      },
      {
        userId: 1764919478917,
        solvedProblems: [2000],
      },
    ],
  },

  // ======================
  // Group 3 - Board 6
  // 사내 해커톤 프로젝트 (문제 없음)
  // ======================
  "3:6": {
    problemStatus: [],
    userStatus: [
      { userId: 3, solvedProblems: [] },
      { userId: 4, solvedProblems: [] },
      { userId: 5, solvedProblems: [] },
      { userId: 6, solvedProblems: [] },
      { userId: 7, solvedProblems: [] },
      { userId: 8, solvedProblems: [] },
      { userId: 1764919478917, solvedProblems: [] },
      { userId: 1764863505459, solvedProblems: [] },
    ],
  },
};

// 기본 fallback (보드/그룹 매칭 안 될 때)
const DEFAULT_STATUS = {
  problemStatus: [],
  userStatus: [],
};

// 실제 mock 함수
export async function mockGetBoardUserStatus(groupId, boardId) {
  const key = `${Number(groupId)}:${Number(boardId)}`;
  console.log("[Mock] getBoardUserStatus called:", { key });

  return new Promise((resolve) => {
    setTimeout(() => {
      const data = MOCK_STATUS_BY_BOARD[key] || DEFAULT_STATUS;
      resolve({
        boardId: Number(boardId),
        problemStatus: data.problemStatus,
        userStatus: data.userStatus,
      });
    }, 300); // 약간의 딜레이
  });
}

import { ref } from "vue";

export const MOCK_MEMBERS = [
  { id: 1, name: "김청강", nickname: "cheonggang" },
  { id: 2, name: "이알고", nickname: "algoLee" },
  { id: 3, name: "달피곰", nickname: "baekjoonPark" },
  { id: 4, name: "집에갈랴요", nickname: "campChoi" },
  { id: 5, name: "정프론트", nickname: "frontendJung" },
  { id: 6, name: "한백엔드", nickname: "backendHan" },
  { id: 7, name: "오데브옵스", nickname: "devopsOh" },
  { id: 8, name: "박백엔드", nickname: "backendHan" },
  { id: 9, name: "엔드류", nickname: "devopsOh" },
  { id: 10, name: "스크류", nickname: "backendHan" },
  { id: 11, name: "볼트", nickname: "devopsOh" },
  { id: 12, name: "썬더", nickname: "backendHan" },
  { id: 13, name: "최캠프", nickname: "devopsOh" },
];

export const members = ref([...MOCK_MEMBERS]);

// 🔍 멤버 검색 (Mock)
// 실제 백엔드 붙이면 여기서 GET /api/v1/users?query=... 같은 걸 호출하면 됨.
export async function searchMembers(keyword) {
  const q = keyword.trim().toLowerCase();

  return new Promise((resolve) => {
    setTimeout(() => {
      if (!q) {
        // 검색어 없으면 상위 10명만
        resolve(members.value.slice(0, 10));
      } else {
        resolve(
          members.value.filter(
            (m) =>
              m.name.toLowerCase().includes(q) ||
              (m.nickname && m.nickname.toLowerCase().includes(q)),
          ),
        );
      }
    }, 200);
  });
}

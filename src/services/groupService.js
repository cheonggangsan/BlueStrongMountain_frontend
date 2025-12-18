import { apiMode } from "@/config/apiMode";
import * as groupApi from "@/api/groupApi";
import {
  mockFetchGroups,
  mockLeaveGroup,
  mockCreateGroup,
  mockFetchGroupById,
  mockUpdateGroup,
  mockChangeGroupOwner,
} from "@/mocks/group.mock";

const USE_MOCK_GROUP = apiMode.group === "mock";

const toNumArr = (arr) => (Array.isArray(arr) ? arr.map((v) => Number(v)) : []);
const uniqNums = (arr) =>
  Array.from(new Set(toNumArr(arr))).filter((n) => Number.isFinite(n));

export function mapGroupDetailFromApi(api) {
  return {
    id: api.id,
    name: api.title ?? api.name ?? "",
    description: api.description ?? "",
    ownerId: api.ownerId != null ? Number(api.ownerId) : null,
    managerIds: toNumArr(api.managers ?? api.managerIds),
    memberIds: toNumArr(api.members ?? api.memberIds),
    visibility: api.visibility ?? "PRIVATE",
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
  };
}

export const groupService = {
  /**
   * 그룹 목록 조회
   * @param {{ requesterId?: number, name?: string }} options
   */
  async fetchGroups(options = {}) {
    if (USE_MOCK_GROUP) {
      // mock에서는 requesterId 없이도 동작
      return mockFetchGroups();
    }

    const { requesterId, name } = options;
    if (!requesterId) {
      throw new Error(
        "groupService.fetchGroups: real 모드에서는 requesterId가 필요합니다.",
      );
    }

    // GroupSummaryResponse[]
    const list = await groupApi.fetchGroups({ requesterId, name });

    // FE에서 쓰기 좋은 형태로 매핑
    return list.map((g) => ({
      id: g.id,
      name: g.title, // title -> name
      ownerId: g.ownerId,
      visibility: g.visibility,
      memberCount: g.memberCount,
      groupRole: g.groupRole ?? null,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      description: g.description ?? "",
    }));
  },

  /**
   * 그룹 탈퇴 (현재 로그인 유저 기준)
   */
  async leaveGroup(groupId, options = {}) {
    if (USE_MOCK_GROUP) {
      return mockLeaveGroup(groupId);
    }

    const { requesterId } = options;
    if (!requesterId) {
      throw new Error(
        "groupService.leaveGroup: real 모드에서는 requesterId가 필요합니다.",
      );
    }

    const result = await groupApi.leaveGroup({ groupId, requesterId });

    if (result && typeof result === "object" && "success" in result) {
      if (!result.success) {
        throw new Error("그룹 탈퇴에 실패했습니다.");
      }
    }

    return result;
  },

  /**
   * 그룹 생성
   * payload 예시:
   * {
   *   requesterId: number,
   *   title: string,
   *   managerIds: number[],
   *   memberIds: number[],
   *   visibility: string,
   *   description: string
   * }
   */
  async createGroup(payload) {
    if (USE_MOCK_GROUP) {
      return mockCreateGroup(payload);
    }

    const { requesterId, ...body } = payload || {};
    if (!requesterId) {
      throw new Error(
        "groupService.createGroup: real 모드에서는 payload.requesterId가 필요합니다.",
      );
    }

    const result = await groupApi.createGroup({ requesterId, ...body });

    if (result && typeof result === "object" && "success" in result) {
      if (!result.success) {
        // 필요하다면 result.message 같은 필드를 읽어서 더 구체적인 에러로 던져도 됨
        throw new Error("스터디 그룹 생성에 실패했습니다.");
      }
    }

    return result;
  },

  /**
   * 그룹 상세 조회
   * - mock: 전체 정보
   * - real: GET /api/v1/groups/{groupId}/detail
   */
  async fetchGroupById(groupId, options = {}) {
    if (USE_MOCK_GROUP) {
      // mock에서는 requesterId 필요 없음
      return mockFetchGroupById(groupId);
    }

    const { requesterId } = options;
    if (!requesterId) {
      throw new Error(
        "groupService.fetchGroupById: real 모드에서는 requesterId가 필요합니다.",
      );
    }

    const apiGroup = await groupApi.fetchGroupById(groupId, { requesterId });
    return mapGroupDetailFromApi(apiGroup);
  },

  /**
   * 그룹 수정
   * payload 예시:
   * {
   *   requesterId: number,
   *   title?: string,
   *   visibility?: string,
   *   description?: string,
   *   managerIds?: number[],
   *   memberIds?: number[],
   * }
   */
  async updateGroup(groupId, payload) {
    if (USE_MOCK_GROUP) {
      return mockUpdateGroup(groupId, payload);
    }

    const { requesterId, ...body } = payload || {};
    if (!requesterId) {
      throw new Error(
        "groupService.updateGroup: real 모드에서는 payload.requesterId가 필요합니다.",
      );
    }

    const managerIds = uniqNums(body.managerIds);
    const memberIds = uniqNums(body.memberIds).filter(
      (id) => !managerIds.includes(id),
    );

    const result = await groupApi.updateGroup({
      groupId,
      requesterId,
      title: body.title,
      visibility: body.visibility,
      description: body.description,
      managerIds,
      memberIds,
    });

    if (result && typeof result === "object" && "success" in result) {
      if (!result.success) throw new Error("그룹 수정에 실패했습니다.");

      const updated = await groupApi.fetchGroupById(groupId, { requesterId });
      return mapGroupDetailFromApi(updated);
    }

    return result;
  },

  /**
   * 그룹 소유자 변경
   * @param {{ requesterId: number, newOwnerId: number }} params
   */
  async changeGroupOwner(groupId, { requesterId, newOwnerId }) {
    if (USE_MOCK_GROUP) {
      return mockChangeGroupOwner(groupId, { requesterId, newOwnerId });
    }

    if (!requesterId) {
      throw new Error(
        "groupService.changeGroupOwner: real 모드에서는 requesterId가 필요합니다.",
      );
    }

    const result = await groupApi.changeGroupOwner({
      groupId,
      requesterId,
      newOwnerId,
    });

    // Swagger 상 BasicResponse { success: boolean }
    if (result && typeof result === "object" && "success" in result) {
      if (!result.success) {
        throw new Error("소유자 변경에 실패했습니다.");
      }

      const updated = await groupApi.fetchGroupById(groupId, { requesterId });
      return mapGroupDetailFromApi(updated);
    }

    return result;
  },

  /**
   * 그룹 사용자 목록 조회
   * @param {number} groupId
   * @param {{ requesterId: number }} options
   * @return {Promise<Array<{id: number, name: string, nickname: string, role: string}>>}
   */
  async fetchGroupUsers(groupId, options = {}) {
    if (USE_MOCK_GROUP) {
      // TODO: mock은 fetchInitialMembers를 쓰도록 변경 필요
      return [];
    }

    const { requesterId } = options;
    if (!requesterId) {
      throw new Error(
        "groupService.fetchGroupUsers: requesterId가 필요합니다.",
      );
    }

    const list = await groupApi.fetchGroupUsers(groupId, { requesterId });

    return (list || []).map((u) => ({
      id: Number(u.userId),
      name: u.username,
      nickname: u.username, // email 표시로 UI 개선 가능
      role: u.role, // OWNER | MANAGER | MEMBER
    }));
  },
};

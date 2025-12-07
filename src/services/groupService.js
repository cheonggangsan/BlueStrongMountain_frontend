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

export const groupService = {
  async fetchGroups() {
    if (USE_MOCK_GROUP) {
      return mockFetchGroups();
    }
    return groupApi.fetchGroups();
  },

  async leaveGroup(groupId) {
    if (USE_MOCK_GROUP) {
      return mockLeaveGroup(groupId);
    }
    return groupApi.leaveGroup(groupId);
  },

  async createGroup(payload) {
    if (USE_MOCK_GROUP) {
      return mockCreateGroup(payload);
    }
    return groupApi.createGroup(payload);
  },

  async fetchGroupById(groupId) {
    if (USE_MOCK_GROUP) {
      return mockFetchGroupById(groupId);
    }
    return groupApi.fetchGroupById(groupId);
  },

  async updateGroup(groupId, payload) {
    if (USE_MOCK_GROUP) {
      return mockUpdateGroup(groupId, payload);
    }
    return groupApi.updateGroup(groupId, payload);
  },

  async changeGroupOwner(groupId, { requesterId, newOwnerId }) {
    if (USE_MOCK_GROUP) {
      return mockChangeGroupOwner(groupId, { requesterId, newOwnerId });
    }
    return groupApi.changeGroupOwner(groupId, { requesterId, newOwnerId });
  },
};

import { apiMode } from "@/config/apiMode";
import * as problemApi from "@/api/problemApi";
import {
  searchByNumber as mockSearchByNumber,
  searchWithConditions as mockSearchWithConditions,
  postBoard as mockPostBoard,
} from "@/mocks/problem.mock";

const USE_MOCK_PROBLEM = apiMode.problem === "mock";

export const problemService = {
  async searchByNumber(problemNo) {
    if (USE_MOCK_PROBLEM) {
      return mockSearchByNumber(problemNo);
    }
    return problemApi.searchByNumber(problemNo);
  },

  async searchWithConditions(params = {}) {
    if (USE_MOCK_PROBLEM) {
      return mockSearchWithConditions(params);
    }
    return problemApi.searchWithConditions(params);
  },

  async postBoard(payload) {
    if (USE_MOCK_PROBLEM) {
      return mockPostBoard(payload);
    }
    return problemApi.postBoard(payload);
  },
};

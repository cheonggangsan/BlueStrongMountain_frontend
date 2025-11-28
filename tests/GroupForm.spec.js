import { mount, flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import GroupForm from "../src/components/group/GroupForm.vue";

/**
 * 공통 헬퍼: 버튼 텍스트로 찾기
 */
function findButtonByText(wrapper, text) {
  return wrapper
    .findAll("button")
    .find((btn) => btn.text().trim().includes(text));
}

/**
 * memberStore 모킹
 * - GroupForm은 "../../data/memberStore" 를 import하지만,
 *   번들링 경로 기준으로 "../src/data/memberStore" 가 동일 모듈로 매핑됨
 */
vi.mock("../src/data/memberStore", () => {
  const members = { value: [] };
  const searchMembers = vi.fn();

  return {
    __esModule: true,
    members,
    searchMembers,
  };
});

// 모킹된 함수/변수 import
import { members, searchMembers } from "../src/data/memberStore";

const BASE_MEMBERS = [
  { id: 1, name: "김청강", nickname: "cheonggang" },
  { id: 2, name: "이알고", nickname: "algoLee" },
  { id: 3, name: "달피곰", nickname: "baekjoonPark" },
];

describe("GroupForm.vue", () => {
  beforeEach(() => {
    // 각 테스트마다 초기화
    members.value = [...BASE_MEMBERS];
    searchMembers.mockReset();
  });

  it("그룹 이름 / 설명 / 공개 범위를 입력 및 선택할 수 있다", async () => {
    const wrapper = mount(GroupForm, {
      props: {
        mode: "create",
        submitting: false,
      },
    });

    // 1. 그룹 이름 입력
    const titleInput = wrapper.find(
      'input[placeholder="예) 청강산 1기 알고리즘 캠프"]',
    );
    await titleInput.setValue("테스트 그룹");
    expect(titleInput.element.value).toBe("테스트 그룹");

    // 2. 설명 입력
    const descTextarea = wrapper.find(
      'textarea[placeholder="그룹 목적이나 진행 방식을 간단히 적어주세요."]',
    );
    await descTextarea.setValue("테스트 설명입니다.");
    expect(descTextarea.element.value).toBe("테스트 설명입니다.");

    // 3. 공개 범위 라디오 (PRIVATE / PUBLIC)
    const privateRadio = wrapper.find('input[type="radio"][value="PRIVATE"]');
    const publicRadio = wrapper.find('input[type="radio"][value="PUBLIC"]');

    // 기본값: PRIVATE
    expect(privateRadio.element.checked).toBe(true);
    expect(publicRadio.element.checked).toBe(false);

    // PUBLIC 클릭
    await publicRadio.setValue();
    expect(publicRadio.element.checked).toBe(true);
    expect(privateRadio.element.checked).toBe(false);
  });

  it("멤버 검색 후 결과 리스트가 렌더링되고 이름/닉네임/상태(추가)가 표시된다", async () => {
    // 검색 결과 mock
    searchMembers.mockResolvedValue([
      { id: 2, name: "이알고", nickname: "algoLee" },
      { id: 3, name: "달피곰", nickname: "baekjoonPark" },
    ]);

    const wrapper = mount(GroupForm, {
      props: { mode: "create" },
    });

    // 검색어 입력
    const searchInput = wrapper.find(
      'input[placeholder="이름 또는 닉네임으로 검색"]',
    );
    await searchInput.setValue("알고");

    // "검색" 버튼 클릭
    const searchButton = findButtonByText(wrapper, "검색");
    expect(searchButton).toBeTruthy();
    await searchButton.trigger("click");
    await flushPromises();

    // 왼쪽 검색 결과 영역 (border rounded-xl 중 첫 번째)
    const searchBox = wrapper.findAll("div.border.rounded-xl")[0];
    const resultItems = searchBox.findAll("li");
    expect(resultItems.length).toBe(2);

    const first = resultItems[0];
    expect(first.text()).toContain("이알고");
    expect(first.text()).toContain("@algoLee");
    // 오른쪽 상태 뱃지: 기본은 "추가"
    const statusBadge = first.find("span");
    expect(statusBadge.text()).toContain("추가");
  });

  it("멤버 검색 결과에서 클릭 시 선택됨/추가 상태와 오른쪽 선택된 멤버 영역이 동기화된다", async () => {
    // 검색 결과 mock (한 명만)
    searchMembers.mockResolvedValue([
      { id: 2, name: "이알고", nickname: "algoLee" },
    ]);

    const wrapper = mount(GroupForm, {
      props: { mode: "create" },
    });

    // 검색 수행
    await wrapper
      .find('input[placeholder="이름 또는 닉네임으로 검색"]')
      .setValue("이알고");
    const searchButton = findButtonByText(wrapper, "검색");
    await searchButton.trigger("click");
    await flushPromises();

    const listBoxes = wrapper.findAll("div.border.rounded-xl");
    const searchBox = listBoxes[0];
    const selectedBox = listBoxes[1];

    // 초기: 선택된 멤버 0명
    expect(selectedBox.text()).toContain("선택된 멤버 (0명)");

    const resultItem = searchBox.find("li");
    let badge = resultItem.find("span");
    expect(badge.text()).toContain("추가");

    // 1) 결과 클릭 → 선택됨 + 오른쪽에 추가
    await resultItem.trigger("click");
    await wrapper.vm.$nextTick();

    badge = resultItem.find("span");
    expect(badge.text()).toContain("선택됨");

    // 오른쪽 선택된 멤버 목록
    let selectedItems = selectedBox.findAll("li");
    expect(selectedItems.length).toBe(1);
    expect(selectedBox.text()).toContain("선택된 멤버 (1명)");
    expect(selectedItems[0].text()).toContain("이알고");

    // 2) 다시 결과 클릭 → 선택 해제 + 오른쪽에서 제거
    await resultItem.trigger("click");
    await wrapper.vm.$nextTick();

    badge = resultItem.find("span");
    expect(badge.text()).toContain("추가");

    selectedItems = selectedBox.findAll("li");
    expect(selectedItems.length).toBe(0);
    expect(selectedBox.text()).toContain("선택된 멤버 (0명)");
  });

  it("초기값(initialGroup) 기준으로 선택된 멤버/관리자 상태가 복원되고, 관리자 토글 버튼이 동작한다", async () => {
    // members.value 에 BASE_MEMBERS가 이미 들어있다고 가정
    // initialGroup: 관리자 1번, 멤버는 1,2
    const wrapper = mount(GroupForm, {
      props: {
        mode: "edit",
        initialGroup: {
          title: "수정용 그룹",
          description: "기존 설명",
          visibility: "PUBLIC",
          managerIds: [1],
          memberIds: [1, 2],
        },
      },
    });

    await flushPromises();

    const listBoxes = wrapper.findAll("div.border.rounded-xl");
    const selectedBox = listBoxes[1];

    // 오른쪽 선택된 멤버: 2명
    const selectedItems = selectedBox.findAll("li");
    expect(selectedItems.length).toBe(2);

    // id=1: 관리자, id=2: 일반 멤버
    const managerItem = selectedItems.find((li) =>
      li.text().includes("김청강"),
    );
    const normalItem = selectedItems.find((li) => li.text().includes("이알고"));

    expect(managerItem.text()).toContain("관리자");
    expect(normalItem.text()).toContain("관리자로 지정");

    // 일반 멤버를 관리자 지정
    const normalManagerBtn = findButtonByText(normalItem, "관리자로 지정");
    await normalManagerBtn.trigger("click");
    await wrapper.vm.$nextTick();
    expect(normalItem.text()).toContain("관리자");

    // 기존 관리자(김청강)를 일반 멤버로 변경
    const managerBtn = findButtonByText(managerItem, "관리자");
    await managerBtn.trigger("click");
    await wrapper.vm.$nextTick();
    expect(managerItem.text()).toContain("관리자로 지정");
  });

  it("선택된 멤버의 X 버튼을 누르면 오른쪽 목록에서 제거되고, 왼쪽 검색 결과 뱃지가 '추가'로 돌아간다", async () => {
    // 검색 결과 mock
    searchMembers.mockResolvedValue([
      { id: 2, name: "이알고", nickname: "algoLee" },
    ]);

    const wrapper = mount(GroupForm, {
      props: { mode: "create" },
    });

    // 검색 수행
    await wrapper
      .find('input[placeholder="이름 또는 닉네임으로 검색"]')
      .setValue("이알고");
    const searchButton = findButtonByText(wrapper, "검색");
    await searchButton.trigger("click");
    await flushPromises();

    const listBoxes = wrapper.findAll("div.border.rounded-xl");
    const searchBox = listBoxes[0];
    const selectedBox = listBoxes[1];

    const resultItem = searchBox.find("li");
    await resultItem.trigger("click"); // 선택
    await wrapper.vm.$nextTick();

    // 오른쪽에 1명 존재
    let selectedItems = selectedBox.findAll("li");
    expect(selectedItems.length).toBe(1);

    // X 버튼 클릭
    const xButton = findButtonByText(wrapper, "✕");
    expect(xButton).toBeTruthy();
    await xButton.trigger("click");
    await wrapper.vm.$nextTick();

    // 오른쪽에서 제거
    selectedItems = selectedBox.findAll("li");
    expect(selectedItems.length).toBe(0);

    // 왼쪽 뱃지는 "추가"
    const badge = resultItem.find("span");
    expect(badge.text()).toContain("추가");
  });

  it("취소 버튼을 누르면 cancel 이벤트를 emit 한다", async () => {
    const wrapper = mount(GroupForm, {
      props: { mode: "create" },
    });

    const cancelButton = findButtonByText(wrapper, "취소");
    expect(cancelButton).toBeTruthy();

    await cancelButton.trigger("click");

    const emits = wrapper.emitted("cancel");
    expect(emits).toBeTruthy();
    expect(emits.length).toBe(1);
  });

  it("유효성 검사: 제목/멤버/관리자가 설정되지 않으면 제출 버튼이 비활성화되고, 조건 충족 시 활성화 + 올바른 payload로 submit emit", async () => {
    // 검색 결과 mock
    searchMembers.mockResolvedValue([
      { id: 2, name: "이알고", nickname: "algoLee" },
    ]);

    const wrapper = mount(GroupForm, {
      props: { mode: "create", submitting: false },
    });

    const submitButton = findButtonByText(wrapper, "스터디 그룹 생성");
    expect(submitButton).toBeTruthy();

    // 초기: disabled
    expect(submitButton.attributes("disabled")).toBeDefined();

    // 1. 제목만 입력
    await wrapper
      .find('input[placeholder="예) 청강산 1기 알고리즘 캠프"]')
      .setValue("유효한 제목");
    await wrapper.vm.$nextTick();
    expect(submitButton.attributes("disabled")).toBeDefined();

    // 2. 멤버 검색 & 선택 (하지만 아직 관리자로 지정하지 않음)
    await wrapper
      .find('input[placeholder="이름 또는 닉네임으로 검색"]')
      .setValue("이알고");
    const searchButton = findButtonByText(wrapper, "검색");
    await searchButton.trigger("click");
    await flushPromises();

    const searchBox = wrapper.findAll("div.border.rounded-xl")[0];
    const resultItem = searchBox.find("li");
    await resultItem.trigger("click"); // 선택됨 (isManager=false)
    await wrapper.vm.$nextTick();

    // 여전히 disabled (관리자 없음)
    expect(submitButton.attributes("disabled")).toBeDefined();

    // 3. 선택된 멤버를 관리자 지정
    const selectedBox = wrapper.findAll("div.border.rounded-xl")[1];
    const selectedItem = selectedBox.find("li");
    const managerBtn = findButtonByText(selectedItem, "관리자로 지정");
    await managerBtn.trigger("click");
    await wrapper.vm.$nextTick();

    // 이제 버튼 활성화
    expect(submitButton.attributes("disabled")).toBeUndefined();

    // 4. 제출 버튼 클릭 → submit 이벤트 payload 검증
    await submitButton.trigger("click");
    const emits = wrapper.emitted("submit");
    expect(emits).toBeTruthy();
    const payload = emits[0][0];

    expect(payload.title).toBe("유효한 제목");
    expect(payload.description).toBe(""); // 설명은 입력 안 했으므로 trim() 결과 ""
    expect(payload.visibility).toBe("PRIVATE"); // 기본 값
    expect(payload.memberIds).toEqual([2]);
    expect(payload.managerIds).toEqual([2]);
  });

  it("mode='edit' 일 때 버튼 텍스트가 '변경 사항 저장'으로 표시된다", async () => {
    const wrapper = mount(GroupForm, {
      props: {
        mode: "edit",
        initialGroup: {
          title: "수정용 그룹",
          description: "설명",
          visibility: "PUBLIC",
          managerIds: [1],
          memberIds: [1],
        },
      },
    });

    await flushPromises();

    const submitButton = findButtonByText(wrapper, "변경 사항 저장");
    expect(submitButton).toBeTruthy();
  });
});

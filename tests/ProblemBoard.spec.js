import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProblemBoard from '../src/components/ProblemBoard.vue'
import * as api from '../src/api/problemApi'

describe('ProblemBoard.vue', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('게시 버튼 클릭시 postBoard 를 올바른 payload로 호출한다', async () => {
    const mockPost = vi.spyOn(api, 'postBoard').mockResolvedValue({ success: true })

    const wrapper = mount(ProblemBoard)

    // 제목 입력
    const titleInput = wrapper.find('input[type="text"]')
    await titleInput.setValue('테스트 세션')

    // selectedProblems 에 직접 접근해서 문제 두 개 추가
    await wrapper.setData({
      // setData 는 Options API 용이라서 Composition API 에서는 작동하지 않을 수 있으므로
      // 대신 vm 을 통해 수동으로 조작합니다.
    })

    const vm = wrapper.vm
    vm.selectedProblems.push({ id: 1, title: 'A', difficulty: 'Gold 5', tags: [], acceptedUserCount: 1 })
    vm.selectedProblems.push({ id: 2, title: 'B', difficulty: 'Gold 4', tags: [], acceptedUserCount: 1 })

    await wrapper.vm.$nextTick()

    const postButton = wrapper.find('button')
    await postButton.trigger('click')

    expect(mockPost).toHaveBeenCalledTimes(1)
    const payload = mockPost.mock.calls[0][0]
    expect(payload.title).toBe('테스트 세션')
    expect(payload.problems).toEqual([
      { id: 1, order: 1 },
      { id: 2, order: 2 }
    ])
  })
})

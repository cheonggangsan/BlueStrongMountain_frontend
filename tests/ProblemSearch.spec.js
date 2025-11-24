import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProblemSearch from '../src/components/ProblemSearch.vue'
import * as api from '../src/api/problemApi'

describe('ProblemSearch.vue', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('검색 결과를 클릭하면 add-problem 이벤트를 발생시킨다', async () => {
    const problem = { id: 123, title: '테스트 문제', difficulty: 'Gold 5', tags: [], acceptedUserCount: 10 }
    vi.spyOn(api, 'searchByNumber').mockResolvedValue([problem])

    const wrapper = mount(ProblemSearch)

    await wrapper.find('input[type="number"]').setValue('123')
    await wrapper.findAll('button').at(0).trigger('click')

    await new Promise(resolve => setTimeout(resolve, 0))

    const card = wrapper.find('.problem-card')
    expect(card.exists()).toBe(true)

    await card.trigger('click')

    const emits = wrapper.emitted('add-problem')
    expect(emits).toBeTruthy()
    expect(emits[0][0]).toEqual(problem)
  })
})

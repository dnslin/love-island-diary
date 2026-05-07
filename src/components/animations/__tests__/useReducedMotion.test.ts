import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from '../useReducedMotion'

describe('useReducedMotion', () => {
  let matchMediaListeners: Array<(e: MediaQueryListEvent) => void> = []

  beforeEach(() => {
    matchMediaListeners = []
  })

  afterEach(() => {
    matchMediaListeners = []
    jest.restoreAllMocks()
  })

  function mockMatchMedia(matches: boolean) {
    const mql = {
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null as ((e: MediaQueryListEvent) => void) | null,
      addEventListener: jest.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          matchMediaListeners.push(listener)
        }
      }),
      removeEventListener: jest.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          matchMediaListeners = matchMediaListeners.filter((l) => l !== listener)
        }
      }),
      dispatchEvent: jest.fn(),
    } as unknown as MediaQueryList

    window.matchMedia = jest.fn().mockReturnValue(mql)
    return mql
  }

  test('当 matchMedia 返回 matches: false 时返回 false', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  test('当 matchMedia 返回 matches: true 时返回 true', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  test('SSR 环境（window 为 undefined）时返回 false', () => {
    const originalWindow = globalThis.window
    const originalMatchMedia = window.matchMedia
    // @ts-expect-error 模拟 SSR 环境
    globalThis.window = undefined

    // 在 jsdom 中，globalThis.window = undefined 不会立即让函数内的 typeof window 变为 'undefined'
    // 因为 jsdom 的 window 对象仍通过全局作用域可达。这里直接模拟 matchMedia 为 undefined 来验证 SSR 行为。
    // @ts-expect-error
    globalThis.matchMedia = undefined

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)

    globalThis.window = originalWindow
    window.matchMedia = originalMatchMedia
  })

  test('监听 matchMedia 变化并更新状态', () => {
    const mql = mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)

    act(() => {
      matchMediaListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent)
      })
    })

    expect(result.current).toBe(true)
  })
})

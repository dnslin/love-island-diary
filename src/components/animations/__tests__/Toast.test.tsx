import { render, screen, act } from '@testing-library/react'
import { Toast } from '../Toast'

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('visible=true 时渲染 message', () => {
    render(<Toast message="保存成功" visible={true} />)
    expect(screen.getByText('保存成功')).toBeInTheDocument()
  })

  test('visible=false 时不渲染', () => {
    render(<Toast message="保存成功" visible={false} />)
    expect(screen.queryByText('保存成功')).not.toBeInTheDocument()
  })

  test('autoClose 后调用 onClose', () => {
    const onClose = jest.fn()
    render(<Toast message="保存成功" visible={true} onClose={onClose} autoClose={2000} />)

    expect(screen.getByText('保存成功')).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

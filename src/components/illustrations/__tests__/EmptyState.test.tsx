import { render, screen } from '@testing-library/react'
import EmptyState from '../EmptyState'

describe('EmptyState', () => {
  it('renders default message', () => {
    render(<EmptyState />)
    expect(screen.getByText('还没有日记呢，翻开第一页吧')).toBeInTheDocument()
  })

  it('renders custom message', () => {
    render(<EmptyState message="暂无回忆" />)
    expect(screen.getByText('暂无回忆')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(
      <EmptyState>
        <button>去写日记</button>
      </EmptyState>
    )
    expect(screen.getByRole('button', { name: '去写日记' })).toBeInTheDocument()
  })

  it('has aria-label on illustration', () => {
    render(<EmptyState />)
    const svg = document.querySelector('svg[aria-label="空白日记本"]')
    expect(svg).toBeInTheDocument()
  })
})

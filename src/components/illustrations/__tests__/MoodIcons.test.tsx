import { render, screen } from '@testing-library/react'
import MoodIcons from '../MoodIcons'

describe('MoodIcons', () => {
  it('renders an svg element', () => {
    render(<MoodIcons mood="happy" />)
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('applies custom size', () => {
    render(<MoodIcons mood="sweet" size={32} />)
    const svg = document.querySelector('svg')
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
  })

  it('has correct aria-label for each mood', () => {
    const { rerender } = render(<MoodIcons mood="happy" />)
    expect(screen.getByLabelText('开心')).toBeInTheDocument()

    rerender(<MoodIcons mood="sweet" />)
    expect(screen.getByLabelText('甜甜的')).toBeInTheDocument()

    rerender(<MoodIcons mood="miss" />)
    expect(screen.getByLabelText('想念')).toBeInTheDocument()

    rerender(<MoodIcons mood="calm" />)
    expect(screen.getByLabelText('平静')).toBeInTheDocument()

    rerender(<MoodIcons mood="sad" />)
    expect(screen.getByLabelText('小难过')).toBeInTheDocument()
  })
})

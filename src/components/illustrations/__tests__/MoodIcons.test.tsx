import { render, screen } from '@testing-library/react'
import { MoodIcon } from '../MoodIcons'

describe('MoodIcons', () => {
  it('renders an svg element', () => {
    render(<MoodIcon mood="happy" />)
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('applies custom size', () => {
    render(<MoodIcon mood="sweet" size={32} />)
    const svg = document.querySelector('svg')
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
  })

  it('has correct aria-label for each mood', () => {
    const { rerender } = render(<MoodIcon mood="happy" />)
    expect(screen.getByLabelText('开心')).toBeInTheDocument()

    rerender(<MoodIcon mood="sweet" />)
    expect(screen.getByLabelText('甜甜的')).toBeInTheDocument()

    rerender(<MoodIcon mood="miss" />)
    expect(screen.getByLabelText('想念')).toBeInTheDocument()

    rerender(<MoodIcon mood="calm" />)
    expect(screen.getByLabelText('平静')).toBeInTheDocument()

    rerender(<MoodIcon mood="sad" />)
    expect(screen.getByLabelText('小难过')).toBeInTheDocument()
  })
})

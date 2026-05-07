import { render, screen } from '@testing-library/react'
import { SlideIn } from '../SlideIn'

describe('SlideIn', () => {
  test('渲染子元素', () => {
    render(
      <SlideIn>
        <div data-testid="child">Hello</div>
      </SlideIn>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  test('应用自定义 className', () => {
    const { container } = render(
      <SlideIn className="custom-class">
        <span>Content</span>
      </SlideIn>,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

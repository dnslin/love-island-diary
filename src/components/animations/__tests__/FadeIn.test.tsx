import { render, screen } from '@testing-library/react'
import { FadeIn } from '../FadeIn'

describe('FadeIn', () => {
  test('渲染子元素', () => {
    render(
      <FadeIn>
        <div data-testid="child">Hello</div>
      </FadeIn>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  test('应用自定义 className', () => {
    const { container } = render(
      <FadeIn className="custom-class">
        <span>Content</span>
      </FadeIn>,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

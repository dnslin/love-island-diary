import { render, screen } from '@testing-library/react'
import { ScaleIn } from '../ScaleIn'

describe('ScaleIn', () => {
  test('渲染子元素', () => {
    render(
      <ScaleIn>
        <div data-testid="child">Hello</div>
      </ScaleIn>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  test('应用自定义 className', () => {
    const { container } = render(
      <ScaleIn className="custom-class">
        <span>Content</span>
      </ScaleIn>,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

import { render, screen } from '@testing-library/react'
import { ScaleIn } from '../ScaleIn'

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

describe('ScaleIn', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

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

  test('prefers-reduced-motion 时仍渲染子元素', () => {
    mockMatchMedia(true)
    render(
      <ScaleIn>
        <div data-testid="child">Hello</div>
      </ScaleIn>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})

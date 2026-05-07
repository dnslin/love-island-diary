import { render, screen } from '@testing-library/react'
import { FadeIn } from '../FadeIn'

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

describe('FadeIn', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

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

  test('prefers-reduced-motion 时仍渲染子元素', () => {
    mockMatchMedia(true)
    render(
      <FadeIn>
        <div data-testid="child">Hello</div>
      </FadeIn>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { SlideIn } from '../SlideIn'

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

describe('SlideIn', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

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

  test('prefers-reduced-motion 时仍渲染子元素', () => {
    mockMatchMedia(true)
    render(
      <SlideIn>
        <div data-testid="child">Hello</div>
      </SlideIn>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})

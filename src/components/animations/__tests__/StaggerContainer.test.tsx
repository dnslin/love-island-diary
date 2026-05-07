import { render, screen } from '@testing-library/react'
import { StaggerContainer, StaggerItem } from '../StaggerContainer'

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

describe('StaggerContainer', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('渲染子元素', () => {
    render(
      <StaggerContainer>
        <div data-testid="child">Hello</div>
      </StaggerContainer>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  test('应用自定义 className', () => {
    const { container } = render(
      <StaggerContainer className="custom-class">
        <span>Content</span>
      </StaggerContainer>,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  test('StaggerItem 渲染子元素', () => {
    render(
      <StaggerContainer>
        <StaggerItem>
          <div data-testid="item">Item</div>
        </StaggerItem>
      </StaggerContainer>,
    )
    expect(screen.getByTestId('item')).toBeInTheDocument()
  })

  test('StaggerItem 应用自定义 className', () => {
    const { container } = render(
      <StaggerContainer>
        <StaggerItem className="item-class">
          <span>Content</span>
        </StaggerItem>
      </StaggerContainer>,
    )
    expect(container.querySelector('.item-class')).toBeInTheDocument()
  })

  test('prefers-reduced-motion 时 StaggerContainer 和 StaggerItem 仍渲染子元素', () => {
    mockMatchMedia(true)
    render(
      <StaggerContainer>
        <StaggerItem>
          <div data-testid="item">Item</div>
        </StaggerItem>
      </StaggerContainer>,
    )
    expect(screen.getByTestId('item')).toBeInTheDocument()
  })
})

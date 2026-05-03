import { render, screen, fireEvent } from '@testing-library/react';
import { BackButton } from '../BackButton';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

describe('BackButton', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPush.mockClear();
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      writable: true,
      configurable: true,
    });
  });

  test('calls router.back when history.length > 1', () => {
    Object.defineProperty(window, 'history', {
      value: { length: 2 },
      writable: true,
    });

    render(<BackButton />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('falls back to router.push("/") when history.length <= 1', () => {
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      writable: true,
    });

    render(<BackButton />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});

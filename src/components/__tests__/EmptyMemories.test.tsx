import { render, screen } from '@testing-library/react';
import { EmptyMemories } from '../EmptyMemories';

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('animal-island-ui', () => ({
  Button: ({ children, type }: { children: React.ReactNode; type?: string }) => (
    <button data-type={type}>{children}</button>
  ),
}));

jest.mock('../illustrations', () => ({
  EmptyState: ({
    message,
    children,
  }: {
    message?: string;
    children?: React.ReactNode;
  }) => (
    <div>
      <p>{message}</p>
      {children}
    </div>
  ),
}));

describe('EmptyMemories', () => {
  test('渲染空状态文案和按钮', () => {
    render(<EmptyMemories />);
    expect(
      screen.getByText('还没有照片呢，先写一篇日记配上图片吧'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '去写日记' })).toHaveAttribute(
      'href',
      '/diary/new',
    );
  });
});

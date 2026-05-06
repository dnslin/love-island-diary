import { render, screen, fireEvent } from '@testing-library/react';
import PasswordModal from '../PasswordModal';

describe('PasswordModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    title: '输入密码',
    error: null,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders modal when isOpen is true', () => {
    render(<PasswordModal {...defaultProps} />);
    expect(screen.getByText('输入密码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    render(<PasswordModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('输入密码')).not.toBeInTheDocument();
  });

  test('calls onSubmit with password when confirm clicked', () => {
    render(<PasswordModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('请输入密码');
    fireEvent.change(input, { target: { value: 'my-password' } });
    fireEvent.click(screen.getByRole('button', { name: /确认/ }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith('my-password');
  });

  test('does not call onSubmit when password is empty', () => {
    render(<PasswordModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /确认/ }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  test('calls onClose when close button clicked', () => {
    render(<PasswordModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /关闭/ }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test('displays error message', () => {
    render(<PasswordModal {...defaultProps} error='密码错误，请重试' />);
    expect(screen.getByText('密码错误，请重试')).toBeInTheDocument();
  });

  test('disables input and shows loading state', () => {
    render(<PasswordModal {...defaultProps} isLoading={true} />);
    expect(screen.getByPlaceholderText('请输入密码')).toBeDisabled();
    expect(screen.getByRole('button', { name: /验证中/ })).toBeDisabled();
  });
});

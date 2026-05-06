import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

describe('DeleteConfirmModal', () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('渲染标题和说明文字', () => {
    render(
      <DeleteConfirmModal open={true} onClose={onClose} onConfirm={onConfirm} />,
    );
    expect(screen.getByText('要删除这篇日记吗？')).toBeInTheDocument();
    expect(screen.getByText('删除后就不能在这里看到它了')).toBeInTheDocument();
  });

  it('点击取消调用 onClose，不调用 onConfirm', () => {
    render(
      <DeleteConfirmModal open={true} onClose={onClose} onConfirm={onConfirm} />,
    );
    fireEvent.click(screen.getByText('取消'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('点击删除调用 onConfirm', () => {
    render(
      <DeleteConfirmModal open={true} onClose={onClose} onConfirm={onConfirm} />,
    );
    fireEvent.click(screen.getByText('删除'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('loading 状态下删除按钮显示 "删除中..."', () => {
    render(
      <DeleteConfirmModal
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        loading={true}
      />,
    );
    expect(screen.getByText('删除中...')).toBeInTheDocument();
  });
});

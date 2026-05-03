import { render, screen, fireEvent } from '@testing-library/react';
import { ImageUrlInput } from '../ImageUrlInput';

describe('ImageUrlInput', () => {
  test('添加有效 URL', () => {
    const onChange = jest.fn();
    render(<ImageUrlInput urls={[]} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('粘贴图片链接'), {
      target: { value: 'https://example.com/photo.jpg' },
    });
    fireEvent.click(screen.getByText('添加'));

    expect(onChange).toHaveBeenCalledWith(['https://example.com/photo.jpg']);
  });

  test('按 Enter 添加有效 URL', () => {
    const onChange = jest.fn();
    render(<ImageUrlInput urls={[]} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('粘贴图片链接'), {
      target: { value: 'https://example.com/photo.jpg' },
    });
    fireEvent.keyDown(screen.getByPlaceholderText('粘贴图片链接'), {
      key: 'Enter',
    });

    expect(onChange).toHaveBeenCalledWith(['https://example.com/photo.jpg']);
  });

  test('空输入点击添加不触发 onChange', () => {
    const onChange = jest.fn();
    render(<ImageUrlInput urls={[]} onChange={onChange} />);

    fireEvent.click(screen.getByText('添加'));

    expect(onChange).not.toHaveBeenCalled();
  });

  test('拒绝无效 URL', () => {
    const onChange = jest.fn();
    render(<ImageUrlInput urls={[]} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('粘贴图片链接'), {
      target: { value: 'not-a-url' },
    });
    fireEvent.click(screen.getByText('添加'));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('请输入有效的图片地址')).toBeInTheDocument();
  });

  test('删除 URL', () => {
    const onChange = jest.fn();
    render(
      <ImageUrlInput
        urls={['https://example.com/1.jpg', 'https://example.com/2.jpg']}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getAllByText('删除')[0]);

    expect(onChange).toHaveBeenCalledWith(['https://example.com/2.jpg']);
  });
});

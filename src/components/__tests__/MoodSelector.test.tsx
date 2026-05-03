import { render, screen, fireEvent } from '@testing-library/react';
import { MoodSelector, MOODS } from '../MoodSelector';

describe('MoodSelector', () => {
  test('默认渲染当前选中项', () => {
    render(<MoodSelector value="sweet" onChange={jest.fn()} />);
    expect(screen.getByText('甜甜的')).toBeInTheDocument();
  });

  test('点击展开下拉面板', () => {
    render(<MoodSelector value="sweet" onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    MOODS.forEach((mood) => {
      expect(screen.getAllByText(mood.label).length).toBeGreaterThanOrEqual(1);
    });
  });

  test('选择选项后触发 onChange 并关闭面板', () => {
    const onChange = jest.fn();
    render(<MoodSelector value="sweet" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('开心'));

    expect(onChange).toHaveBeenCalledWith('happy');
    expect(screen.queryByText('想念')).not.toBeInTheDocument();
  });

  test('点击外部关闭下拉面板', () => {
    render(<MoodSelector value="sweet" onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('开心')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('开心')).not.toBeInTheDocument();
  });

  test('按 Escape 关闭下拉面板', () => {
    render(<MoodSelector value="sweet" onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('开心')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('开心')).not.toBeInTheDocument();
  });
});

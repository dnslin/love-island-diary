import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MotionConfig } from 'framer-motion';
import { MoodSelector, MOODS } from '../MoodSelector';

function renderWithMotion(ui: React.ReactElement) {
  return render(
    <MotionConfig reducedMotion="always">{ui}</MotionConfig>,
  );
}

describe('MoodSelector', () => {
  test('默认渲染当前选中项', () => {
    renderWithMotion(<MoodSelector value="sweet" onChange={jest.fn()} />);
    expect(screen.getByText('甜甜的')).toBeInTheDocument();
  });

  test('点击展开下拉面板', () => {
    renderWithMotion(<MoodSelector value="sweet" onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    MOODS.forEach((mood) => {
      expect(screen.getAllByText(mood.label).length).toBeGreaterThanOrEqual(1);
    });
  });

  test('选择选项后触发 onChange 并关闭面板', async () => {
    const onChange = jest.fn();
    renderWithMotion(<MoodSelector value="sweet" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('开心'));

    expect(onChange).toHaveBeenCalledWith('happy');
    await waitFor(() => {
      expect(screen.queryByText('想念')).not.toBeInTheDocument();
    });
  });

  test('点击外部关闭下拉面板', async () => {
    renderWithMotion(<MoodSelector value="sweet" onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('开心')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText('开心')).not.toBeInTheDocument();
    });
  });

  test('按 Escape 关闭下拉面板', async () => {
    renderWithMotion(<MoodSelector value="sweet" onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('开心')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByText('开心')).not.toBeInTheDocument();
    });
  });
});

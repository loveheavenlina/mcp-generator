import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TestButton from './TestButton';

/**
 * TestButton 组件测试
 * 创建时间: 2025&#x2F;6&#x2F;29 12:05:33
 */

describe('TestButton', () => {
  test('renders without crashing', () => {
    render(<TestButton />);
    expect(screen.getByText('TestButton')).toBeInTheDocument();
  });

  test('displays description correctly', () => {
    render(<TestButton />);
    expect(screen.getByText('测试按钮组件')).toBeInTheDocument();
  });


  test('has correct CSS class', () => {
    const { container } = render(<TestButton />);
    expect(container.firstChild).toHaveClass('container');
  });

  test('matches snapshot', () => {
    const { container } = render(<TestButton />);
    expect(container.firstChild).toMatchSnapshot();
  });
}); 
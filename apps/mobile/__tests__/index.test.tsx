import { render } from '@testing-library/react-native';
import HomeScreen from '../app/index';
import { describe, it, expect } from '@jest/globals';

describe('ONYX Mobile HomeScreen', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('ONYX')).toBeTruthy();
  });

  it('renders subtitle', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Sovereign AI OS on Solana')).toBeTruthy();
  });

  it('renders chat link', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Open Chat →')).toBeTruthy();
  });
});
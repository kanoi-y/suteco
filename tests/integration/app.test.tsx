import { render, screen } from '@testing-library/react-native';
import HomeScreen from '../../app/index';

describe('HomeScreen', () => {
  it('renders correctly', () => {
    render(<HomeScreen />);
    
    expect(screen.getByText('Suteco')).toBeTruthy();
    expect(screen.getByText('テキストで検索')).toBeTruthy();
  });
});

import '@testing-library/jest-native/extend-expect';

// react-native-reanimated mock
// @ts-ignore
require('react-native-reanimated').default;
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  // The mock for `call` should be a function
  Reanimated.default.call = () => {};

  return Reanimated;
});

// expo-router mock
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: {
    Screen: jest.fn(() => null),
  },
}));

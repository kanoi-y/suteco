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
const { mockRouter } = require('./helpers/expo-router-mock');

jest.mock('expo-router', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: jest.fn(() => ({})),
    Link: ({
      children,
      href,
      asChild,
      ...rest
    }: {
      children: React.ReactNode;
      href: string;
      asChild?: boolean;
    }) => {
      const handlePress = () => mockRouter.push(href);
      if (asChild && React.Children.only(children)) {
        return React.cloneElement(
          children as React.ReactElement,
          { ...rest, onPress: handlePress }
        );
      }
      return React.createElement(Pressable, { ...rest, onPress: handlePress }, children);
    },
    Stack: {
      Screen: jest.fn(() => null),
    },
  };
});

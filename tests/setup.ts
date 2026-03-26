import '@testing-library/jest-native/extend-expect';

// AsyncStorage mock (Zustand persist で使用) - __mocks__/@react-native-async-storage/async-storage.js を参照
jest.mock('@react-native-async-storage/async-storage');

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
    usePathname: () => '/',
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
        return React.cloneElement(children as React.ReactElement, {
          ...rest,
          onPress: handlePress,
        });
      }
      return React.createElement(Pressable, { ...rest, onPress: handlePress }, children);
    },
    Stack: {
      Screen: jest.fn(() => null),
    },
  };
});

// __requireContext の ReferenceError 回避のため、datasets をモック化
jest.mock('@/lib/datasets', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const datasetsDir = path.resolve(__dirname, '../datasets');

  let files: string[] = [];
  if (fs.existsSync(datasetsDir)) {
    files = fs.readdirSync(datasetsDir).filter((f: string) => f.endsWith('.json'));
  }

  const defaultDatasets = files.map((file: string) => {
    return JSON.parse(fs.readFileSync(path.join(datasetsDir, file), 'utf8'));
  });

  return { defaultDatasets };
});

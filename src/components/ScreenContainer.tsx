import { usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopLinkHeader } from '@/components/TopLinkHeader';

export type ScreenContainerProps = {
  children: React.ReactNode;
};

export function ScreenContainer({ children }: ScreenContainerProps) {
  const pathname = usePathname();
  const showTopLink = (pathname ?? '') !== '/';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {showTopLink ? (
        <View style={styles.header}>
          <TopLinkHeader />
        </View>
      ) : null}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

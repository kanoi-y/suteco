import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

export type TopLinkHeaderProps = {
  label?: string;
};

export function TopLinkHeader({ label = 'TOPへ' }: TopLinkHeaderProps) {
  const router = useRouter();

  return (
    <Pressable
      testID="top-link-header"
      accessibilityRole="button"
      onPress={() => router.push('/')}
      style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  linkPressed: {
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
  },
});


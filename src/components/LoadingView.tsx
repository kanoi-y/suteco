import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type LoadingViewProps = {
  message?: string;
};

export function LoadingView({ message }: LoadingViewProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        testID="loading-view-indicator"
        size="large"
        color="#007AFF"
      />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: "#666",
  },
});

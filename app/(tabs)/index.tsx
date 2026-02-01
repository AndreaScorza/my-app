import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Alert, StyleSheet, TouchableOpacity, Platform } from 'react-native';

export default function HomeScreen() {
const handleQuestionPress = () => {
  const question = "Why are u gay?";

  if (Platform.OS === "web") {
    const choice = window.confirm(question);
    window.alert(choice ? "You are gay" : "Who says I'm gay?");
  } else {
    Alert.alert(
      "Question",
      question,
      [
        { text: "Who says I'm gay?", onPress: () => {} },
        { text: "You are gay", onPress: () => {} },
      ]
    );
  }
};


  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Hello World</ThemedText>
      <TouchableOpacity style={styles.button} onPress={handleQuestionPress}>
        <ThemedText style={styles.buttonText}>?</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

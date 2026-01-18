import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  const handleQuestionPress = () => {
    Alert.alert('Question', 'Why are u ... ?');
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

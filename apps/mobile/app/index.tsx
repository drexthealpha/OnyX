import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ONYX</Text>
      <Text style={styles.subtitle}>Sovereign AI OS on Solana</Text>
      <Link href="/chat" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Open Chat →</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1f', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#22d3ee' },
  subtitle: { fontSize: 16, color: '#a5b4fc', marginTop: 8, marginBottom: 32 },
  button: { backgroundColor: '#22d3ee', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8 },
  buttonText: { color: '#0d0d1f', fontWeight: 'bold', fontSize: 16 },
});
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerStyle: { backgroundColor: '#0d0d1f' }, headerTintColor: '#22d3ee', headerTitleStyle: { fontWeight: 'bold' } }}>
        <Stack.Screen name="index" options={{ title: 'ONYX' }} />
        <Stack.Screen name="chat" options={{ title: 'Chat' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';

const NERVE_URL = process.env.EXPO_PUBLIC_ONYX_NERVE_URL ?? 'http://localhost:3001';

interface Msg { id: string; role: 'user' | 'assistant'; content: string }

export default function ChatScreen() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Msg = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    try {
      const r = await fetch(`${NERVE_URL}/gateway/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, sessionKey: 'mobile-main' }),
      });
      const d = await r.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: d.reply ?? d.message ?? JSON.stringify(d) }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: `Error: ${String(e)}` }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <FlatList
        data={messages}
        keyExtractor={m => m.id}
        ref={flatListRef}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={item.role === 'user' ? styles.userText : styles.aiText}>{item.content}</Text>
          </View>
        )}
        style={styles.list}
        contentContainerStyle={{ paddingVertical: 16 }}
      />
      <View style={styles.inputRow}>
        <TextInput
          value={input} onChangeText={setInput}
          placeholder="Message ONYX…" placeholderTextColor="#666"
          style={styles.input} multiline
          onSubmitEditing={send}
        />
        <TouchableOpacity onPress={send} disabled={sending} style={styles.sendButton}>
          <Text style={styles.sendText}>{sending ? '…' : '↑'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1f' },
  list: { flex: 1, paddingHorizontal: 16 },
  bubble: { maxWidth: '80%', marginVertical: 4, padding: 12, borderRadius: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#22d3ee' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#1a1a3e', borderWidth: 1, borderColor: '#22d3ee33' },
  userText: { color: '#0d0d1f', fontWeight: '500' },
  aiText: { color: '#ddddff' },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#1a1a3e', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#1a1a3e', color: '#ddddff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, maxHeight: 100 },
  sendButton: { marginLeft: 8, backgroundColor: '#22d3ee', borderRadius: 8, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#0d0d1f', fontSize: 20, fontWeight: 'bold' },
});
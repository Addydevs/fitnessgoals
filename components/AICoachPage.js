import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AICoachPage = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'ai',
      text: "Hi! I'm your AI Coach. Ask me anything about your fitness journey!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), type: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: 'Keep up the great work! \uD83D\uDCAA',
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.type === 'user' ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <Text style={item.type === 'user' ? styles.userText : styles.aiText}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
      />
      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          style={styles.input}
          placeholder="Ask your AI coach..."
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={styles.sendButton}
          disabled={!input.trim() || isLoading}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  messages: { paddingBottom: 16 },
  messageContainer: {
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userMessage: { backgroundColor: '#1f2937', alignSelf: 'flex-end' },
  aiMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userText: { color: '#fff' },
  aiText: { color: '#111827' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto' },
  input: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  sendButton: { backgroundColor: '#1f2937', borderRadius: 20, padding: 12 },
});

export default AICoachPage;

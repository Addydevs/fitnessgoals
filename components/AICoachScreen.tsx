import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Message {
  id: number;
  type: 'ai' | 'user';
  text: string;
}

const AICoachScreen = () => {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      text: "Hi! I'm your AI Coach. Upload a progress photo or ask me anything about your fitness journey!",
    },
  ]);

  const handleSend = (): void => {
    if (!input.trim()) return;
    const userMessage: Message = { id: Date.now(), type: 'user', text: input.trim() };
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: Date.now() + 1,
        type: 'ai',
        text: 'Great question! Keep up the good work!'
      },
    ]);
    setInput('');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.messages}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.message, msg.type === 'user' ? styles.userMessage : styles.aiMessage]}
          >
            <Text style={msg.type === 'user' ? styles.userText : styles.aiText}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your AI coach anything..."
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <MaterialCommunityIcons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AICoachScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messages: {
    padding: 16,
  },
  message: {
    marginBottom: 8,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: '#111827',
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#111827',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#111827',
    padding: 10,
    borderRadius: 20,
  },
});


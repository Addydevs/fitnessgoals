import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const [loading, setLoading] = useState<boolean>(false);

  const handleSend = async (): Promise<void> => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now(), type: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Placeholder for API call
      const response = await fetch('https://api.example.com/ai-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse: Message = { id: Date.now() + 1, type: 'ai', text: data.reply || 'Sorry, I could not get a response.' };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage: Message = { id: Date.now() + 1, type: 'ai', text: 'Failed to get a response from the AI coach. Please try again.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
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
              placeholderTextColor="#6B7280"
              editable={!loading} // Disable input when loading
            />
            {loading ? (
              <ActivityIndicator size="small" color="#111827" style={styles.sendButton} />
            ) : (
              <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AICoachScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'android' ? 25 : 0, // Adjust for Android status bar
  },
  messages: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'flex-end', // Align messages to the bottom
  },
  message: {
    marginBottom: 10, // Increased margin for better spacing
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18, // Slightly more rounded corners
    elevation: 1, // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
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
    fontSize: 15, // Slightly larger font
  },
  aiText: {
    color: '#111827',
    fontSize: 15, // Slightly larger font
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10, // Increased padding
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#ffffff', // White background for input area
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20, // More rounded input field
    paddingHorizontal: 15, // Increased horizontal padding
    paddingVertical: 10, // Increased vertical padding
    marginRight: 10, // Increased margin
    fontSize: 16, // Larger font size for input
  },
  sendButton: {
    backgroundColor: '#111827',
    padding: 12, // Increased padding
    borderRadius: 25, // Fully rounded button
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2, // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
});


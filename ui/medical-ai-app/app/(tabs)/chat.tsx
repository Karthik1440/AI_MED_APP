import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import axios from "axios";

// Message type
type Message = {
  text: string;
  sender: "user" | "bot";
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { text: input, sender: "user" };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      setLoading(true);

      // Send to FastAPI symptom-checker
      const response = await axios.post("http://10.253.236.64:8000/symptom-checker", {
        symptoms: input,
        chat_history: newMessages.map((m) => `${m.sender}: ${m.text}`),
      });

      const botReply = response.data?.response || "Sorry, I couldn't get a reply from AI.";
      const botMessage: Message = { text: botReply, sender: "bot" };
      setMessages([...newMessages, botMessage]);
    } catch (err: unknown) {
      let errorMessageText = "Server error. Try again.";
      if (axios.isAxiosError(err)) {
        errorMessageText = err.response?.data?.detail || err.message;
      }
      const errorMessage: Message = { text: errorMessageText, sender: "bot" };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
      // Scroll again after bot message added
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#1f1f1f" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{ paddingVertical: 10 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageContainer,
                item.sender === "user" ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  item.sender === "user" ? styles.userText : styles.botText,
                ]}
              >
                {item.text}
              </Text>
            </View>
          )}
        />

        {/* Show "thinking..." while loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4f46e5" />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            style={styles.input}
            placeholder="Enter your symptoms..."
            placeholderTextColor="#aaa"
            selectionColor="#fff"
            keyboardAppearance="dark"
          />
          <Button title="Send" onPress={sendMessage} color="#4f46e5" />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 10, backgroundColor: "#1f1f1f" },
  inputRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#555",
    backgroundColor: "#2a2a2a",
    color: "#fff",
    padding: 10,
    borderRadius: 25,
    marginRight: 10,
  },
  messageContainer: {
    maxWidth: "80%",
    marginVertical: 5,
    padding: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: "#4f46e5",
    alignSelf: "flex-end",
    borderTopRightRadius: 0,
  },
  botBubble: {
    backgroundColor: "#2a2a2a",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
  },
  messageText: { fontSize: 16 },
  userText: { color: "#fff" },
  botText: { color: "#f0f0f0" },
  loadingContainer: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
  loadingText: { color: "#aaa", marginLeft: 5 },
});
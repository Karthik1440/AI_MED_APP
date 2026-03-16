import { StyleSheet, TouchableOpacity, View,Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons,MaterialCommunityIcons } from "@expo/vector-icons";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function HomeScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter();

  const goUpload = (model: string) => {
    router.push({ pathname: "/upload", params: { model, name } });
  };
  const handleOpenChat = () => {
  // Example actions:
  // 1. Scroll to chat input
  // 2. Open modal with chatbot
  // 3. Navigate to a chat screen if using router
  router.push("/chat"); // optional if you have a chat screen
};

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#0B132B", dark: "#0B132B" }}
        headerImage={
          <Image
            source={require("@/assets/images/home_page_image.jpg")}
            style={styles.headerImage}
            contentFit="cover"
          />
        }
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Welcome {name}</ThemedText>
          <ThemedText>Select Diagnosis Model</ThemedText>
        </ThemedView>

        <TouchableOpacity style={styles.card} onPress={() => goUpload("chest")}>
          <ThemedText style={styles.cardText}>Chest X-ray</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => goUpload("brain")}>
          <ThemedText style={styles.cardText}>Brain MRI</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => goUpload("lung")}>
          <ThemedText style={styles.cardText}>Lung CT</ThemedText>
        </TouchableOpacity>
      </ParallaxScrollView>

      {/* 🔥 Floating Profile Button */}
      <Text
      style={{
        position: "absolute",
        top: 40,       // distance from top
        right: 20,     // distance from right
        color: "#0a0453",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        }}
       onPress={() => router.push("/profile")} // optional if clickable
        >
      Profile
     </Text>

      <TouchableOpacity style={styles.chatButton} onPress={handleOpenChat}>
  {/* Chatbot image */}
  <Image
    source={require("@/assets/images/chatbot.png")} // path to your chatbot image
    style={styles.chatButtonImage}
  />
  <Text style={styles.chatButtonText}>AI Medical Assistant</Text>
</TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    marginBottom: 20,
    gap: 6,
  },
  card: {
    backgroundColor: "#0a2987",
    padding: 20,
    borderRadius: 14,
    marginBottom: 15,
  },
  cardText: {
    color: "white",
    fontSize: 16,
  },
  headerImage: {
    width: "100%",
    height: 300,
  },
  
  chatButton: {
   position: "absolute",
  bottom: 40,            // distance from bottom
  right: 20,             // distance from right
  width: 70,
  height: 70,
  borderRadius: 35,     
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column", // icon on top, text below
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.35,
  shadowRadius: 6,
  elevation: 6,           
  },
  chatButtonText: {
 color: "#fff",
  fontSize: 12,          // slightly bigger for readability
  fontWeight: "600",
  textAlign: "center",
  marginTop: 2,
  width: "100%",         // center align text inside button
  lineHeight: 14,        
},
chatButtonIcon: {
  fontSize: 28,          // size of the icon
  color: "#fff",
},
chatButtonImage: {
  width: 50,      // size of the chatbot image
  height: 50,
  borderRadius: 1, // make it circular if square
  marginBottom: 4,  // spacing between image and text
},
});
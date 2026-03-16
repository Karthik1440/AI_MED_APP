import {
  View,
  Text,
  Button,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function UploadScreen() {
  const { model } = useLocalSearchParams();
  const router = useRouter();

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // patient fields
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // language selection
  const [language, setLanguage] = useState("English");

  // -------------------------
  // Pick image
  // -------------------------
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow gallery access");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // -------------------------
  // Send to FastAPI backend
  // -------------------------
  const analyze = async () => {
    if (!image || !name || !age || !gender) {
      Alert.alert("Missing info", "Fill all patient details");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", {
      uri: image,
      name: "scan.jpg",
      type: "image/jpeg",
    } as any);

    formData.append("model_type", String(model));
    formData.append("name", name);
    formData.append("age", age);
    formData.append("gender", gender);
    formData.append("language", language); // send selected language

    try {
      const res = await fetch("http://10.253.236.64:8000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      router.push({
        pathname: "/result",
        params: { data: JSON.stringify(data) },
      });
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Cannot connect to backend");
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload {model} scan</Text>

      {/* Patient form */}
      <TextInput
        placeholder="Patient Name"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Age"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Gender"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={gender}
        onChangeText={setGender}
      />

      {/* Language Selector */}
      <View style={styles.languageContainer}>
        {["English", "Malayalam", "Kannada", "Hindi"].map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[
              styles.langButton,
              language === lang && styles.langButtonActive,
            ]}
            onPress={() => setLanguage(lang)}
          >
            <Text
              style={[
                styles.langText,
                language === lang && styles.langTextActive,
              ]}
            >
              {lang}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button title="Pick Scan Image" onPress={pickImage} />

      {image && <Image source={{ uri: image }} style={styles.preview} />}

      {image && (
        <View style={{ marginTop: 10 }}>
          {loading ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <Button title="Analyze" onPress={analyze} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#0B132B",
  },
  title: {
    color: "white",
    fontSize: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#1C2541",
    color: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  preview: {
    width: "100%",
    height: 250,
    marginVertical: 20,
    borderRadius: 12,
  },
  languageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  langButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#1C2541",
  },
  langButtonActive: {
    backgroundColor: "#5BC0BE",
  },
  langText: {
    color: "white",
  },
  langTextActive: {
    color: "#0B132B",
    fontWeight: "bold",
  },
});
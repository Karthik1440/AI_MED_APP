import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ResultScreen() {
  const { data } = useLocalSearchParams();

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No result found</Text>
      </View>
    );
  }

  const result = JSON.parse(String(data));
  const isNormal = result.prediction.toUpperCase() === "NORMAL";

  // Optional: Show hospital recommendation if problem detected
  const hospitalRecommendation = !isNormal
    ? "We recommend consulting a specialist or visiting a hospital for further examination. Nearby options: City Hospital, MedCare Clinic, HealthPlus Center."
    : "No immediate hospital visit needed. Continue routine monitoring.";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Diagnosis Result</Text>

      {/* Prediction Card */}
      <View style={styles.card}>
        <Text style={styles.label}>Prediction</Text>
        <Text style={[styles.value, isNormal ? styles.normal : styles.disease]}>
          {result.prediction}
        </Text>
      </View>

      {/* Confidence */}
      <View style={styles.card}>
        <Text style={styles.label}>Confidence</Text>
        <Text style={styles.value}>{result.confidence}%</Text>
      </View>

      {/* Scan Type */}
      <View style={styles.card}>
        <Text style={styles.label}>Scan Type</Text>
        <Text style={styles.value}>{result.scan_type}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Report Language</Text>
        <Text style={styles.value}>{result.language || "English"}</Text>
      </View>

      {/* Doctor-like Report */}
      <Text style={styles.reportTitle}>Doctor-like Medical Report</Text>
      <Text style={styles.report}>{result.report}</Text>

      {/* Hospital Recommendation */}
      <Text style={styles.reportTitle}>Next Steps</Text>
      <Text style={styles.report}>{hospitalRecommendation}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B132B",
    padding: 24,
  },
  title: {
    fontSize: 24,
    color: "white",
    marginBottom: 20,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#1C2541",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  label: {
    color: "#5BC0BE",
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  normal: {
    color: "#4CAF50",
  },
  disease: {
    color: "#FF6B6B",
  },
  reportTitle: {
    color: "#5BC0BE",
    marginTop: 20,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "600",
  },
  report: {
    color: "white",
    lineHeight: 22,
    marginBottom: 20,
  },
});
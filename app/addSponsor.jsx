import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { ref, push, set } from "firebase/database";
import { database } from "./firebase"; // Adjust the path if needed
import { useNavigation } from "@react-navigation/native";

export default function Sponsor() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState("digital"); // default mode
  const [duration, setDuration] = useState("15 days"); // default duration
  const [amount, setAmount] = useState(0);
  const [navigationHistory, setNavigationHistory] = useState([]);
  const navigation = useNavigation();

  // Mapping of duration labels to number of days
  const durationMapping = {
    "15 days": 15,
    "1 month": 30,
    "3 month": 90,
  };

  // Compute the amount based on the mode and duration
  useEffect(() => {
    const days = durationMapping[duration];
    if (mode === "digital") {
      setAmount(days * 100);
    } else if (mode === "physical") {
      setAmount(days * 125);
    }
  }, [mode, duration]);

  useEffect(() => {
    if (
      navigation &&
      navigation.state &&
      navigation.state.routeName !==
        navigationHistory[navigationHistory.length - 1]
    ) {
      setNavigationHistory((prevHistory) => [
        ...prevHistory,
        navigation.state.routeName,
      ]);
    }
  }, [navigation]);

  const handleBack = () => {
    setNavigationHistory((prevHistory) => {
      const newHistory = [...prevHistory];
      newHistory.pop();
      const lastState = newHistory[newHistory.length - 1] || "Home";
      navigation.navigate(lastState);
      return newHistory;
    });
  };

  const handleSubmit = async () => {
    try {
      // Create a reference to the "sponsor" node in the Realtime Database
      const sponsorsRef = ref(database, "sponsor");
      // Push a new record under the "sponsor" node
      const newSponsorRef = push(sponsorsRef);
      await set(newSponsorRef, {
        name,
        email,
        mode,
        duration,
        amount,
        // timestamp: new Date().toISOString(),
      });

      if (mode === "digital") {
        Alert.alert("hello");
      } else {
        Alert.alert(
          "Form Submitted",
          `Name: ${name}\nEmail: ${email}\nMode: ${mode}\nDuration: ${duration}\nAmount: ₹${amount}`
        );
      }
    } catch (e) {
      console.error("Error adding record: ", e);
      Alert.alert("Error", "Error adding record: " + e.message);
    }
  };

  // Custom radio button component
  const RadioButton = ({ label, selected, onPress }) => {
    return (
      <TouchableOpacity style={styles.radioButtonContainer} onPress={onPress}>
        <View
          style={[styles.radioButton, selected && styles.radioButtonSelected]}
        >
          {selected && <View style={styles.radioButtonInner} />}
        </View>
        <Text style={styles.radioLabel}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Text style={styles.label}>Mode</Text>
      <View style={styles.radioGroup}>
        <RadioButton
          label="Digital"
          selected={mode === "digital"}
          onPress={() => setMode("digital")}
        />
        <RadioButton
          label="Physical"
          selected={mode === "physical"}
          onPress={() => setMode("physical")}
        />
      </View>

      <Text style={styles.label}>Duration</Text>
      <View style={styles.radioGroup}>
        <RadioButton
          label="15 days"
          selected={duration === "15 days"}
          onPress={() => setDuration("15 days")}
        />
        <RadioButton
          label="1 month"
          selected={duration === "1 month"}
          onPress={() => setDuration("1 month")}
        />
        <RadioButton
          label="3 month"
          selected={duration === "3 month"}
          onPress={() => setDuration("3 month")}
        />
      </View>

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={[styles.input, styles.readOnlyInput]}
        value={`₹${amount}`}
        editable={false}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Pay</Text>
      </TouchableOpacity>

      <View style={styles.noteSection}>
        <Text style={styles.noteText}>
          1. In physical mode the sponsor has to needs to provide the physical
          banner to the desired location.
        </Text>
        <Text style={styles.noteText}>
          2. In digital mode you will be redirected to the whatsapp and need to
          send the respective image to the number in chat.
        </Text>
      </View>

      <TouchableOpacity onPress={handleBack}>
        <Text>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fafafa",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  readOnlyInput: {
    backgroundColor: "#f0f0f0",
  },
  label: {
    fontSize: 18,
    color: "#555",
    marginBottom: 10,
    fontWeight: "600",
  },
  radioGroup: {
    flexDirection: "row",
    marginBottom: 20,
  },
  radioButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 25,
  },
  radioButton: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioButtonSelected: {
    borderColor: "#90EE90",
  },
  radioButtonInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: "#90EE90",
  },
  radioLabel: {
    fontSize: 16,
    color: "#333",
  },
  submitButton: {
    backgroundColor: "#90EE90",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 30,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  noteSection: {
    marginTop: 30,
  },
  noteText: {
    fontSize: 12,
    color: "#999",
    lineHeight: 18,
    marginBottom: 5,
  },
});

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { database } from "../lib/firebase";
import { ref, push } from "firebase/database";
import DateTimePicker from "@react-native-community/datetimepicker";

const AddTournament = ({ navigation }) => {
  const [name, setName] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [location, setLocation] = useState("");
  const [ballType, setBallType] = useState("");
  const [slots, setSlots] = useState("");
  const [date1, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [overs, setOvers] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState([]);

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

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date1;
    setShowPicker(false);
    if (event.type === "set") {
      setDate(currentDate);
    }
  };

  const handleSubmit = async () => {
    const numericValues = {
      prizePool: Number(prizePool.trim()),
      entryFee: Number(entryFee.trim()),
      overs: Number(overs.trim()),
      slots: Number(slots.trim()),
    };
    if (
      !name.trim() ||
      !prizePool.trim() ||
      !entryFee.trim() ||
      !location.trim() ||
      !ballType.trim() ||
      !slots.trim() ||
      !overs.trim() ||
      !date1 ||
      !description.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields with valid data.");
      return;
    }
    if (
      Object.values(numericValues).some(
        (value) => !Number.isFinite(value) || value <= 0,
      )
    ) {
      Alert.alert("Error", "Prize pool, entry fee, overs, and slots must be positive numbers.");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date1 < today) {
      Alert.alert("Error", "Tournament date cannot be in the past.");
      return;
    }

    setLoading(true);
    try {
      const tid = Math.floor(Math.random() * 10000000).toString();
      const date = date1.toDateString();
      const newTournament = {
        tid,
        name: name.trim(),
        prizePool: numericValues.prizePool,
        entryFee: numericValues.entryFee,
        location: location.trim(),
        ballType: ballType.trim(),
        overs: numericValues.overs,
        slots: numericValues.slots,
        date,
        description: description.trim(),
        status: "upcoming",
        teams: [],
        createdAt: new Date().toISOString(),
      };

      const tournamentsRef = ref(database, "tournaments");
      await push(tournamentsRef, newTournament);

      Alert.alert("Success", "Tournament added successfully");
      setName("");
      setPrizePool("");
      setEntryFee("");
      setLocation("");
      setBallType("");
      setSlots("");
      setOvers("");
      setDate(new Date());
      setDescription("");
    } catch (error) {
      console.error("Error adding tournament: ", error);
      Alert.alert("Error", "Failed to add tournament");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#4CAF50", "#45a049"]} style={styles.header}>
        <Text style={styles.headerTitle}>Add New Tournament</Text>
        <Text style={styles.headerSubtitle}>
          Fill in the tournament details
        </Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        {/* Input Fields (Shortened for brevity but matching original) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tournament Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter tournament name"
            value={name}
            onChangeText={setName}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prize Pool (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter prize pool amount"
            value={prizePool}
            onChangeText={setPrizePool}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Entry Fee (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter entry fee"
            value={entryFee}
            onChangeText={setEntryFee}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter tournament location"
            value={location}
            onChangeText={setLocation}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ball Type</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter ball type"
            value={ballType}
            onChangeText={setBallType}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Overs</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter number of overs"
            value={overs}
            onChangeText={setOvers}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Available Slots</Text>
          <TextInput
            style={styles.input}
            placeholder="Max number of teams"
            value={slots}
            onChangeText={setSlots}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tournament Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.dateText}>{date1.toLocaleDateString()} 🗓️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter tournament description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {showPicker && (
          <DateTimePicker
            value={date1}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={new Date()} // Fix: Prevents past dates
            onChange={handleDateChange}
          />
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Adding Tournament..." : "Add Tournament"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  header: {
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 48 : 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    textAlign: "center",
  },
  formContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    elevation: 4,
    marginBottom: 24,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  textArea: { height: 120, textAlignVertical: "top" },
  dateButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateText: { fontSize: 16, color: "#2c3e50" },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    elevation: 4,
  },
  submitButtonDisabled: { backgroundColor: "#a5d6a7", opacity: 0.8 },
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
export default AddTournament;

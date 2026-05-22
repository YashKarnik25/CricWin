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
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { database } from "./firebase";
import { ref, push, query, orderByChild, equalTo } from "firebase/database";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";

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
  const [tournamentImage, setTournamentImage] = useState(null);
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

  const handleBack = () => {
    setNavigationHistory((prevHistory) => {
      const newHistory = [...prevHistory];
      newHistory.pop();
      const lastState = newHistory[newHistory.length - 1] || "Dashboard";
      navigation.navigate(lastState);
      return newHistory;
    });
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date1;
    setShowPicker(false);
    if (event.type === "set") {
      setDate(currentDate);
    }
  };

  const formattedDate = `${date1.getDate()}/${
    date1.getMonth() + 1
  }/${date1.getFullYear()}`;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setTournamentImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (
      !name ||
      !prizePool ||
      !entryFee ||
      !location ||
      !ballType ||
      !slots ||
      !overs ||
      !date1 ||
      !description
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const generateTournamentId = () => {
        return Math.floor(Math.random() * 10000000).toString();
      };
      const tid = generateTournamentId();
      const date = date1.toDateString();
      const newTournament = {
        tid,
        name,
        prizePool: parseInt(prizePool),
        entryFee: parseInt(entryFee),
        location,
        ballType,
        overs: parseInt(overs),
        slots: parseInt(slots),
        date,
        status: "upcoming",
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
      setTournamentImage(null);
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
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tournament Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter tournament name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#999"
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
            placeholderTextColor="#999"
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
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter tournament location"
            value={location}
            onChangeText={setLocation}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ball Type</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter ball type"
            value={ballType}
            onChangeText={setBallType}
            placeholderTextColor="#999"
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
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Available Slots</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter number of slots"
            value={slots}
            onChangeText={setSlots}
            keyboardType="numeric"
            placeholderTextColor="#999"
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
            placeholderTextColor="#999"
          />
        </View>

        {showPicker && (
          <DateTimePicker
            value={date1}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
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
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
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
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  imagePicker: {
    width: "100%",
    height: 180,
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 20,
  },
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
    color: "#2c3e50",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  dateButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateText: {
    fontSize: 16,
    color: "#2c3e50",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#a5d6a7",
    opacity: 0.8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default AddTournament;

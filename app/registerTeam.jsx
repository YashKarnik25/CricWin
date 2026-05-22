import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";

import { database } from "./firebase";
import {
  ref,
  push,
  query,
  orderByChild,
  equalTo,
  get,
} from "firebase/database";

const TeamRegistrationForm = ({ navigation }) => {
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState(
    Array(11).fill({ name: "", email: "" })
  );
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");

  const handlePlayerChange = (text, index, field) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: text };
    setPlayers(newPlayers);
  };

  const handleSubmit = () => {
    if (
      !teamName ||
      players.some((player) => !player.name || !player.email) ||
      !email ||
      !contact
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const playersArray = players.reduce((acc, player, index) => {
      acc.push({ name: player.name, email: player.email });
      return acc;
    }, []);

    const newTeam = {
      teamName,
      email,
      contact,
      playersArray,
    };

    const teamRef = ref(database, "teams/");
    const emailRef = ref(database, `user/`);
    const tournamentRef = ref(database, `tournament/`);

    async function getPlayerByEmail(emails) {
      try {
        const emailChecks = emails.map((email) =>
          query(emailRef, orderByChild("email"), equalTo(email))
        );

        const emailChecks2 = query(
          teamRef,
          orderByChild("email"),
          equalTo(email)
        );

        const results = await Promise.all(
          emailChecks.map((emailQuery) => get(emailQuery))
        );

        const results2 = await get(emailChecks2);

        if (results2.exists()) {
          Alert.alert("Alert", "Email already registered");
          return;
        }

        const allExist = results.every((snapshot) => snapshot.exists());

        if (allExist) {
          push(teamRef, newTeam)
            .then(() => {
              Alert.alert(
                "Success",
                "Team registration submitted successfully!"
              );
            })
            .catch((error) => {
              console.error("Error adding team: ", error);
              Alert.alert("Error", "Failed to add team");
            });
        } else {
          const missingEmails = emails.filter(
            (email, index) => !results[index].exists()
          );
          Alert.alert(
            "Alert",
            "Following Emails do not exist:" + `\n${missingEmails.toString()}`
          );
        }
      } catch (error) {
        Alert.alert("Alert", error.message);
      }
    }

    getPlayerByEmail(players.map((player) => player.email));
  };

  return (
    <ScrollView style={styles.containerTeam}>
      <Text style={styles.title}>Team Registration</Text>

      <TextInput
        style={styles.input}
        value={teamName}
        onChangeText={setTeamName}
        placeholder="Team Name"
      />

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        value={contact}
        onChangeText={setContact}
        placeholder="Contact Number"
        keyboardType="phone-pad"
      />
      <Text style={styles.text}>Enter Player Details:</Text>

      {players.map((player, index) => (
        <View key={index} style={styles.playerContainer}>
          <TextInput
            style={[styles.input, styles.playerInput]}
            value={player.name}
            onChangeText={(text) => handlePlayerChange(text, index, "name")}
            placeholder={`Player ${index + 1} Name`}
          />
          <TextInput
            style={[styles.input, styles.playerInput]}
            value={player.email}
            onChangeText={(text) => handlePlayerChange(text, index, "email")}
            placeholder={`Player ${index + 1} Email`}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Registration</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  containerTeam: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
  },
  playerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  playerInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  text: {
    fontSize: 16,
    marginBottom: 12,
  },
});

export default TeamRegistrationForm;

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { database } from "./firebase";
import { ref, query, orderByChild, equalTo, get } from "firebase/database";

const Scorecard = ({ match, battingFirstTeam }) => {
  const [overs, setOvers] = useState(0);
  const [firstInningsScore, setFirstInningsScore] = useState(0);
  const [score, setScore] = useState(0);
  const [currentOver, setCurrentOver] = useState(0);
  const [battingTeam, setBattingTeam] = useState("Team A");
  const [currentBall, setCurrentBall] = useState(0);
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [currentBatsmen, setCurrentBatsmen] = useState([null, null]);
  const [battingFirstTeamPlayers, setBattingFirstTeamPlayers] =
    useState(battingFirstTeam);

  useEffect(() => {
    const fetchPlayers = async () => {
      const team1PlayerEmails = Object.values(match.team1Players);
      const team2PlayerEmails = Object.values(match.team2Players);

      const userRef = ref(database, `user`);

      const fetchTeamPlayers = async (emails, setTeamPlayers) => {
        const teamPlayers = [];
        for (const email of emails) {
          const userQuery = query(
            userRef,
            orderByChild("email"),
            equalTo(email)
          );
          const snapshot = await get(userQuery);
          const data = snapshot.val();
          const userId = Object.keys(data)[0];
          const userData = data[userId];
          const playerName = userData.firstname + " " + userData.lastname;
          teamPlayers.push(playerName);
        }
        setTeamPlayers(teamPlayers);
      };

      await fetchTeamPlayers(team1PlayerEmails, setTeam1Players);
      await fetchTeamPlayers(team2PlayerEmails, setTeam2Players);
    };

    fetchPlayers();
  }, [match]);

  useEffect(() => {
    if (overs >= 8) {
      console.log("Overs reached:", overs); // Debugging statement

      // Switch teams
      setBattingTeam(battingTeam === "Team A" ? "Team B" : "Team A");
      console.log("Switching teams to:", battingTeam); // Debugging statement

      setCurrentBatsmen([team2Players[0], team2Players[1]]);
      setTeam1Players(team2Players);
      setTeam2Players(team1Players);
      setFirstInningsScore(score); // Store the first innings score
      alert("Teams are changing after the first innings!"); // Display popup message
      setOvers(0); // Reset overs after switching
    }
  }, [overs]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Scorecard</Text>
      <View style={styles.section}>
        <Text style={styles.subHeading}>Batting</Text>
        <Text style={styles.label}>On Strike: {currentBatsmen[0]}</Text>
        <Text style={styles.label}>Non Strike: {currentBatsmen[1]}</Text>
        <Text style={styles.label}>Select Player from {battingTeam}:</Text>
        <Button
          title="Switch Teams"
          onPress={() => {
            setBattingTeam(battingTeam === "Team A" ? "Team B" : "Team A");
            setOvers(0);
          }}
        />

        <Picker
          selectedValue={currentBatsmen[0]}
          style={styles.picker}
          onValueChange={(itemValue) =>
            setCurrentBatsmen([itemValue, currentBatsmen[1]])
          }
        >
          {team1Players.map((player, index) => (
            <Picker.Item key={index} label={player} value={player} />
          ))}
        </Picker>
        <Picker
          selectedValue={currentBatsmen[1]}
          style={styles.picker}
          onValueChange={(itemValue) =>
            setCurrentBatsmen([currentBatsmen[0], itemValue])
          }
        >
          {team1Players.map((player, index) => (
            <Picker.Item key={index} label={player} value={player} />
          ))}
        </Picker>
      </View>
      <View style={styles.section}>
        <Text style={styles.subHeading}>Bowling</Text>
        {overs < 8 && (
          <>
            <Text style={styles.label}>Select Player from Team 2:</Text>
            <Picker
              selectedValue={null}
              style={styles.picker}
              onValueChange={(itemValue) => console.log(itemValue)}
            >
              {team2Players.map((player, index) => (
                <Picker.Item key={index} label={player} value={player} />
              ))}
            </Picker>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: "center",
  },
  picker: {
    height: 50,
    width: "100%",
    marginBottom: 20,
  },
});

export default Scorecard;

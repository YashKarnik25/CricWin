import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  ref,
  onValue,
  push,
  query,
  orderByChild,
  equalTo,
  get,
  remove,
  update,
} from "firebase/database";
import { database } from "../lib/firebase";
import { LinearGradient } from "expo-linear-gradient";
import ScoreScreen from "./ScoreNew";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

// (Retain existing styles array - omitted here for output limit, keeping logic primary)
// Assume previous stylesheet references remain.

const AdminHome = () => {
  const [currentState, setCurrentState] = useState("listOfTournaments");
  const [data, setData] = useState({});
  const [match, setMatch] = useState({});
  const [battingTeam, setBattingTeam] = useState("");
  const [bowlingTeam, setBowlingTeam] = useState("");
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ... (Keep existing fetchTournaments, onRefresh, deleteTournament) ...

  const ChooseTeams = ({ match }) => {
    const [tossCompleted, setTossCompleted] = useState(false);
    const [tossWinner, setTossWinner] = useState(null);
    const [tossChoice, setTossChoice] = useState(null);

    const performToss = () => {
      // Randomly select Toss Winner
      const winner = Math.random() < 0.5 ? match.team1 : match.team2;
      setTossWinner(winner);
      setTossCompleted(true);
    };

    const handleTossChoice = (choice) => {
      setTossChoice(choice);
      const isTeam1Winner = tossWinner === match.team1;

      if (choice === "Bat") {
        setBattingTeam(isTeam1Winner ? match.team1 : match.team2);
        setBowlingTeam(isTeam1Winner ? match.team2 : match.team1);
      } else {
        setBattingTeam(isTeam1Winner ? match.team2 : match.team1);
        setBowlingTeam(isTeam1Winner ? match.team1 : match.team2);
      }
      setCurrentState("scoreCard");
    };

    return (
      <View
        style={{
          flex: 1,
          padding: 20,
          justifyContent: "center",
          backgroundColor: "#f5f7fa",
        }}
      >
        <TouchableOpacity
          style={{ position: "absolute", top: 40, left: 20 }}
          onPress={() => setCurrentState("matches")}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 26,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          {match.team1} vs {match.team2}
        </Text>

        {!tossCompleted ? (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, marginBottom: 20 }}>
              Time for the Toss!
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#4CAF50",
                padding: 15,
                borderRadius: 10,
                width: "60%",
              }}
              onPress={performToss}
            >
              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                Flip Coin (Heads / Tails)
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: "#2E7D32",
                marginBottom: 20,
              }}
            >
              {tossWinner} won the toss!
            </Text>
            <Text style={{ fontSize: 16, marginBottom: 20 }}>
              What will they choose?
            </Text>
            <View style={{ flexDirection: "row", gap: 20 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#1976D2",
                  padding: 15,
                  borderRadius: 10,
                  width: 120,
                }}
                onPress={() => handleTossChoice("Bat")}
              >
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  Batting
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#D32F2F",
                  padding: 15,
                  borderRadius: 10,
                  width: 120,
                }}
                onPress={() => handleTossChoice("Bowl")}
              >
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  Bowling
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const TournamentDetails = ({ data, setCurrentState }) => {
    const handleGenerateFixtures = async () => {
      // Slot enforcement checking
      if (!data.teams || data.teams.length < 2) {
        Alert.alert(
          "Insufficient Teams",
          "At least 2 teams are required to generate fixtures.",
        );
        return;
      }

      const matchesRef = ref(database, "matches");
      try {
        const matchesQuery = query(
          matchesRef,
          orderByChild("tournamentId"),
          equalTo(data.id),
        );
        const snapshot = await get(matchesQuery);

        if (!snapshot.exists()) {
          // Shuffle teams randomly for fixtures
          const shuffled = [...data.teams].sort(() => 0.5 - Math.random());
          for (let i = 0; i < shuffled.length; i += 2) {
            if (shuffled[i + 1]) {
              await push(matchesRef, {
                team1: shuffled[i],
                team2: shuffled[i + 1],
                tournamentId: data.id,
                status: "pending",
              });
            }
          }
          Alert.alert("Success", "Random fixtures generated successfully!");
        }
        setCurrentState("matches");
      } catch (error) {
        Alert.alert("Error", error.message);
      }
    };

    // UI Rendering matches original
    return (
      /* Existing Tournament Details UI returning 'handleGenerateFixtures' on press */
      <View>
        {/* Implement HandleGenerateFixtures instead of HandlePress */}
      </View>
    );
  };

  // ... (Return Logic routing to appropriate screens) ...
  if (currentState === "listOfTournaments") return <ListOfTeams />;
  else if (currentState === "tournamentDetails")
    return <TournamentDetails data={data} setCurrentState={setCurrentState} />;
  else if (currentState === "matches") return <Matches tid={data.id} />;
  else if (currentState === "chooseTeams") return <ChooseTeams match={match} />;
  else if (currentState === "scoreCard")
    return (
      <ScoreScreen
        match={match}
        battingTeam1={battingTeam}
        bowlingTeam1={bowlingTeam}
      />
    );
};
export default AdminHome;

import React, { useContext, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  TouchableOpacity,
  Modal,
} from "react-native";
import { ref, query, orderByChild, equalTo, get } from "firebase/database";
import { database } from "../lib/firebase";
import { UserContext } from "./_layout";
import { useIsFocused } from "expo-router/react-navigation";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const Profile = () => {
  const { emailGlobal } = useContext(UserContext);
  const [profileData, setProfileData] = useState(null);
  const [managerPerformance, setManagerPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSticker, setSelectedSticker] = useState(
    require("../assets/images/profile/p1.jpg")
  );
  const [isModalVisible, setIsModalVisible] = useState(false);

  const matchesAnim = useRef(new Animated.Value(300)).current;
  const battingAnim = useRef(new Animated.Value(300)).current;
  const bowlingAnim = useRef(new Animated.Value(300)).current;

  const isFocused = useIsFocused();

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      if (!emailGlobal) {
        setProfileData(null);
        setManagerPerformance([]);
        setLoading(false);
        return;
      }
      try {
        const [playerStatsSnapshot, userSnapshot] = await Promise.all([
          get(
            query(
              ref(database, "playerStats"),
              orderByChild("email"),
              equalTo(emailGlobal),
            ),
          ),
          get(
            query(
              ref(database, "user"),
              orderByChild("email"),
              equalTo(emailGlobal),
            ),
          ),
        ]);
        const stats = playerStatsSnapshot.exists()
          ? Object.values(playerStatsSnapshot.val())[0]
          : {};
        const userInfo = userSnapshot.exists()
          ? Object.values(userSnapshot.val())[0]
          : {};
        const profile = {
          ...stats,
          name: `${userInfo.firstname || ""} ${userInfo.lastname || ""}`.trim(),
          email: emailGlobal,
          contact: userInfo.contact || "",
          role: userInfo.role || "",
          matches: Number(stats.matches) || 0,
          batting: stats.batting || {},
          bowling: stats.bowling || {},
          catches: Number(stats.catches) || 0,
        };
        if (isMounted) setProfileData(profile);

        if (userInfo.role !== "owner") {
          if (isMounted) setManagerPerformance([]);
          return;
        }

        const [teamsSnapshot, tournamentsSnapshot, matchesSnapshot, allStatsSnapshot] =
          await Promise.all([
            get(ref(database, "teams")),
            get(ref(database, "tournaments")),
            get(ref(database, "matches")),
            get(ref(database, "playerStats")),
          ]);
        const teams = teamsSnapshot.exists()
          ? Object.values(teamsSnapshot.val())
          : [];
        const tournaments = tournamentsSnapshot.exists()
          ? tournamentsSnapshot.val()
          : {};
        const allMatches = matchesSnapshot.exists()
          ? matchesSnapshot.val()
          : {};
        const allPlayerStats = allStatsSnapshot.exists()
          ? allStatsSnapshot.val()
          : {};
        const ownedTeams = teams.filter((team) =>
          String(team.ownerEmail || team.email || "")
            .trim()
            .toLowerCase() === emailGlobal.trim().toLowerCase(),
        );
        const performance = ownedTeams.map((team) => {
          const teamTournaments = Object.entries(tournaments)
            .filter(([, tournament]) => {
              const registeredTeams = Array.isArray(tournament.teams)
                ? tournament.teams
                : Object.values(tournament.teams || {});
              return registeredTeams.includes(team.teamName);
            })
            .map(([id, tournament]) => ({
              id,
              name: tournament.name || id,
              status: tournament.status || "upcoming",
            }));
          const teamMatches = Object.entries(allMatches)
            .filter(([, item]) => item.team1 === team.teamName || item.team2 === team.teamName)
            .map(([id, item]) => ({
              id,
              opponent:
                item.team1 === team.teamName ? item.team2 : item.team1,
              winner: item.winner || "Pending",
              result:
                item.scoreCard?.firstInning && item.scoreCard?.secondInning
                  ? `${item.scoreCard.firstInning.team1TotalRuns || 0} - ${item.scoreCard.secondInning.team2TotalRuns || 0}`
                  : "Not played",
            }));
          const squad = (team.playersArray || []).map((player) => {
            const playerStats = Object.values(allPlayerStats).find(
              (statsEntry) =>
                String(statsEntry.email || "").toLowerCase() ===
                String(player.email || "").toLowerCase(),
            );
            return {
              name: player.name,
              matches: Number(playerStats?.matches) || 0,
              runs: Number(playerStats?.batting?.runs) || 0,
              wickets: Number(playerStats?.bowling?.wickets) || 0,
              catches: Number(playerStats?.catches) || 0,
            };
          });
          return {
            teamName: team.teamName,
            tournaments: teamTournaments,
            matches: teamMatches,
            squad,
          };
        });
        if (isMounted) setManagerPerformance(performance);
      } catch (error) {
        console.error("Error fetching profile and performance:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    setLoading(true);
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [emailGlobal]);

  useEffect(() => {
    if (isFocused) {
      matchesAnim.setValue(300);
      battingAnim.setValue(300);
      bowlingAnim.setValue(300);
      Animated.sequence([
        Animated.timing(matchesAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(battingAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bowlingAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused, matchesAnim, battingAnim, bowlingAnim]);

  const imageDictionary = [
    require("../assets/images/profile/p1.jpg"),
    require("../assets/images/profile/p2.jpg"),
    require("../assets/images/profile/p3.jpg"),
    require("../assets/images/profile/p4.jpg"),
  ];

  const handleStickerSelect = (image) => {
    setSelectedSticker(image);
    setIsModalVisible(false);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.cancelled) {
        setSelectedSticker({ uri: result.uri });
        setIsModalVisible(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }
  if (!emailGlobal) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.noDataText}>Please Login first..!</Text>
      </View>
    );
  }
  if (!profileData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.noDataText}>No profile data found..!</Text>
      </View>
    );
  }

  const { name, email, contact, role, batting, bowling, matches } = profileData;
  const battingData = batting || {
    runs: "N/A",
    balls: "N/A",
    strikeRate: "N/A",
    average: "N/A",
  };
  const bowlingData = bowling || { runs: "N/A", balls: "N/A", wickets: "N/A" };

  return (
    <Animated.View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.profileContainer}>
          <Image source={selectedSticker} style={styles.profilePicture} />
          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            style={styles.editButton}
          >
            <MaterialIcons name="edit" size={30} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.tbl}>
          <Text style={styles.sectionTitle}>Played Information</Text>
          <View style={styles.tableRow}>
            <Text style={styles.detailText}>Name:</Text>
            <Text style={styles.fetchTextFet}>{name}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.detailText}>Email:</Text>
            <Text style={styles.fetchTextFet}>{email}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.detailText}>Contact:</Text>
            <Text style={styles.fetchTextFet}>{contact}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.detailText}>Role:</Text>
            <Text style={styles.fetchTextFet}>{role}</Text>
          </View>
        </View>

        <Animated.View
          style={[styles.card, { transform: [{ translateY: matchesAnim }] }]}
        >
          <Text style={styles.sectionTitle}>Matches Played</Text>
          <View style={styles.tableRow}>
            <Text style={styles.cardText}>Matches Played</Text>
            <Text style={styles.cardTextFet}>{matches}</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.card, { transform: [{ translateY: battingAnim }] }]}
        >
          <Text style={styles.sectionTitle}>Batting</Text>
          <View style={styles.tableRow}>
            <Text style={styles.cardText}>Runs</Text>
            <Text style={styles.cardTextFet}>{battingData.runs}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cardText}>Balls</Text>
            <Text style={styles.cardTextFet}>{battingData.balls}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cardText}>Strike Rate</Text>
            <Text style={styles.cardTextFet}>
              {battingData.strikeRate && !isNaN(battingData.strikeRate)
                ? battingData.strikeRate.toFixed(2)
                : "N/A"}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cardText}>Average</Text>
            <Text style={styles.cardTextFet}>
              {battingData.average && !isNaN(battingData.average)
                ? battingData.average.toFixed(2)
                : "N/A"}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.card, { transform: [{ translateY: bowlingAnim }] }]}
        >
          <Text style={styles.sectionTitle}>Bowling</Text>
          <View style={styles.tableRow}>
            <Text style={styles.cardText}>Runs Conceded</Text>
            <Text style={styles.cardTextFet}>{bowlingData.runs}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cardText}>Balls Bowled</Text>
            <Text style={styles.cardTextFet}>{bowlingData.balls}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cardText}>Wickets</Text>
            <Text style={styles.cardTextFet}>{bowlingData.wickets}</Text>
          </View>
        </Animated.View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Overall Fielding</Text>
          <View style={styles.tableRow}>
            <Text style={styles.cardText}>Catches</Text>
            <Text style={styles.cardTextFet}>{profileData.catches || 0}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tournament-wise Stats</Text>
          {Object.entries(profileData.tournaments || {}).length === 0 ? (
            <Text style={styles.cardText}>No tournament stats yet.</Text>
          ) : (
            Object.entries(profileData.tournaments || {}).map(
              ([tournamentId, stats]) => (
                <View key={tournamentId} style={styles.statsBlock}>
                  <Text style={styles.sectionTitle}>
                    {stats.name || tournamentId}
                  </Text>
                  <Text style={styles.cardText}>
                    Matches: {stats.matches || 0} · Runs: {stats.batting?.runs || 0} ·
                    Balls: {stats.batting?.balls || 0}
                  </Text>
                  <Text style={styles.cardText}>
                    SR: {Number(stats.batting?.strikeRate || 0).toFixed(2)} ·
                    Average: {Number(stats.batting?.average || 0).toFixed(2)}
                  </Text>
                  <Text style={styles.cardText}>
                    Wickets: {stats.bowling?.wickets || 0} · Catches:{" "}
                    {stats.catches || 0}
                  </Text>
                </View>
              ),
            )
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Match-wise Stats</Text>
          {Object.entries(profileData.matchHistory || {}).length === 0 ? (
            <Text style={styles.cardText}>No match stats yet.</Text>
          ) : (
            Object.entries(profileData.matchHistory || {}).map(
              ([matchId, stats]) => (
                <View key={matchId} style={styles.statsBlock}>
                  <Text style={styles.sectionTitle}>
                    Match {matchId} · {stats.winner || "Result pending"}
                  </Text>
                  <Text style={styles.cardText}>
                    Runs: {stats.batting?.runs || 0} · Balls:{" "}
                    {stats.batting?.balls || 0} · SR:{" "}
                    {Number(stats.batting?.strikeRate || 0).toFixed(2)} · Avg:{" "}
                    {Number(stats.batting?.average || 0).toFixed(2)}
                  </Text>
                  <Text style={styles.cardText}>
                    Wickets: {stats.bowling?.wickets || 0} · Catches:{" "}
                    {stats.catches || 0}
                  </Text>
                </View>
              ),
            )
          )}
        </View>

        {role === "owner" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>My Team Performance</Text>
            {managerPerformance.length === 0 ? (
              <Text style={styles.cardText}>No registered team found.</Text>
            ) : (
              managerPerformance.map((teamPerformance) => (
                <View key={teamPerformance.teamName} style={styles.statsBlock}>
                  <Text style={styles.sectionTitle}>
                    {teamPerformance.teamName}
                  </Text>
                  <Text style={styles.cardText}>Tournaments</Text>
                  {teamPerformance.tournaments.map((tournament) => (
                    <Text key={tournament.id} style={styles.cardText}>
                      {tournament.name} · {tournament.status}
                    </Text>
                  ))}
                  <Text style={styles.cardText}>Match Results</Text>
                  {teamPerformance.matches.map((teamMatch) => (
                    <Text key={teamMatch.id} style={styles.cardText}>
                      vs {teamMatch.opponent}: {teamMatch.result} ·{" "}
                      {teamMatch.winner}
                    </Text>
                  ))}
                  <Text style={styles.cardText}>Squad Stats</Text>
                  {teamPerformance.squad.map((player) => (
                    <Text key={`${teamPerformance.teamName}-${player.name}`} style={styles.cardText}>
                      {player.name}: {player.matches} matches, {player.runs} runs,{" "}
                      {player.wickets} wickets, {player.catches} catches
                    </Text>
                  ))}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Profile Picture</Text>
            <ScrollView contentContainerStyle={styles.stickerGrid}>
              {imageDictionary.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleStickerSelect(image)}
                >
                  <Image source={image} style={styles.stickerImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={pickImage}
              style={styles.customImageButton}
            >
              <Text style={styles.customImageButtonText}>
                Choose from Library
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f7",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f0f4f7",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 20,
    textAlign: "center",
  },
  noDataText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePicture: {
    width: 180,
    height: 180,
    borderRadius: 90,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#4CAF50",
  },
  editButton: {
    position: "absolute",
    bottom: 10,
    right: 100,
    backgroundColor: "#4CAF50",
    padding: 5,
    borderRadius: 50,
  },
  customImageButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    marginTop: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  customImageButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  tbl: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#2c3e50",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 18,
    color: "#2c3e50",
    fontWeight: "bold",
    flex: 1,
  },
  detailTextfet: {
    fontSize: 18,
    color: "#2c3e50",
    fontWeight: "bold",
    flex: 1,
  },
  fetchText: {
    fontSize: 22,
    color: "#34495e",
    flex: 2,
    textAlign: "left",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#22B14C",
    textAlign: "left",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#2c3e50",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  statsBlock: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    marginTop: 10,
  },
  cardText: {
    fontSize: 18,
    color: "#2c3e50",
    textAlign: "left",
    marginBottom: 8,
    flex: 1,
  },
  cardText: {
    fontSize: 18,
    color: "#2c3e50",
    textAlign: "left",
    marginBottom: 8,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 15,
    textAlign: "center",
  },
  stickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  stickerImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
  },
});

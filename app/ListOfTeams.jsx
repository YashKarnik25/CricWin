import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Button,
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
} from "firebase/database";
import { database } from "./firebase";
import { LinearGradient } from "expo-linear-gradient";
import Scorecard from "./ScoreCard";
import ScoreScreen from "./ScoreNew";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const AdminHome = () => {
  const [currentState, setCurrentState] = useState("listOfTournaments");
  const [data, setData] = useState({});
  const [isMatchesGenerated, setIsMatchesGenerated] = useState(false);
  const [match, setMatch] = useState({});
  const [battingTeam, setBattingTeam] = useState("");
  const [bowlingTeam, setBowlingTeam] = useState("");
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const Card = ({ data, onDelete }) => (
    <LinearGradient colors={["#A7D129", "#4CAF50"]} style={styles.card}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(data.id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
      <View style={styles.cardContent} id={data.tid}>
        <Text style={styles.tournamentName}>{data.name}</Text>
        <Text style={styles.prizePool}>₹ {data.prizePool}</Text>
        <Text style={styles.tournamentInfo}>Entry Fee: ₹ {data.entryFee}</Text>
        <Text style={styles.tournamentInfo}>Ball Type: {data.ballType}</Text>
        <Text style={styles.tournamentInfo}>Overs: {data.overs}</Text>
        <Text style={styles.tournamentInfo}>Location: {data.location}</Text>
      </View>
    </LinearGradient>
  );

  const MatchCard = ({ data }) => {
    const handlePress = () => {
      setMatch(data);
      setCurrentState("chooseTeams");
    };
    return (
      <View>
        <LinearGradient
          colors={["#d6d6d6", "#5a5a5a"]}
          style={matchCardStyles.card}
        >
          <View style={matchCardStyles.cardContent}>
            <View style={matchCardStyles.teamsContainer}>
              <Text style={matchCardStyles.team}>{data.team1}</Text>
              <Text style={matchCardStyles.vsText}>Vs</Text>
              <Text style={matchCardStyles.team}>{data.team2}</Text>
            </View>
            <TouchableOpacity
              style={matchCardStyles.button}
              onPress={handlePress}
            >
              <Text style={matchCardStyles.buttonText}>Start</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const matchCardStyles = StyleSheet.create({
    card: {
      width: "100%",
      borderRadius: 10,
      padding: 15,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    cardContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    teamsContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    team: {
      fontSize: 20,
      fontWeight: "bold",
    },
    vsText: {
      marginHorizontal: 10,
    },
    button: {
      backgroundColor: "#90ee90",
      padding: 10,
      borderRadius: 5,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
  });

  const fetchTournaments = () => {
    const tournamentsRef = ref(database, "tournaments");
    onValue(tournamentsRef, (snapshot) => {
      const snapData = snapshot.val();
      if (snapData) {
        const tournamentsArray = Object.keys(snapData).map((key) => ({
          id: key,
          ...snapData[key],
        }));
        setTournaments(tournamentsArray);
      } else {
        setTournaments([]);
      }
      setLoading(false);
      setRefreshing(false);
    });
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTournaments();
  };

  const deleteTournament = (tournamentId) => {
    Alert.alert(
      "Delete Tournament",
      "Are you sure you want to delete this tournament? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            remove(ref(database, "tournaments/" + tournamentId))
              .then(() => {
                Alert.alert("Success", "Tournament deleted successfully");
              })
              .catch((error) => {
                Alert.alert(
                  "Error",
                  "Failed to delete tournament: " + error.message
                );
              });
          },
        },
      ]
    );
  };

  const renderTournamentCard = ({ item }) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => {
        setCurrentState("tournamentDetails");
        setData(item);
      }}
      activeOpacity={0.7}
    >
      <BlurView intensity={80} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.tournamentInfo}>
            <Text style={styles.tournamentName}>{item.name}</Text>
            <Text style={styles.tournamentDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteTournament(item.id)}
          >
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Ionicons name="trophy-outline" size={16} color="#4CAF50" />
            <Text style={styles.infoText}>
              ₹{item.prizePool?.toLocaleString() || "0"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={16} color="#4CAF50" />
            <Text style={styles.infoText}>
              Entry Fee: ₹{item.entryFee?.toLocaleString() || "0"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="baseball-outline" size={16} color="#4CAF50" />
            <Text style={styles.infoText}>{item.ballType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#4CAF50" />
            <Text style={styles.infoText}>{item.overs} Overs</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#4CAF50" />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  const ListOfTeams = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading tournaments...</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <LinearGradient colors={["#4CAF50", "#45a049"]} style={styles.header}>
          <Text style={styles.headerTitle}>Tournaments</Text>
          <Text style={styles.headerSubtitle}>
            {tournaments.length}{" "}
            {tournaments.length === 1 ? "Tournament" : "Tournaments"}
          </Text>
        </LinearGradient>

        {tournaments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tournaments found</Text>
          </View>
        ) : (
          <FlatList
            data={tournaments}
            renderItem={renderTournamentCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#4CAF50"]}
                tintColor="#4CAF50"
              />
            }
          />
        )}
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f5f5f5",
    },
    header: {
      padding: 20,
      paddingTop: 60,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 5,
    },
    headerSubtitle: {
      fontSize: 16,
      color: "rgba(255,255,255,0.8)",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: "#666",
    },
    listContainer: {
      padding: 16,
    },
    card: {
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      borderRadius: 15,
      padding: 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    tournamentInfo: {
      flex: 1,
    },
    tournamentName: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 4,
    },
    tournamentDate: {
      fontSize: 14,
      color: "#666",
    },
    deleteButton: {
      padding: 8,
    },
    cardContent: {
      gap: 8,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    infoText: {
      fontSize: 14,
      color: "#666",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    emptyText: {
      marginTop: 10,
      fontSize: 16,
      color: "#666",
    },
  });

  const TournamentDetails = ({
    data,
    setCurrentState,
    setIsMatchesGenerated,
  }) => {
    const detailsStyles = StyleSheet.create({
      container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f5f7fa",
      },
      header: {
        marginBottom: 20,
      },
      backButton: {
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "rgba(0,0,0,0.1)",
      },
      backButtonText: {
        color: "#333",
        fontSize: 16,
        fontWeight: "500",
        marginLeft: 4,
      },
      headerContent: {
        alignItems: "center",
        marginTop: 10,
      },
      tournamentBadge: {
        backgroundColor: "#4CAF50",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
      },
      badgeText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
      },
      tournamentName: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
        marginBottom: 8,
      },
      location: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
      },
      locationText: {
        fontSize: 16,
        color: "#666",
        marginLeft: 6,
      },
      detailsCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        elevation: 3,
      },
      cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 15,
        color: "#333",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingBottom: 10,
      },
      infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
      },
      infoLabel: {
        fontSize: 16,
        color: "#666",
        flexDirection: "row",
        alignItems: "center",
      },
      infoLabelText: {
        marginLeft: 8,
      },
      infoValue: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
      },
      highlightValue: {
        color: "#4CAF50",
        fontWeight: "700",
      },
      teamsSection: {
        marginBottom: 20,
      },
      teamsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
      },
      teamsTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#333",
      },
      teamsCount: {
        fontSize: 16,
        color: "#666",
        backgroundColor: "#f0f0f0",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
      },
      teamsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        marginBottom: 20,
      },
      teamCard: {
        backgroundColor: "#fff",
        padding: 14,
        margin: 6,
        borderRadius: 10,
        width: "47%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#e0e0e0",
      },
      teamCardContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      },
      teamIcon: {
        marginRight: 8,
      },
      teamText: {
        color: "#333",
        fontSize: 16,
        fontWeight: "600",
      },
      noTeamsContainer: {
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 30,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#eee",
        borderStyle: "dashed",
      },
      noTeamsText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginTop: 15,
        lineHeight: 22,
      },
      fullWidthGenerateButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        marginTop: 20,
        width: "100%",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
      },
      generateButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
        marginLeft: 10,
      },
    });
    const matchesRef = ref(database, "matches");

    const handlePress = async () => {
      if (!data.teams || data.teams.length === 0) {
        Alert.alert(
          "No Teams Registered",
          "Please register teams before generating fixtures.",
          [{ text: "OK" }]
        );
        return;
      }

      let isMatch = false;
      try {
        const matchesQuery = query(
          matchesRef,
          orderByChild("tournamentId"),
          equalTo(data.id)
        );
        const snapshot = await get(matchesQuery);
        if (snapshot.exists()) {
          setCurrentState("matches");
          isMatch = true;
        }
        if (!isMatch) {
          for (let i = 0; i < data.teams.length; i += 2) {
            const newMatch = {
              team1: data.teams[i],
              team2: data.teams[i + 1],
              tournamentId: data.id,
              status: "pending",
            };
            await push(matchesRef, newMatch);
          }
          Alert.alert("Success", "Fixtures generated successfully!");
          setIsMatchesGenerated(true);
          setCurrentState("matches");
        }
      } catch (error) {
        Alert.alert("Error", "Error occurred: " + error.message);
      }
    };

    return (
      <ScrollView
        style={detailsStyles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={detailsStyles.header}>
          <TouchableOpacity
            style={detailsStyles.backButton}
            onPress={() => setCurrentState("listOfTournaments")}
          >
            <Ionicons name="arrow-back" size={18} color="#333" />
            <Text style={detailsStyles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={detailsStyles.headerContent}>
            <View style={detailsStyles.tournamentBadge}>
              <Text style={detailsStyles.badgeText}>TOURNAMENT</Text>
            </View>
            <Text style={detailsStyles.tournamentName}>{data.name}</Text>
            <View style={detailsStyles.location}>
              <Ionicons name="location-outline" size={18} color="#666" />
              <Text style={detailsStyles.locationText}>{data.location}</Text>
            </View>
          </View>
        </View>

        <View style={detailsStyles.detailsCard}>
          <Text style={detailsStyles.cardTitle}>Tournament Information</Text>

          <View style={detailsStyles.infoRow}>
            <View style={detailsStyles.infoLabel}>
              <Ionicons name="trophy-outline" size={18} color="#4CAF50" />
              <Text style={detailsStyles.infoLabelText}>Prize Pool</Text>
            </View>
            <Text
              style={[detailsStyles.infoValue, detailsStyles.highlightValue]}
            >
              ₹ {data.prizePool?.toLocaleString() || "0"}
            </Text>
          </View>

          <View style={detailsStyles.infoRow}>
            <View style={detailsStyles.infoLabel}>
              <Ionicons name="cash-outline" size={18} color="#4CAF50" />
              <Text style={detailsStyles.infoLabelText}>Entry Fee</Text>
            </View>
            <Text style={detailsStyles.infoValue}>
              ₹ {data.entryFee?.toLocaleString() || "0"}
            </Text>
          </View>

          <View style={detailsStyles.infoRow}>
            <View style={detailsStyles.infoLabel}>
              <Ionicons name="baseball-outline" size={18} color="#4CAF50" />
              <Text style={detailsStyles.infoLabelText}>Ball Type</Text>
            </View>
            <Text style={detailsStyles.infoValue}>{data.ballType}</Text>
          </View>

          <View style={[detailsStyles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={detailsStyles.infoLabel}>
              <Ionicons name="time-outline" size={18} color="#4CAF50" />
              <Text style={detailsStyles.infoLabelText}>Overs</Text>
            </View>
            <Text style={detailsStyles.infoValue}>{data.overs}</Text>
          </View>
        </View>

        <View style={detailsStyles.teamsSection}>
          <View style={detailsStyles.teamsHeader}>
            <Text style={detailsStyles.teamsTitle}>Registered Teams</Text>
            {data.teams && data.teams.length > 0 && (
              <Text style={detailsStyles.teamsCount}>{data.teams.length}</Text>
            )}
          </View>

          {data.teams && data.teams.length > 0 ? (
            <View style={detailsStyles.teamsContainer}>
              {data.teams.map((team, index) => (
                <View key={index} style={detailsStyles.teamCard}>
                  <View style={detailsStyles.teamCardContent}>
                    <Ionicons
                      name="people"
                      size={18}
                      color="#4CAF50"
                      style={detailsStyles.teamIcon}
                    />
                    <Text style={detailsStyles.teamText}>{team}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={detailsStyles.noTeamsContainer}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={detailsStyles.noTeamsText}>
                No teams have registered for this tournament yet. Teams will
                appear here once they register.
              </Text>
            </View>
          )}

          {data.teams && data.teams.length > 0 && (
            <TouchableOpacity
              style={detailsStyles.fullWidthGenerateButton}
              onPress={handlePress}
            >
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={detailsStyles.generateButtonText}>Fixtures</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  const Matches = ({ tid }) => {
    const [matches, setMatches] = useState([]);
    useEffect(() => {
      const matchesRef = ref(database, "matches");
      const matchesQuery = query(
        matchesRef,
        orderByChild("tournamentId"),
        equalTo(tid)
      );
      onValue(matchesQuery, (snapshot) => {
        if (snapshot.exists()) {
          const matchesData = snapshot.val();
          const key = Object.keys(matchesData)[0];
          const status = matchesData[key].status;
          if (status === "pending") {
            const matchesArray = Object.keys(matchesData).map((key) => ({
              id: key,
              ...matchesData[key],
            }));
            setMatches(matchesArray);
          }
        }
      });
    }, [tid]);

    const matchesStyles = StyleSheet.create({
      container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f5f7fa",
      },
      header: {
        marginBottom: 20,
      },
      backButton: {
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "rgba(0,0,0,0.1)",
      },
      backButtonText: {
        color: "#333",
        fontSize: 16,
        fontWeight: "500",
        marginLeft: 4,
      },
      headerContent: {
        alignItems: "center",
        marginTop: 10,
        marginBottom: 20,
      },
      matchesBadge: {
        backgroundColor: "#4CAF50",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
      },
      badgeText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
      },
      titleText: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
      },
      subtitleText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginTop: 5,
      },
      matchCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        elevation: 3,
        overflow: "hidden",
      },
      matchCardHeader: {
        backgroundColor: "#4CAF50",
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      },
      matchNumberText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
      },
      matchStatusBadge: {
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
      },
      matchStatusText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "500",
      },
      matchContent: {
        padding: 16,
      },
      teamsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
      },
      teamContainer: {
        flex: 1,
        alignItems: "center",
      },
      teamName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        textAlign: "center",
        marginTop: 8,
      },
      vsContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f0f0f0",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 16,
      },
      vsText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#666",
      },
      actionButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        marginTop: 16,
      },
      actionButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
      },
      emptyContainer: {
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 40,
        borderRadius: 16,
        marginTop: 20,
        borderWidth: 1,
        borderColor: "#eee",
        borderStyle: "dashed",
      },
      emptyText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginTop: 15,
        lineHeight: 22,
      },
    });

    return (
      <ScrollView
        style={matchesStyles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={matchesStyles.header}>
          <TouchableOpacity
            style={matchesStyles.backButton}
            onPress={() => setCurrentState("tournamentDetails")}
          >
            <Ionicons name="arrow-back" size={18} color="#333" />
            <Text style={matchesStyles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={matchesStyles.headerContent}>
            <View style={matchesStyles.matchesBadge}>
              <Text style={matchesStyles.badgeText}>FIXTURES</Text>
            </View>
            <Text style={matchesStyles.titleText}>Tournament Matches</Text>
            {matches.length > 0 && (
              <Text style={matchesStyles.subtitleText}>
                {matches.length} {matches.length === 1 ? "match" : "matches"}{" "}
                scheduled
              </Text>
            )}
          </View>
        </View>

        {matches.length > 0 ? (
          matches.map((data, index) => (
            <TouchableOpacity
              key={data.id}
              activeOpacity={0.8}
              onPress={() => {
                setMatch(data);
                setCurrentState("chooseTeams");
              }}
            >
              <View style={matchesStyles.matchCard}>
                <View style={matchesStyles.matchCardHeader}>
                  <Text style={matchesStyles.matchNumberText}>
                    Match #{index + 1}
                  </Text>
                  <View style={matchesStyles.matchStatusBadge}>
                    <Text style={matchesStyles.matchStatusText}>Pending</Text>
                  </View>
                </View>

                <View style={matchesStyles.matchContent}>
                  <View style={matchesStyles.teamsContainer}>
                    <View style={matchesStyles.teamContainer}>
                      <Ionicons
                        name="people-circle"
                        size={40}
                        color="#4CAF50"
                      />
                      <Text style={matchesStyles.teamName}>{data.team1}</Text>
                    </View>

                    <View style={matchesStyles.vsContainer}>
                      <Text style={matchesStyles.vsText}>VS</Text>
                    </View>

                    <View style={matchesStyles.teamContainer}>
                      <Ionicons
                        name="people-circle"
                        size={40}
                        color="#4CAF50"
                      />
                      <Text style={matchesStyles.teamName}>{data.team2}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={matchesStyles.actionButton}
                    onPress={() => {
                      setMatch(data);
                      setCurrentState("chooseTeams");
                    }}
                  >
                    <Ionicons name="play" size={16} color="#fff" />
                    <Text style={matchesStyles.actionButtonText}>
                      Start Match
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={matchesStyles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={matchesStyles.emptyText}>
              No matches have been scheduled yet. Generate fixtures to schedule
              matches.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const ChooseTeams = ({ match }) => {
    const chooseTeamStyle = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: "#f5f7fa",
        padding: 16,
      },
      header: {
        marginBottom: 30,
      },
      backButton: {
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "rgba(0,0,0,0.1)",
      },
      backButtonText: {
        color: "#333",
        fontSize: 16,
        fontWeight: "500",
        marginLeft: 4,
      },
      headerContent: {
        alignItems: "center",
        marginTop: 10,
        marginBottom: 10,
      },
      headerBadge: {
        backgroundColor: "#4CAF50",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
      },
      badgeText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
      },
      titleText: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
      },
      subtitleText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginTop: 8,
        marginHorizontal: 20,
      },
      matchInfoCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        marginBottom: 25,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        elevation: 3,
      },
      matchTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        textAlign: "center",
        marginBottom: 5,
      },
      matchVsText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 15,
      },
      teamsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
      },
      teamCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        width: "47%",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#e0e0e0",
      },
      teamCardSelected: {
        backgroundColor: "#e8f5e9",
        borderColor: "#4CAF50",
        borderWidth: 2,
      },
      teamIcon: {
        marginBottom: 10,
      },
      teamName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        textAlign: "center",
      },
      instructions: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 20,
        marginTop: 10,
      },
      continueButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        marginTop: 20,
        alignSelf: "center",
        width: "80%",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
      },
      buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
        marginLeft: 8,
      },
    });

    const [selectedTeam, setSelectedTeam] = useState(null);

    const handleTeamSelect = (team) => {
      setSelectedTeam(team);
    };

    const handleContinue = () => {
      if (selectedTeam === match.team1) {
        setBattingTeam(match.team1);
        setBowlingTeam(match.team2);
      } else {
        setBattingTeam(match.team2);
        setBowlingTeam(match.team1);
      }
      setCurrentState("scoreCard");
    };

    return (
      <ScrollView
        style={chooseTeamStyle.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={chooseTeamStyle.header}>
          <TouchableOpacity
            style={chooseTeamStyle.backButton}
            onPress={() => setCurrentState("matches")}
          >
            <Ionicons name="arrow-back" size={18} color="#333" />
            <Text style={chooseTeamStyle.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={chooseTeamStyle.headerContent}>
            <View style={chooseTeamStyle.headerBadge}>
              <Text style={chooseTeamStyle.badgeText}>MATCH SETUP</Text>
            </View>
            <Text style={chooseTeamStyle.titleText}>Choose Batting Team</Text>
            <Text style={chooseTeamStyle.subtitleText}>
              Select which team will bat first in this match
            </Text>
          </View>
        </View>

        <View style={chooseTeamStyle.matchInfoCard}>
          <Text style={chooseTeamStyle.matchTitle}>Match Details</Text>
          <Text style={chooseTeamStyle.matchVsText}>
            {match.team1} vs {match.team2}
          </Text>
        </View>

        <Text style={chooseTeamStyle.instructions}>
          Tap on a team to select who will bat first
        </Text>

        <View style={chooseTeamStyle.teamsContainer}>
          <TouchableOpacity
            style={[
              chooseTeamStyle.teamCard,
              selectedTeam === match.team1 && chooseTeamStyle.teamCardSelected,
            ]}
            onPress={() => handleTeamSelect(match.team1)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="people-circle"
              size={50}
              color="#4CAF50"
              style={chooseTeamStyle.teamIcon}
            />
            <Text style={chooseTeamStyle.teamName}>{match.team1}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              chooseTeamStyle.teamCard,
              selectedTeam === match.team2 && chooseTeamStyle.teamCardSelected,
            ]}
            onPress={() => handleTeamSelect(match.team2)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="people-circle"
              size={50}
              color="#4CAF50"
              style={chooseTeamStyle.teamIcon}
            />
            <Text style={chooseTeamStyle.teamName}>{match.team2}</Text>
          </TouchableOpacity>
        </View>

        {selectedTeam && (
          <TouchableOpacity
            style={chooseTeamStyle.continueButton}
            onPress={handleContinue}
          >
            <Ionicons name="play" size={18} color="#fff" />
            <Text style={chooseTeamStyle.buttonText}>Start Match</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  if (currentState === "listOfTournaments") {
    return <ListOfTeams />;
  } else if (currentState === "tournamentDetails") {
    return (
      <TournamentDetails
        data={data}
        setCurrentState={setCurrentState}
        setIsMatchesGenerated={setIsMatchesGenerated}
      />
    );
  } else if (currentState === "matches") {
    return <Matches tid={data.id} />;
  } else if (currentState === "chooseTeams") {
    return <ChooseTeams match={match} />;
  } else if (currentState === "scoreCard") {
    return (
      <ScoreScreen
        match={match}
        battingTeam1={battingTeam}
        bowlingTeam1={bowlingTeam}
      />
    );
  }
};

export default AdminHome;

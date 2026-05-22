import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { database } from "../firebase";
import { ref, onValue, remove } from "firebase/database";

const ManageTeams = ({ navigation }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const teamsRef = ref(database, "teams");
    const unsubscribe = onValue(teamsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const teamsList = Object.entries(data).map(([id, team]) => ({
          id,
          ...team,
        }));
        setTeams(teamsList);
      } else {
        setTeams([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteTeam = (teamId) => {
    Alert.alert("Delete Team", "Are you sure you want to delete this team?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await remove(ref(database, `teams/${teamId}`));
            Alert.alert("Success", "Team deleted successfully");
          } catch (error) {
            Alert.alert("Error", "Failed to delete team");
          }
        },
      },
    ]);
  };

  const renderTeamCard = ({ item }) => (
    <BlurView intensity={80} style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.teamName}>{item.teamName}</Text>
          {/* <Text style={styles.teamInfo}>
            {item.players?.length || 0} Players •{" "}
            {item.tournaments?.length || 0} Tournaments
          </Text> */}
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteTeam(item.id)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={16} color="#4CAF50" />
          <Text style={styles.infoText}>{item.email}</Text>
        </View>
        {/* <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color="#4CAF50" />
          <Text style={styles.infoText}>{item.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#4CAF50" />
          <Text style={styles.infoText}>{item.location}</Text>
        </View> */}
      </View>
    </BlurView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#4CAF50", "#45a049"]} style={styles.header}>
        <Text style={styles.headerTitle}>Manage Teams</Text>
      </LinearGradient>

      <FlatList
        data={teams}
        renderItem={renderTeamCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    alignItems: "center",
    marginBottom: 12,
  },
  teamName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  teamInfo: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
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
});

export default ManageTeams;

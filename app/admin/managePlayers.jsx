import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { database } from "../firebase";
import { ref, onValue, remove } from "firebase/database";

const ManagePlayers = ({ navigation }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const playersRef = ref(database, "user");
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const playersList = Object.entries(data).map(([id, player]) => ({
          id,
          ...player,
        }));
        setPlayers(playersList);
      } else {
        setPlayers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeletePlayer = (playerId) => {
    Alert.alert(
      "Delete Player",
      "Are you sure you want to delete this player?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(ref(database, `players/${playerId}`));
              Alert.alert("Success", "Player deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete player");
            }
          },
        },
      ]
    );
  };

  const renderPlayerCard = ({ item }) => (
    <BlurView intensity={80} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.playerInfo}>
          {item.photo && (
            <Image source={{ uri: item.photo }} style={styles.playerPhoto} />
          )}
          <View>
            <Text style={styles.playerName}>{item.name}</Text>
            <Text style={styles.playerRole}>{item.role}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeletePlayer(item.id)}
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
          <Ionicons name="calendar-outline" size={16} color="#4CAF50" />
          <Text style={styles.infoText}>{item.age} years</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="trophy-outline" size={16} color="#4CAF50" />
          <Text style={styles.infoText}>{item.team || "No Team"}</Text>
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
        <Text style={styles.headerTitle}>Manage Players</Text>
      </LinearGradient>

      <FlatList
        data={players}
        renderItem={renderPlayerCard}
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
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playerPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  playerRole: {
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

export default ManagePlayers;

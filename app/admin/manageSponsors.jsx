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
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { database } from "../firebase";
import { ref, onValue, remove } from "firebase/database";

const ManageSponsors = ({ navigation }) => {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("latest");

  // Duration mapping to help with sorting
  const durationMapping = {
    "15 days": 15,
    "1 month": 30,
    "3 month": 90,
  };

  useEffect(() => {
    const sponsorsRef = ref(database, "sponsor");
    const unsubscribe = onValue(sponsorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sponsorsList = Object.entries(data).map(([id, sponsor]) => ({
          id,
          ...sponsor,
          timestamp: sponsor.timestamp || Date.now(), // Ensure timestamp exists
        }));
        setSponsors(sponsorsList);
      } else {
        setSponsors([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to sort sponsors based on selected criteria
  const getSortedSponsors = () => {
    if (!sponsors.length) return [];

    switch (sortBy) {
      case "latest":
        return [...sponsors].sort((a, b) => b.timestamp - a.timestamp);
      case "oldest":
        return [...sponsors].sort((a, b) => a.timestamp - b.timestamp);
      case "highPrice":
        return [...sponsors].sort((a, b) => b.amount - a.amount);
      case "lowPrice":
        return [...sponsors].sort((a, b) => a.amount - b.amount);
      case "longDuration":
        return [...sponsors].sort((a, b) => {
          const durationA = durationMapping[a.duration] || 0;
          const durationB = durationMapping[b.duration] || 0;
          return durationB - durationA;
        });
      case "shortDuration":
        return [...sponsors].sort((a, b) => {
          const durationA = durationMapping[a.duration] || 0;
          const durationB = durationMapping[b.duration] || 0;
          return durationA - durationB;
        });
      default:
        return sponsors;
    }
  };

  const handleDeleteSponsor = (sponsorId) => {
    Alert.alert(
      "Delete Sponsor",
      "Are you sure you want to delete this sponsor?",
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
              const sponsorRef = ref(database, `sponsor/${sponsorId}`);
              await remove(sponsorRef);
              Alert.alert("Success", "Sponsor deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete sponsor");
              console.error("Error deleting sponsor:", error);
            }
          },
        },
      ]
    );
  };

  // Render a sort option button
  const SortButton = ({ title, value }) => (
    <TouchableOpacity
      style={[styles.sortButton, sortBy === value && styles.sortButtonActive]}
      onPress={() => setSortBy(value)}
    >
      <Text
        style={[
          styles.sortButtonText,
          sortBy === value && styles.sortButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderSponsorCard = ({ item }) => (
    <BlurView intensity={80} style={styles.sponsorCard}>
      <View style={styles.sponsorHeader}>
        <View style={styles.sponsorInfo}>
          <Text style={styles.sponsorName}>{item.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <View
            style={[
              styles.modeBadge,
              item.mode === "digital"
                ? styles.digitalBadge
                : styles.physicalBadge,
            ]}
          >
            <Text style={styles.modeText}>{item.mode}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteSponsor(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sponsorDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Duration: {item.duration}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Amount: ₹{item.amount}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.timestamp
              ? new Date(item.timestamp).toLocaleDateString()
              : "Unknown date"}
          </Text>
        </View>
      </View>
    </BlurView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading sponsors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#4CAF50", "#45a049"]} style={styles.header}>
        <Text style={styles.headerTitle}>Manage Sponsors</Text>
        <Text style={styles.headerSubtitle}>
          {sponsors.length} {sponsors.length === 1 ? "Sponsor" : "Sponsors"}
        </Text>
      </LinearGradient>

      {/* Sorting Controls */}
      <View style={styles.sortingContainer}>
        <Text style={styles.sortingLabel}>Sort by:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortingScroll}
        >
          <SortButton title="Latest" value="latest" />
          <SortButton title="Oldest" value="oldest" />
          <SortButton title="Highest Price" value="highPrice" />
          <SortButton title="Lowest Price" value="lowPrice" />
          <SortButton title="Longest Duration" value="longDuration" />
          <SortButton title="Shortest Duration" value="shortDuration" />
        </ScrollView>
      </View>

      {sponsors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No sponsors found</Text>
        </View>
      ) : (
        <FlatList
          data={getSortedSponsors()}
          renderItem={renderSponsorCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#fff",
    marginTop: 5,
  },
  sortingContainer: {
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sortingLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sortingScroll: {
    flexDirection: "row",
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f0f0f0",
  },
  sortButtonActive: {
    backgroundColor: "#4CAF50",
  },
  sortButtonText: {
    fontSize: 14,
    color: "#333",
  },
  sortButtonTextActive: {
    color: "#fff",
    fontWeight: "bold",
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
  sponsorCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  sponsorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  sponsorInfo: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sponsorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginRight: 10,
  },
  modeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  digitalBadge: {
    backgroundColor: "#E8F5E9",
  },
  physicalBadge: {
    backgroundColor: "#FFF3E0",
  },
  modeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  sponsorDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  deleteButton: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});

export default ManageSponsors;

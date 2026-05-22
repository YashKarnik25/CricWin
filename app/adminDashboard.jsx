import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { database } from "./firebase";
import { ref, onValue, query, orderByChild } from "firebase/database";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <View style={[styles.statCard, { backgroundColor: color }]}>
    <View style={styles.statIcon}>
      <Ionicons name={icon} size={24} color="#fff" />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

const ProfitCard = ({ title, amount, percentage, trend }) => (
  <View style={styles.profitCard}>
    <Text style={styles.profitTitle}>{title}</Text>
    <Text style={styles.profitAmount}>₹{amount.toLocaleString()}</Text>
    <View style={styles.profitTrend}>
      <Text
        style={[
          styles.profitPercentage,
          { color: trend === "up" ? "#4CAF50" : "#f44336" },
        ]}
      >
        {trend === "up" ? "↑" : "↓"} {percentage}%
      </Text>
    </View>
  </View>
);

const AdminDashboard = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalTournaments: 0,
    activeTournaments: 0,
    totalTeams: 0,
    totalPlayers: 0,
    totalRevenue: 0,
    totalPrizePool: 0,
    totalEntryFees: 0,
    totalSponsors: 0,
    upcomingTournaments: 0,
    completedTournaments: 0,
    totalMatches: 0,
    totalWinners: 0,
  });

  const [loading, setLoading] = useState(true);
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [topTeams, setTopTeams] = useState([]);
  const [navigationHistory, setNavigationHistory] = useState([]);

  useEffect(() => {
    const tournamentsRef = ref(database, "tournaments");
    const teamsRef = ref(database, "teams");
    const sponsorsRef = ref(database, "sponsor");

    const unsubscribeTournaments = onValue(tournamentsRef, (snapshot) => {
      const tournaments = snapshot.val() || {};
      const total = Object.keys(tournaments).length;
      const active = Object.values(tournaments).filter(
        (tournament) => new Date(tournament.date) >= new Date()
      ).length;
      const completed = Object.values(tournaments).filter(
        (tournament) => new Date(tournament.date) < new Date()
      ).length;
      const upcoming = Object.values(tournaments).filter(
        (tournament) => new Date(tournament.date) > new Date()
      ).length;

      const totalEntryFees = Object.values(tournaments).reduce(
        (acc, tournament) => acc + (tournament.entryFee || 0),
        0
      );
      const totalPrizePool = Object.values(tournaments).reduce(
        (acc, tournament) => acc + (tournament.prizePool || 0),
        0
      );

      const recent = Object.values(tournaments)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      setRecentTournaments(recent);
      setStats((prev) => ({
        ...prev,
        totalTournaments: total,
        activeTournaments: active,
        completedTournaments: completed,
        upcomingTournaments: upcoming,
        totalEntryFees,
        totalPrizePool,
        totalRevenue: totalEntryFees,
      }));
    });

    const unsubscribeTeams = onValue(teamsRef, (snapshot) => {
      const teams = snapshot.val() || {};
      const total = Object.keys(teams).length;
      const totalPlayers = Object.values(teams).reduce(
        (acc, team) => acc + (team.players?.length || 0),
        0
      );

      const top = Object.values(teams)
        .sort((a, b) => (b.wins || 0) - (a.wins || 0))
        .slice(0, 5);

      setTopTeams(top);
      setStats((prev) => ({ ...prev, totalTeams: total, totalPlayers }));
    });

    const unsubscribeSponsors = onValue(sponsorsRef, (snapshot) => {
      const sponsors = snapshot.val() || {};
      const total = Object.keys(sponsors).length;
      setStats((prev) => ({ ...prev, totalSponsors: total }));
    });

    setLoading(false);

    return () => {
      unsubscribeTournaments();
      unsubscribeTeams();
      unsubscribeSponsors();
    };
  }, []);

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
      const lastState = newHistory[newHistory.length - 1] || "Home";
      navigation.navigate(lastState);
      return newHistory;
    });
  };

  const handleLogout = () => {
    navigation.navigate("UserLayout", { screen: "Home" });
    return;
  };

  const menu = [
    {
      title: "Add Tournament",
      icon: "trophy",
      screen: "Add",
      color: "#4CAF50",
    },
    {
      title: "View Tournaments",
      icon: "list",
      screen: "Tournaments",
      color: "#E91E63",
    },

    {
      title: "Manage Teams",
      icon: "people",
      screen: "ManageTeams",
      color: "#2196F3",
    },
    {
      title: "Manage Sponsors",
      icon: "business",
      screen: "ManageSponsors",
      color: "#9C27B0",
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.title}
      style={styles.menuItem}
      onPress={() => navigation.navigate(item.screen)}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={24} color="#fff" />
      </View>
      <Text style={styles.menuItemTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#4CAF50", "#45a049"]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>Welcome back, Admin!</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon="cash-outline"
          color="#4CAF50"
          subtitle="From entry fees"
        />
        <StatCard
          title="Active Tournaments"
          value={stats.activeTournaments}
          icon="trophy-outline"
          color="#2196F3"
          subtitle={`${stats.upcomingTournaments} upcoming`}
        />
        <StatCard
          title="Total Teams"
          value={stats.totalTeams}
          icon="people-outline"
          color="#FF9800"
          subtitle={`${stats.totalTeams * 11} players`}
        />
        <StatCard
          title="Total Sponsors"
          value={stats.totalSponsors}
          icon="business-outline"
          color="#9C27B0"
          subtitle="Active sponsors"
        />
      </View>

      <View style={styles.profitSection}>
        <Text style={styles.sectionTitle}>Financial Overview</Text>
        <View style={styles.profitGrid}>
          <ProfitCard
            title="Total Entry Fees"
            amount={stats.totalEntryFees}
            percentage={15}
            trend="up"
          />
          <ProfitCard
            title="Total Prize Pool"
            amount={stats.totalPrizePool}
            percentage={8}
            trend="up"
          />
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>Quick Actions</Text>
        <View style={styles.menuGrid}>{menu.map(renderMenuItem)}</View>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Tournaments</Text>
        {recentTournaments.map((tournament, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{tournament.name}</Text>
              <Text style={styles.activityDate}>
                {new Date(tournament.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.activityStatus}>
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      new Date(tournament.date) >= new Date()
                        ? "#4CAF50"
                        : "#f44336",
                  },
                ]}
              >
                {new Date(tournament.date) >= new Date()
                  ? "Upcoming"
                  : "Completed"}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  logoutText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 15,
    justifyContent: "space-between",
  },
  statCard: {
    width: (width - 45) / 2,
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  statTitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  statSubtitle: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
  },
  profitSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  profitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  profitCard: {
    width: (width - 60) / 2,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  profitTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  profitAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  profitTrend: {
    flexDirection: "row",
    alignItems: "center",
  },
  profitPercentage: {
    fontSize: 14,
    fontWeight: "600",
  },
  menuContainer: {
    padding: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuItem: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: "center",
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginTop: 4,
  },
  recentActivity: {
    padding: 20,
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  activityDate: {
    fontSize: 14,
    color: "#666",
  },
  activityStatus: {
    marginLeft: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  topTeams: {
    padding: 20,
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  teamItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  teamRank: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    width: 30,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  teamStats: {
    fontSize: 14,
    color: "#666",
  },
});

export default AdminDashboard;

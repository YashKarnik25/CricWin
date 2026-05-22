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

const { width } = Dimensions.get("window");

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <View style={[styles.statCard, { backgroundColor: color }]}>
    <View style={styles.statIcon}>{icon}</View>
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

const AdminHome = ({ navigation }) => {
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

  useEffect(() => {
    const tournamentsRef = ref(database, "tournaments");
    const teamsRef = ref(database, "teams");
    const sponsorsRef = ref(database, "sponsors");

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

  const menuItems = [
    {
      title: "Add Tournament",
      icon: "🏆",
      screen: "addTournament",
      color: "#4CAF50",
    },
    {
      title: "Manage Teams",
      icon: "👥",
      screen: "ListOfTeams",
      color: "#2196F3",
    },
    {
      title: "Tournament History",
      icon: "📊",
      screen: "History",
      color: "#FF9800",
    },
    {
      title: "Add Sponsor",
      icon: "💰",
      screen: "addSponsor",
      color: "#9C27B0",
    },
    {
      title: "Reports",
      icon: "📈",
      screen: "Reports",
      color: "#E91E63",
    },
    {
      title: "Settings",
      icon: "⚙️",
      screen: "Settings",
      color: "#607D8B",
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

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#4CAF50", "#45a049"]} style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back, Admin!</Text>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon="💰"
          color="#4CAF50"
          subtitle="From entry fees"
        />
        <StatCard
          title="Active Tournaments"
          value={stats.activeTournaments}
          icon="⚡"
          color="#2196F3"
          subtitle={`${stats.upcomingTournaments} upcoming`}
        />
        <StatCard
          title="Total Teams"
          value={stats.totalTeams}
          icon="👥"
          color="#FF9800"
          subtitle={`${stats.totalPlayers} players`}
        />
        <StatCard
          title="Total Sponsors"
          value={stats.totalSponsors}
          icon="🤝"
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
          <ProfitCard
            title="Net Profit"
            amount={stats.totalEntryFees - stats.totalPrizePool}
            percentage={12}
            trend="up"
          />
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>Quick Actions</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: item.color }]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
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

      <View style={styles.topTeams}>
        <Text style={styles.sectionTitle}>Top Performing Teams</Text>
        {topTeams.map((team, index) => (
          <View key={index} style={styles.teamItem}>
            <Text style={styles.teamRank}>#{index + 1}</Text>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamStats}>
              Wins: {team.wins || 0} | Matches: {team.matches || 0}
            </Text>
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
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  menuText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
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

export default AdminHome;

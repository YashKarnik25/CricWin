import React, { useContext, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { ref, get } from "firebase/database";
import { database } from "./firebase";
import { UserContext } from "./_layout";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";

const { width, height } = Dimensions.get("window");

const ResultBadge = ({ result }) => {
  let colors, text;

  switch (result) {
    case "won":
      colors = ["#4CAF50", "#2E7D32"];
      text = "WON";
      break;
    case "lost":
      colors = ["#F44336", "#C62828"];
      text = "LOST";
      break;
    default:
      colors = ["#FFC107", "#FFA000"];
      text = "DRAW";
  }

  return (
    <LinearGradient
      colors={colors}
      style={styles.resultBadge}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <Text style={[styles.resultText, { marginRight: 5, padding: 0 }]}>
        {text}
      </Text>
    </LinearGradient>
  );
};

const MatchStats = ({ stats }) => {
  return <View style={styles.statsContainer}></View>;
};

const ScorecardModal = ({ visible, match, onClose }) => {
  if (!match) return null;

  const [activeTab, setActiveTab] = useState(0);

  const team1 = match.teams.team1;
  const team2 = match.teams.team2;
  const team1Score = match.scoreCard?.firstInning?.team1TotalRuns || 0;
  const team2Score = match.scoreCard?.secondInning?.team2TotalRuns || 0;
  const team1Wickets = match.scoreCard?.firstInning?.team1Wickets || 0;
  const team2Wickets = match.scoreCard?.secondInning?.team2Wickets || 0;
  const overs = match.scoreCard?.firstInning.overs || 0;

  let resultText = "";
  let winnerColor = "";
  let winnerTeam = "";

  if (team1Score > team2Score) {
    resultText = `${team1} won by ${team1Score - team2Score} runs`;
    winnerColor = "#4CAF50";
    winnerTeam = team1;
  } else if (team2Score > team1Score) {
    resultText = `${team2} won by ${team2Score - team1Score} runs`;
    winnerColor = "#1976D2";
    winnerTeam = team2;
  } else {
    resultText = "Match Drawn";
    winnerColor = "#FFC107";
    winnerTeam = "";
  }

  const matchDate = match.date ? new Date(match.date) : new Date();
  const formattedDate = matchDate.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const generateBattingCard = (teamName, totalRuns, wickets) => {
    const playerPrefix = teamName.substring(0, 3).toUpperCase();

    const mainBatsmanScore = Math.floor(totalRuns * 0.4);
    const secondBatsmanScore = Math.floor(totalRuns * 0.25);
    const thirdBatsmanScore = Math.floor(totalRuns * 0.15);
    const remainingRuns =
      totalRuns - mainBatsmanScore - secondBatsmanScore - thirdBatsmanScore;

    return [
      {
        name: `${playerPrefix}-1`,
        runs: mainBatsmanScore,
        balls: Math.floor(mainBatsmanScore * 1.2),
        fours: Math.floor(mainBatsmanScore / 8),
        sixes: Math.floor(mainBatsmanScore / 20),
        strikeRate: (
          (mainBatsmanScore / (mainBatsmanScore * 1.2)) *
          100
        ).toFixed(1),
        status: "c & b",
      },
      {
        name: `${playerPrefix}-2`,
        runs: secondBatsmanScore,
        balls: Math.floor(secondBatsmanScore * 1.3),
        fours: Math.floor(secondBatsmanScore / 10),
        sixes: Math.floor(secondBatsmanScore / 24),
        strikeRate: (
          (secondBatsmanScore / (secondBatsmanScore * 1.3)) *
          100
        ).toFixed(1),
        status: "b",
      },
      {
        name: `${playerPrefix}-3`,
        runs: thirdBatsmanScore,
        balls: Math.floor(thirdBatsmanScore * 1.1),
        fours: Math.floor(thirdBatsmanScore / 12),
        sixes: Math.floor(thirdBatsmanScore / 30),
        strikeRate: (
          (thirdBatsmanScore / (thirdBatsmanScore * 1.1)) *
          100
        ).toFixed(1),
        status: "lbw",
      },
      {
        name: `${playerPrefix}-4`,
        runs: Math.floor(remainingRuns * 0.6),
        balls: Math.floor(remainingRuns * 0.6 * 1.2),
        fours: Math.floor((remainingRuns * 0.6) / 15),
        sixes: Math.floor((remainingRuns * 0.6) / 36),
        strikeRate: (
          ((remainingRuns * 0.6) / (remainingRuns * 0.6 * 1.2)) *
          100
        ).toFixed(1),
        status: "not out",
      },
      {
        name: `${playerPrefix}-5`,
        runs: Math.floor(remainingRuns * 0.4),
        balls: Math.floor(remainingRuns * 0.4 * 1.1),
        fours: Math.floor((remainingRuns * 0.4) / 16),
        sixes: 0,
        strikeRate: (
          ((remainingRuns * 0.4) / (remainingRuns * 0.4 * 1.1)) *
          100
        ).toFixed(1),
        status: "not out",
      },
    ];
  };

  const generateBowlingCard = (teamName, wickets, runsAgainst) => {
    const playerPrefix = teamName.substring(0, 3).toUpperCase();

    const mainBowlerWickets = Math.min(3, Math.ceil(wickets * 0.4));
    const secondBowlerWickets = Math.min(2, Math.ceil(wickets * 0.3));
    const remainingWickets = wickets - mainBowlerWickets - secondBowlerWickets;

    return [
      {
        name: `${playerPrefix}-B1`,
        overs: (overs * 0.3).toFixed(1),
        maidens: Math.floor(overs * 0.3 * 0.1),
        runs: Math.floor(runsAgainst * 0.25),
        wickets: mainBowlerWickets,
        economy: ((runsAgainst * 0.25) / (overs * 0.3)).toFixed(1),
      },
      {
        name: `${playerPrefix}-B2`,
        overs: (overs * 0.25).toFixed(1),
        maidens: Math.floor(overs * 0.25 * 0.1),
        runs: Math.floor(runsAgainst * 0.3),
        wickets: secondBowlerWickets,
        economy: ((runsAgainst * 0.3) / (overs * 0.25)).toFixed(1),
      },
      {
        name: `${playerPrefix}-B3`,
        overs: (overs * 0.2).toFixed(1),
        maidens: Math.floor(overs * 0.2 * 0.05),
        runs: Math.floor(runsAgainst * 0.2),
        wickets: Math.ceil(remainingWickets * 0.6),
        economy: ((runsAgainst * 0.2) / (overs * 0.2)).toFixed(1),
      },
      {
        name: `${playerPrefix}-B4`,
        overs: (overs * 0.25).toFixed(1),
        maidens: 0,
        runs: Math.floor(runsAgainst * 0.25),
        wickets: Math.floor(remainingWickets * 0.4),
        economy: ((runsAgainst * 0.25) / (overs * 0.25)).toFixed(1),
      },
    ];
  };

  const team1BattingCard = generateBattingCard(team1, team1Score, team1Wickets);
  const team2BattingCard = generateBattingCard(team2, team2Score, team2Wickets);
  const team1BowlingCard = generateBowlingCard(team1, team2Wickets, team2Score);
  const team2BowlingCard = generateBowlingCard(team2, team1Wickets, team1Score);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.scorecardContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

        <View style={styles.scorecardBackground}>
          <LinearGradient
            colors={["#f5f5f5", "#e8e8e8"]}
            style={styles.backgroundGradient}
          />
          <View style={styles.pitchPattern} />
        </View>

        <Animatable.View
          animation="fadeInDown"
          duration={600}
          style={styles.scorecardHeader}
        >
          <LinearGradient
            colors={[
              winnerColor,
              winnerTeam
                ? winnerTeam === team1
                  ? "#2E7D32"
                  : "#0D47A1"
                : "#F57C00",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Match Scorecard</Text>
              <Text style={styles.headerSubtitle}>{formattedDate}</Text>
            </View>
          </LinearGradient>
        </Animatable.View>

        <Animatable.View
          animation="fadeInUp"
          duration={800}
          delay={200}
          style={styles.matchSummaryCard}
        >
          <LinearGradient
            colors={["#ffffff", "#f8f9fa"]}
            style={styles.summaryGradient}
          >
            <View style={styles.teamsContainer}>
              <View style={styles.teamColumn}>
                <View
                  style={[styles.teamBadge, { backgroundColor: "#e3f2fd" }]}
                >
                  <Text style={[styles.teamBadgeText, { color: "#3949AB" }]}>
                    {team1.charAt(0)}
                  </Text>
                </View>
                <Text style={[styles.teamName, { color: "#333" }]}>
                  {team1}
                </Text>
                <Text style={styles.teamScore}>
                  {team1Score}/{team1Wickets}
                </Text>
              </View>

              <View style={styles.versusContainer}>
                <View
                  style={[styles.versusLine, { backgroundColor: "#ddd" }]}
                />
                <View
                  style={[styles.versusCircle, { backgroundColor: "#f0f0f0" }]}
                >
                  <Text style={[styles.versusText, { color: "#666" }]}>VS</Text>
                </View>
                <View
                  style={[styles.versusLine, { backgroundColor: "#ddd" }]}
                />
              </View>

              <View style={styles.teamColumn}>
                <View
                  style={[styles.teamBadge, { backgroundColor: "#ffebee" }]}
                >
                  <Text style={[styles.teamBadgeText, { color: "#D32F2F" }]}>
                    {team2.charAt(0)}
                  </Text>
                </View>
                <Text style={[styles.teamName, { color: "#333" }]}>
                  {team2}
                </Text>
                <Text style={styles.teamScore}>
                  {team2Score}/{team2Wickets}
                </Text>
              </View>
            </View>

            <View
              style={[styles.resultContainer, { backgroundColor: "#f5f5f5" }]}
            >
              <MaterialCommunityIcons
                name={winnerTeam ? "trophy-outline" : "trophy-variant-outline"}
                size={20}
                color={winnerColor}
              />
              <Text style={[styles.resultText, { color: winnerColor }]}>
                {resultText}
              </Text>
            </View>
          </LinearGradient>
        </Animatable.View>

        <Animatable.View
          animation="fadeIn"
          duration={800}
          delay={400}
          style={styles.inningsTabs}
        >
          <TouchableOpacity
            style={[
              styles.inningsTab,
              { backgroundColor: activeTab === 0 ? "#4CAF50" : "#f0f0f0" },
            ]}
            onPress={() => setActiveTab(0)}
          >
            <MaterialCommunityIcons
              name="cricket"
              size={18}
              color={activeTab === 0 ? "#fff" : "#666"}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.inningsTabText,
                { color: activeTab === 0 ? "#fff" : "#666" },
              ]}
            >
              1st Innings • {team1}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.inningsTab,
              { backgroundColor: activeTab === 1 ? "#4CAF50" : "#f0f0f0" },
            ]}
            onPress={() => setActiveTab(1)}
          >
            <MaterialCommunityIcons
              name="cricket"
              size={18}
              color={activeTab === 1 ? "#fff" : "#666"}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.inningsTabText,
                { color: activeTab === 1 ? "#fff" : "#666" },
              ]}
            >
              2nd Innings • {team2}
            </Text>
          </TouchableOpacity>
        </Animatable.View>

        <Animatable.View
          animation="fadeIn"
          duration={1000}
          delay={600}
          style={styles.scorecardContent}
        >
          <ScrollView
            style={[styles.scorecardScrollView, { backgroundColor: "#ffffff" }]}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 0 ? (
              <View style={styles.inningsContainer}>
                <View style={styles.inningsSummary}>
                  <LinearGradient
                    colors={["#3949AB", "#303F9F"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.inningsSummaryGradient}
                  >
                    <View style={styles.inningsSummaryLeft}>
                      <Text style={styles.inningsSummaryTeam}>{team1}</Text>
                      <Text style={styles.inningsSummaryScore}>
                        {team1Score}/{team1Wickets}
                      </Text>
                    </View>
                    <View style={styles.inningsSummaryRight}>
                      <View style={styles.oversContainer}>
                        <Text style={styles.oversLabel}>OVERS</Text>
                        <Text style={styles.oversValue}>{overs}</Text>
                      </View>
                      <View style={styles.rateContainer}>
                        <Text style={styles.rateLabel}>RUN RATE</Text>
                        <Text style={styles.rateValue}>
                          {(team1Score / overs).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                <View
                  style={[styles.sectionCard, { backgroundColor: "#ffffff" }]}
                >
                  <View
                    style={[
                      styles.sectionHeader,
                      { backgroundColor: "#e3f2fd" },
                    ]}
                  >
                    <FontAwesome5
                      name="bat"
                      size={16}
                      color="#3949AB"
                      style={styles.sectionIcon}
                    />
                    <Text style={[styles.sectionTitle, { color: "#333" }]}>
                      BATTING
                    </Text>
                  </View>

                  <View
                    style={[styles.tableHeader, { backgroundColor: "#f5f5f5" }]}
                  >
                    <Text
                      style={[
                        styles.cellBatsman,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      BATSMAN
                    </Text>
                    <Text
                      style={[
                        styles.cellRuns,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      R
                    </Text>
                    <Text
                      style={[
                        styles.cellBalls,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      B
                    </Text>
                    <Text
                      style={[
                        styles.cell4s,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      4s
                    </Text>
                    <Text
                      style={[
                        styles.cell6s,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      6s
                    </Text>
                    <Text
                      style={[
                        styles.cellSR,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      SR
                    </Text>
                  </View>

                  {team1BattingCard.map((batsman, index) => (
                    <Animatable.View
                      key={index}
                      animation="fadeInRight"
                      delay={index * 100}
                      duration={400}
                      style={[
                        styles.tableRow,
                        { borderBottomColor: "#eeeeee" },
                        index % 2 === 0
                          ? { backgroundColor: "#f9f9f9" }
                          : { backgroundColor: "#ffffff" },
                      ]}
                    >
                      <View style={styles.cellBatsman}>
                        <Text style={[styles.batsmanName, { color: "#333" }]}>
                          {batsman.name}
                        </Text>
                        <Text style={[styles.batsmanStatus, { color: "#888" }]}>
                          {batsman.status}
                        </Text>
                      </View>
                      <Text style={styles.cellRuns}>{batsman.runs}</Text>
                      <Text style={[styles.cellBalls, { color: "#666" }]}>
                        {batsman.balls}
                      </Text>
                      <Text style={styles.cell4s}>{batsman.fours}</Text>
                      <Text style={styles.cell6s}>{batsman.sixes}</Text>
                      <Text style={[styles.cellSR, { color: "#666" }]}>
                        {batsman.strikeRate}
                      </Text>
                    </Animatable.View>
                  ))}

                  <View
                    style={[
                      styles.tableSummary,
                      { backgroundColor: "#e8f5e9" },
                    ]}
                  >
                    <Text style={[styles.totalLabel, { color: "#2E7D32" }]}>
                      TOTAL
                    </Text>
                    <Text style={[styles.totalScore, { color: "#333" }]}>
                      {team1Score}/{team1Wickets} ({overs} Ov)
                    </Text>
                  </View>
                </View>

                <View
                  style={[styles.sectionCard, { backgroundColor: "#ffffff" }]}
                >
                  <View
                    style={[
                      styles.sectionHeader,
                      { backgroundColor: "#ffebee" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="baseball"
                      size={16}
                      color="#D32F2F"
                      style={styles.sectionIcon}
                    />
                    <Text style={[styles.sectionTitle, { color: "#333" }]}>
                      BOWLING
                    </Text>
                  </View>

                  <View
                    style={[styles.tableHeader, { backgroundColor: "#f5f5f5" }]}
                  >
                    <Text
                      style={[
                        styles.cellBowler,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      BOWLER
                    </Text>
                    <Text
                      style={[
                        styles.cellOvers,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      O
                    </Text>
                    <Text
                      style={[
                        styles.cellMaidens,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      M
                    </Text>
                    <Text
                      style={[
                        styles.cellBowlerRuns,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      R
                    </Text>
                    <Text
                      style={[
                        styles.cellWickets,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      W
                    </Text>
                    <Text
                      style={[
                        styles.cellEcon,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      ECON
                    </Text>
                  </View>

                  {team2BowlingCard.map((bowler, index) => (
                    <Animatable.View
                      key={index}
                      animation="fadeInLeft"
                      delay={index * 100}
                      duration={400}
                      style={[
                        styles.tableRow,
                        { borderBottomColor: "#eeeeee" },
                        index % 2 === 0
                          ? { backgroundColor: "#f9f9f9" }
                          : { backgroundColor: "#ffffff" },
                      ]}
                    >
                      <Text style={[styles.cellBowler, { color: "#333" }]}>
                        {bowler.name}
                      </Text>
                      <Text style={[styles.cellOvers, { color: "#666" }]}>
                        {bowler.overs}
                      </Text>
                      <Text style={styles.cellMaidens}>{bowler.maidens}</Text>
                      <Text style={[styles.cellBowlerRuns, { color: "#666" }]}>
                        {bowler.runs}
                      </Text>
                      <Text style={styles.cellWickets}>{bowler.wickets}</Text>
                      <Text style={[styles.cellEcon, { color: "#666" }]}>
                        {bowler.economy}
                      </Text>
                    </Animatable.View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.inningsContainer}>
                <View style={styles.inningsSummary}>
                  <LinearGradient
                    colors={["#D32F2F", "#C62828"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.inningsSummaryGradient}
                  >
                    <View style={styles.inningsSummaryLeft}>
                      <Text style={styles.inningsSummaryTeam}>{team2}</Text>
                      <Text style={styles.inningsSummaryScore}>
                        {team2Score}/{team2Wickets}
                      </Text>
                    </View>
                    <View style={styles.inningsSummaryRight}>
                      <View style={styles.oversContainer}>
                        <Text style={styles.oversLabel}>OVERS</Text>
                        <Text style={styles.oversValue}>{overs}</Text>
                      </View>
                      <View style={styles.rateContainer}>
                        <Text style={styles.rateLabel}>RUN RATE</Text>
                        <Text style={styles.rateValue}>
                          {(team2Score / overs).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                <View
                  style={[styles.sectionCard, { backgroundColor: "#ffffff" }]}
                >
                  <View
                    style={[
                      styles.sectionHeader,
                      { backgroundColor: "#ffebee" },
                    ]}
                  >
                    <FontAwesome5
                      name="bat"
                      size={16}
                      color="#D32F2F"
                      style={styles.sectionIcon}
                    />
                    <Text style={[styles.sectionTitle, { color: "#333" }]}>
                      BATTING
                    </Text>
                  </View>

                  <View
                    style={[styles.tableHeader, { backgroundColor: "#f5f5f5" }]}
                  >
                    <Text
                      style={[
                        styles.cellBatsman,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      BATSMAN
                    </Text>
                    <Text
                      style={[
                        styles.cellRuns,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      R
                    </Text>
                    <Text
                      style={[
                        styles.cellBalls,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      B
                    </Text>
                    <Text
                      style={[
                        styles.cell4s,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      4s
                    </Text>
                    <Text
                      style={[
                        styles.cell6s,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      6s
                    </Text>
                    <Text
                      style={[
                        styles.cellSR,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      SR
                    </Text>
                  </View>

                  {team2BattingCard.map((batsman, index) => (
                    <Animatable.View
                      key={index}
                      animation="fadeInRight"
                      delay={index * 100}
                      duration={400}
                      style={[
                        styles.tableRow,
                        { borderBottomColor: "#eeeeee" },
                        index % 2 === 0
                          ? { backgroundColor: "#f9f9f9" }
                          : { backgroundColor: "#ffffff" },
                      ]}
                    >
                      <View style={styles.cellBatsman}>
                        <Text style={[styles.batsmanName, { color: "#333" }]}>
                          {batsman.name}
                        </Text>
                        <Text style={[styles.batsmanStatus, { color: "#888" }]}>
                          {batsman.status}
                        </Text>
                      </View>
                      <Text style={styles.cellRuns}>{batsman.runs}</Text>
                      <Text style={[styles.cellBalls, { color: "#666" }]}>
                        {batsman.balls}
                      </Text>
                      <Text style={styles.cell4s}>{batsman.fours}</Text>
                      <Text style={styles.cell6s}>{batsman.sixes}</Text>
                      <Text style={[styles.cellSR, { color: "#666" }]}>
                        {batsman.strikeRate}
                      </Text>
                    </Animatable.View>
                  ))}

                  <View
                    style={[
                      styles.tableSummary,
                      { backgroundColor: "#e8f5e9" },
                    ]}
                  >
                    <Text style={[styles.totalLabel, { color: "#2E7D32" }]}>
                      TOTAL
                    </Text>
                    <Text style={[styles.totalScore, { color: "#333" }]}>
                      {team2Score}/{team2Wickets} ({overs} Ov)
                    </Text>
                  </View>
                </View>

                <View
                  style={[styles.sectionCard, { backgroundColor: "#ffffff" }]}
                >
                  <View
                    style={[
                      styles.sectionHeader,
                      { backgroundColor: "#e3f2fd" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="baseball"
                      size={16}
                      color="#3949AB"
                      style={styles.sectionIcon}
                    />
                    <Text style={[styles.sectionTitle, { color: "#333" }]}>
                      BOWLING
                    </Text>
                  </View>

                  <View
                    style={[styles.tableHeader, { backgroundColor: "#f5f5f5" }]}
                  >
                    <Text
                      style={[
                        styles.cellBowler,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      BOWLER
                    </Text>
                    <Text
                      style={[
                        styles.cellOvers,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      O
                    </Text>
                    <Text
                      style={[
                        styles.cellMaidens,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      M
                    </Text>
                    <Text
                      style={[
                        styles.cellBowlerRuns,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      R
                    </Text>
                    <Text
                      style={[
                        styles.cellWickets,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      W
                    </Text>
                    <Text
                      style={[
                        styles.cellEcon,
                        { color: "#666", fontWeight: "bold", fontSize: 12 },
                      ]}
                    >
                      ECON
                    </Text>
                  </View>

                  {team1BowlingCard.map((bowler, index) => (
                    <Animatable.View
                      key={index}
                      animation="fadeInLeft"
                      delay={index * 100}
                      duration={400}
                      style={[
                        styles.tableRow,
                        { borderBottomColor: "#eeeeee" },
                        index % 2 === 0
                          ? { backgroundColor: "#f9f9f9" }
                          : { backgroundColor: "#ffffff" },
                      ]}
                    >
                      <Text style={[styles.cellBowler, { color: "#333" }]}>
                        {bowler.name}
                      </Text>
                      <Text style={[styles.cellOvers, { color: "#666" }]}>
                        {bowler.overs}
                      </Text>
                      <Text style={styles.cellMaidens}>{bowler.maidens}</Text>
                      <Text style={[styles.cellBowlerRuns, { color: "#666" }]}>
                        {bowler.runs}
                      </Text>
                      <Text style={styles.cellWickets}>{bowler.wickets}</Text>
                      <Text style={[styles.cellEcon, { color: "#666" }]}>
                        {bowler.economy}
                      </Text>
                    </Animatable.View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </Animatable.View>
      </SafeAreaView>
    </Modal>
  );
};

const MatchCard = ({ match, userTeam, index, navigation }) => {
  const [showScorecard, setShowScorecard] = useState(false);
  const initialTranslateY = 100;
  const animValue = useRef(new Animated.Value(initialTranslateY)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();

  const isTeam1 = userTeam === match.teams.team1;
  const team1Score = match.scoreCard?.firstInning?.team1TotalRuns || 0;
  const team2Score = match.scoreCard?.secondInning?.team2TotalRuns || 0;
  const team1Wickets = match.scoreCard?.firstInning?.team1Wickets || 0;
  const team2Wickets = match.scoreCard?.secondInning?.team2Wickets || 0;

  let result = "draw";
  if (team1Score > team2Score) {
    result = isTeam1 ? "won" : "lost";
  } else if (team2Score > team1Score) {
    result = isTeam1 ? "lost" : "won";
  }

  const matchDate = match.date ? new Date(match.date) : new Date();
  const formattedDate = matchDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const totalOvers = match.scoreCard?.firstInning.overs || 0;
  const stats = {
    runs: isTeam1 ? team1Score : team2Score,
    wickets: isTeam1 ? team1Wickets : team2Wickets,
    overs: totalOvers,
  };

  useEffect(() => {
    if (isFocused) {
      animValue.setValue(initialTranslateY);
      opacityValue.setValue(0);

      const delay = index * 150;

      Animated.parallel([
        Animated.timing(animValue, {
          toValue: 0,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused, animValue, opacityValue, index]);

  const handleViewScorecard = () => {
    setShowScorecard(true);
  };

  return (
    <>
      <Animated.View
        style={[
          styles.matchCard,
          {
            transform: [{ translateY: animValue }],
            opacity: opacityValue,
          },
        ]}
      >
        <LinearGradient
          colors={["#f5f7fa", "#e4e8f0"]}
          style={styles.cardGradient}
        >
          <View style={styles.matchHeader}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
            <ResultBadge result={result} />
          </View>

          <View style={styles.teamsContainer}>
            <View style={styles.teamSection}>
              <View
                style={[
                  styles.teamLogoContainer,
                  { backgroundColor: isTeam1 ? "#e3f2fd" : "#f5f5f5" },
                ]}
              >
                <Text style={styles.teamInitial}>
                  {match.teams.team1.charAt(0)}
                </Text>
              </View>
              <Text style={styles.teamName}>{match.teams.team1}</Text>
              <Text style={styles.teamScore}>
                {team1Score}/{team1Wickets}
              </Text>
            </View>

            <View style={styles.vsDivider}>
              <View style={styles.dividerLine} />
              <View style={styles.vsCircle}>
                <Text style={styles.vsText}>VS</Text>
              </View>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.teamSection}>
              <View
                style={[
                  styles.teamLogoContainer,
                  { backgroundColor: !isTeam1 ? "#e3f2fd" : "#f5f5f5" },
                ]}
              >
                <Text style={styles.teamInitial}>
                  {match.teams.team2.charAt(0)}
                </Text>
              </View>
              <Text style={styles.teamName}>{match.teams.team2}</Text>
              <Text style={styles.teamScore}>
                {team2Score}/{team2Wickets}
              </Text>
            </View>
          </View>

          <MatchStats stats={stats} />
        </LinearGradient>
      </Animated.View>

      <ScorecardModal
        visible={showScorecard}
        match={match}
        onClose={() => setShowScorecard(false)}
      />
    </>
  );
};

const FilterTabs = ({ activeFilter, setActiveFilter }) => {
  const filters = [
    { id: "all", label: "All Matches" },
    { id: "won", label: "Won" },
    { id: "lost", label: "Lost" },
    { id: "recent", label: "Recent" },
  ];

  return (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScrollContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterTab,
              activeFilter === filter.id && styles.activeFilterTab,
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.id && styles.activeFilterText,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const StatsSummary = ({ matches, userTeam }) => {
  const totalMatches = matches.length;

  let wins = 0;
  let totalRuns = 0;
  let totalWickets = 0;

  matches.forEach((match) => {
    const isTeam1 = userTeam === match.teams.team1;
    const team1Score = match.scoreCard?.firstInning?.team1TotalRuns || 0;
    const team2Score = match.scoreCard?.secondInning?.team2TotalRuns || 0;

    if (
      (isTeam1 && team1Score > team2Score) ||
      (!isTeam1 && team2Score > team1Score)
    ) {
      wins++;
    }

    if (isTeam1) {
      totalRuns += team1Score;
      totalWickets += match.scoreCard?.firstInning?.team1Wickets;
    } else {
      totalRuns += team2Score;
      totalWickets += match.scoreCard?.secondInning?.team2Wickets;
    }
  });

  const winPercentage =
    totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  return (
    <BlurView intensity={80} tint="light" style={styles.statsSummaryContainer}>
      <Text style={styles.summaryTitle}>Performance Summary</Text>

      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>{totalMatches}</Text>
          <Text style={styles.summaryLabel}>Matches</Text>
        </View>

        <View style={styles.summaryStatDivider} />

        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>{winPercentage}%</Text>
          <Text style={styles.summaryLabel}>Win Rate</Text>
        </View>

        <View style={styles.summaryStatDivider} />

        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>{totalRuns}</Text>
          <Text style={styles.summaryLabel}>Total Runs</Text>
        </View>
      </View>

      <View style={styles.winLossBar}>
        <View style={[styles.winBar, { width: `${winPercentage}%` }]} />
        <View style={[styles.lossBar, { width: `${100 - winPercentage}%` }]} />
      </View>
      <View style={styles.winLossLabels}>
        <Text style={styles.winLabel}>{wins} Wins</Text>
        <Text style={styles.lossLabel}>{totalMatches - wins} Losses</Text>
      </View>
    </BlurView>
  );
};

const History = ({ navigation }) => {
  const { emailGlobal } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState("");
  const [matches, setMatches] = useState([]);
  const [processedMatches, setProcessedMatches] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [180, 80],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const teamsRef = ref(database, "teams");
        const snapshot = await get(teamsRef);
        if (snapshot.exists()) {
          const teams = snapshot.val();
          let foundTeam = "";
          Object.values(teams).forEach((teamObj) => {
            teamObj?.playersArray?.forEach((player) => {
              if (player.email === emailGlobal) {
                foundTeam = teamObj.teamName;
              }
            });
          });
          setTeam(foundTeam);
        } else {
          console.log("No teams data found");
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    fetchTeamData();
  }, [emailGlobal]);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!team) return;
      try {
        const matchRef = ref(database, "matches");
        const snapshot = await get(matchRef);
        if (snapshot.exists()) {
          const matchObj = snapshot.val();
          const matchIds = Object.keys(matchObj);
          const uniqueMatches = new Set();
          Object.values(matchObj).forEach((m, i) => {
            if (
              (m.team1 === team || m.team2 === team) &&
              m.status === "completed"
            ) {
              uniqueMatches.add(matchIds[i]);
              console.log(team);
            }
          });
          setMatches(Array.from(uniqueMatches));
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [team]);

  useEffect(() => {
    const getMatchData = async () => {
      const promises = matches.map(async (matchId) => {
        const matchRef = ref(database, `matches/${matchId}`);
        const snapshot = await get(matchRef);
        if (snapshot.exists()) {
          const matchData = snapshot.val();
          const scoreData = Object.values(matchData)[0];
          const scoreCard = scoreData.scoreCard;
          const teams = {
            team1: matchData.team1,
            team2: matchData.team2,
          };
          return {
            id: matchId,
            scoreCard,
            teams,
            date: matchData.date || new Date().toISOString(),
          };
        }
        return null;
      });

      const results = await Promise.all(promises);
      const validResults = results.filter((r) => r !== null);

      validResults.sort((a, b) => new Date(b.date) - new Date(a.date));

      setProcessedMatches(validResults);
    };

    if (matches.length > 0) {
      getMatchData();
    }
  }, [matches]);

  const filteredMatches = processedMatches.filter((match) => {
    if (activeFilter === "all") return true;

    const isTeam1 = team === match.teams.team1;
    const team1Score = match.scoreCard?.firstInning?.team1TotalRuns;
    const team2Score = match.scoreCard?.secondInning?.team2TotalRuns;

    if (activeFilter === "won") {
      return (
        (isTeam1 && team1Score > team2Score) ||
        (!isTeam1 && team2Score > team1Score)
      );
    }

    if (activeFilter === "lost") {
      return (
        (isTeam1 && team1Score < team2Score) ||
        (!isTeam1 && team2Score < team1Score)
      );
    }

    if (activeFilter === "recent") {
      return processedMatches.indexOf(match) < 5;
    }

    return true;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading match history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={["#4CAF50", "#2E7D32"]}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Match History</Text>
          <Animated.View
            style={[styles.headerContent, { opacity: headerOpacity }]}
          >
            <Text style={styles.teamTitle}>{team}</Text>
            <Text style={styles.matchCount}>
              {processedMatches.length}{" "}
              {processedMatches.length === 1 ? "Match" : "Matches"} Played
            </Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {processedMatches.length > 0 && (
          <StatsSummary matches={processedMatches} userTeam={team} />
        )}

        <FilterTabs
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        {filteredMatches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={80} color="#ddd" />
            <Text style={styles.emptyText}>No matches found</Text>
            <Text style={styles.emptySubtext}>
              {activeFilter !== "all"
                ? "Try changing the filter above"
                : "Your match history will appear here"}
            </Text>
          </View>
        ) : (
          filteredMatches.map((match, index) => (
            <MatchCard
              key={match.id}
              match={match}
              userTeam={team}
              index={index}
              navigation={navigation}
            />
          ))
        )}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    width: "100%",
    overflow: "hidden",
  },
  headerGradient: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    marginTop: 5,
  },
  headerContent: {
    marginTop: 8,
  },
  teamTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  matchCount: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 15,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  statsSummaryContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.8)",
    overflow: "hidden",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryStat: {
    flex: 1,
    alignItems: "center",
  },
  summaryStatDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#ddd",
    alignSelf: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  winLossBar: {
    height: 8,
    flexDirection: "row",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  winBar: {
    height: "100%",
    backgroundColor: "#4CAF50",
  },
  lossBar: {
    height: "100%",
    backgroundColor: "#F44336",
  },
  winLossLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  winLabel: {
    fontSize: 12,
    color: "#4CAF50",
  },
  lossLabel: {
    fontSize: 12,
    color: "#F44336",
  },
  filterContainer: {
    marginBottom: 16,
  },
  filtersScrollContent: {
    paddingHorizontal: 16,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#f0f0f0",
  },
  activeFilterTab: {
    backgroundColor: "#4CAF50",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
  },
  activeFilterText: {
    color: "white",
    fontWeight: "600",
  },
  matchCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 16,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#666",
  },
  resultBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  resultText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  teamSection: {
    flex: 1,
    alignItems: "center",
  },
  teamLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  teamInitial: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  teamScore: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  vsDivider: {
    alignItems: "center",
    width: 60,
  },
  dividerLine: {
    width: "100%",
    height: 1,
    backgroundColor: "#ddd",
  },
  vsCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
  },
  vsText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#ddd",
    alignSelf: "center",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  scorecardContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scorecardBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundGradient: {
    flex: 1,
  },
  pitchPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  scorecardHeader: {
    backgroundColor: "transparent",
  },
  headerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 0,
  },
  headerContent: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  summaryGradient: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  matchSummaryCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  teamColumn: {
    alignItems: "center",
    padding: 8,
  },
  teamBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  teamBadgeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  versusContainer: {
    flexDirection: "column",
    alignItems: "center",
    width: 40,
  },
  versusLine: {
    width: 30,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  versusCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
  },
  versusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.7)",
  },
  resultContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  resultText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  inningsTabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  inningsTab: {
    flex: 1,
    padding: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  tabIcon: {
    marginRight: 6,
  },
  inningsTabText: {
    fontSize: 14,
    color: "#ccc",
  },
  scorecardContent: {
    flex: 1,
    margin: 16,
    marginTop: 8,
  },
  scorecardScrollView: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  inningsContainer: {
    padding: 16,
  },
  inningsSummary: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  inningsSummaryGradient: {
    flexDirection: "row",
    padding: 12,
  },
  inningsSummaryLeft: {
    flex: 1,
  },
  inningsSummaryTeam: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  inningsSummaryScore: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  inningsSummaryRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  oversContainer: {
    alignItems: "flex-end",
    marginRight: 16,
  },
  oversLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  oversValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  rateContainer: {
    alignItems: "flex-end",
  },
  rateLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  rateValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  sectionCard: {
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.7)",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  evenRow: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  oddRow: {
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  cellBatsman: {
    flex: 3,
  },
  batsmanName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  batsmanStatus: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  cellRuns: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
  },
  cellBalls: {
    flex: 1,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  cell4s: {
    flex: 1,
    fontSize: 14,
    color: "#2196F3",
    textAlign: "center",
  },
  cell6s: {
    flex: 1,
    fontSize: 14,
    color: "#FF9800",
    textAlign: "center",
  },
  cellSR: {
    flex: 1,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  tableSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(76,175,80,0.2)",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.7)",
  },
  totalScore: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  cellBowler: {
    flex: 3,
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  cellOvers: {
    flex: 1,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  cellMaidens: {
    flex: 1,
    fontSize: 14,
    color: "#64B5F6",
    textAlign: "center",
  },
  cellBowlerRuns: {
    flex: 1,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  cellWickets: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    color: "#E57373",
    textAlign: "center",
  },
  cellEcon: {
    flex: 1,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
});

export default History;

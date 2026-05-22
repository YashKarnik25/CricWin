import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Modal,
  Animated,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { database } from "./firebase";
import {
  ref,
  query,
  orderByChild,
  equalTo,
  get,
  push,
  set,
  update,
} from "firebase/database";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const AnimatedButton = ({ children, onPress, style, ...props }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.timing(scaleValue, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };
  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      style={[style, { transform: [{ scale: scaleValue }] }]}
      {...props}
    >
      {children}
    </AnimatedTouchable>
  );
};

const ScoreScreen = ({ match, battingTeam1, bowlingTeam1 }) => {
  const navigation = useNavigation();
  const [showMatches, setShowMatches] = useState(false);

  const [firstInning, setFirstInning] = useState(null);
  const [secondInning, setSecondInning] = useState(null);

  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);

  const [dismissedBatsmenFirst, setDismissedBatsmenFirst] = useState([]);
  const [dismissedBatsmenSecond, setDismissedBatsmenSecond] = useState([]);

  const [isInningSwitched, setIsInningSwitched] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsRef = ref(database, "teams");
        const teamQuery1 = query(
          teamsRef,
          orderByChild("teamName"),
          equalTo(battingTeam1)
        );
        const teamQuery2 = query(
          teamsRef,
          orderByChild("teamName"),
          equalTo(bowlingTeam1)
        );
        const team1Snapshot = await get(teamQuery1);
        const team2Snapshot = await get(teamQuery2);
        if (team1Snapshot.exists() && team2Snapshot.exists()) {
          const t1 = Object.values(team1Snapshot.val())[0].playersArray;
          const t2 = Object.values(team2Snapshot.val())[0].playersArray;
          const team1Names = t1.map((player) => player.name);
          const team2Names = t2.map((player) => player.name);
          setTeam1Players(team1Names);
          setTeam2Players(team2Names);
        } else {
          console.log("No team data available");
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };
    fetchTeams();
  }, [match]);

  const [totalRuns, setTotalRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [ballsInOver, setBallsInOver] = useState(0);
  const [completedOvers, setCompletedOvers] = useState(0);
  const [currentBatsmen, setCurrentBatsmen] = useState({
    striker: { name: "", runs: 0, balls: 0 },
    nonStriker: { name: "", runs: 0, balls: 0 },
  });
  const [battingTeamBench, setBattingTeamBench] = useState([]);
  const [bowlingTeam, setBowlingTeam] = useState([]);
  const [allBowlersStats, setAllBowlersStats] = useState({});
  const [currentBowler, setCurrentBowler] = useState({
    name: "",
    runsGiven: 0,
    wickets: 0,
    balls: 0,
  });
  const [history, setHistory] = useState([]);
  const [showBatsmanModal, setShowBatsmanModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);

  const [innings, setInnings] = useState(1);
  const [targetRuns, setTargetRuns] = useState(null);
  const [switchMessage, setSwitchMessage] = useState("");
  const [isAfterNoBall, setIsAfterNoBall] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (team1Players.length > 1 && team2Players.length > 0) {
      setCurrentBatsmen({
        striker: { name: team1Players[0], runs: 0, balls: 0 },
        nonStriker: { name: team1Players[1], runs: 0, balls: 0 },
      });
      setBattingTeamBench(team1Players.slice(2));
      setBowlingTeam(team2Players);
      setCurrentBowler({
        name: team2Players[8] || team2Players[0],
        runsGiven: 0,
        wickets: 0,
        balls: 0,
      });
    }
  }, [team1Players, team2Players]);

  useEffect(() => {
    if (innings === 1 && team1Players.length > 0) {
      const maxWickets = team1Players.length - 1;
      if (completedOvers >= 3 || wickets >= maxWickets) {
        handleSwitchInnings();
      }
    }
  }, [completedOvers, wickets, innings, team1Players]);

  useEffect(() => {
    if (innings === 2 && targetRuns !== null) {
      const maxWicketsTeam2 =
        team2Players.length > 0 ? team2Players.length - 1 : 10;
      if (totalRuns >= targetRuns) {
        const secondInningData = {
          history,
          batsmen: {
            striker: currentBatsmen.striker,
            nonStriker: currentBatsmen.nonStriker,
            bench: battingTeamBench,
            dismissed: dismissedBatsmenSecond,
          },
          bowlers: { ...allBowlersStats, current: currentBowler },
          extras: 0,
          team2TotalRuns: totalRuns,
          team2Wickets: wickets,
        };
        setSecondInning(secondInningData);
        if (firstInning) {
          storeMatchData(firstInning, secondInningData);
          updateOverallPlayerStats(firstInning, secondInningData);
          updateMatchStatus();
        }
        Alert.alert("Match Result", "Team batting second wins!", [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("Dashboard");
              setShowMatches(true);
            },
          },
        ]);
      } else if (
        (completedOvers >= 3 || wickets >= maxWicketsTeam2) &&
        totalRuns < targetRuns
      ) {
        const secondInningData = {
          history,
          batsmen: {
            striker: currentBatsmen.striker,
            nonStriker: currentBatsmen.nonStriker,
            bench: battingTeamBench,
            dismissed: dismissedBatsmenSecond,
          },
          bowlers: { ...allBowlersStats, current: currentBowler },
          extras: 0,
          team2TotalRuns: totalRuns,
          team2Wickets: wickets,
        };
        setSecondInning(secondInningData);
        if (firstInning) {
          storeMatchData(firstInning, secondInningData);
          updateOverallPlayerStats(firstInning, secondInningData);
          updateMatchStatus();
        }
        Alert.alert("Match Result", "Team batting first wins!", [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("Dashboard");
              setShowMatches(true);
            },
          },
        ]);
      }
    }
  }, [
    totalRuns,
    completedOvers,
    wickets,
    innings,
    targetRuns,
    team2Players,
    dismissedBatsmenSecond,
    currentBatsmen,
    battingTeamBench,
    allBowlersStats,
    currentBowler,
    history,
    firstInning,
  ]);

  const storeMatchData = async (firstData, secondData) => {
    try {
      const matchesRef = ref(database, `matches/${match.id}`);
      const newMatchRef = push(matchesRef);
      await set(newMatchRef, {
        scoreCard: {
          firstInning: firstData,
          secondInning: secondData,
        },
      });
      console.log("Match data stored successfully.");
    } catch (error) {
      console.error("Error storing match data:", error);
    }
  };

  const updateMatchStatus = async () => {
    try {
      const matchRef = ref(database, `matches/${match.id}`);
      await update(matchRef, { status: "completed" });
      console.log("Match status updated to completed.");
    } catch (error) {
      console.error("Error updating match status:", error);
    }
  };

  const updateOverallPlayerStats = async (firstData, secondData) => {
    const matchStats = {};
    const initPlayer = (name) => {
      if (!matchStats[name]) {
        matchStats[name] = {
          batting: { runs: 0, balls: 0 },
          bowling: { runs: 0, balls: 0, wickets: 0 },
        };
      }
    };

    if (firstData && firstData.batsmen) {
      const bat1 = firstData.batsmen;
      if (bat1.striker?.name) {
        initPlayer(bat1.striker.name);
        matchStats[bat1.striker.name].batting.runs += bat1.striker.runs || 0;
        matchStats[bat1.striker.name].batting.balls += bat1.striker.balls || 0;
      }
      if (bat1.nonStriker?.name) {
        initPlayer(bat1.nonStriker.name);
        matchStats[bat1.nonStriker.name].batting.runs +=
          bat1.nonStriker.runs || 0;
        matchStats[bat1.nonStriker.name].batting.balls +=
          bat1.nonStriker.balls || 0;
      }
    }
    if (firstData && firstData.bowlers) {
      const bowl1 = firstData.bowlers;
      Object.keys(bowl1).forEach((name) => {
        initPlayer(name);
        matchStats[name].bowling.runs += bowl1[name].runsGiven || 0;
        matchStats[name].bowling.balls += bowl1[name].balls || 0;
        matchStats[name].bowling.wickets += bowl1[name].wickets || 0;
      });
    }
    if (secondData && secondData.batsmen) {
      const bat2 = secondData.batsmen;
      if (bat2.striker?.name) {
        initPlayer(bat2.striker.name);
        matchStats[bat2.striker.name].batting.runs += bat2.striker.runs || 0;
        matchStats[bat2.striker.name].batting.balls += bat2.striker.balls || 0;
      }
      if (bat2.nonStriker?.name) {
        initPlayer(bat2.nonStriker.name);
        matchStats[bat2.nonStriker.name].batting.runs +=
          bat2.nonStriker.runs || 0;
        matchStats[bat2.nonStriker.name].batting.balls +=
          bat2.nonStriker.balls || 0;
      }
    }
    if (secondData && secondData.bowlers) {
      const bowl2 = secondData.bowlers;
      Object.keys(bowl2).forEach((name) => {
        initPlayer(name);
        matchStats[name].bowling.runs += bowl2[name].runsGiven || 0;
        matchStats[name].bowling.balls += bowl2[name].balls || 0;
        matchStats[name].bowling.wickets += bowl2[name].wickets || 0;
      });
    }

    const allPlayers = Array.from(new Set([...team1Players, ...team2Players]));
    const promises = [];
    for (const playerName of allPlayers) {
      const playerRef = ref(database, "playerStats/" + playerName);
      const p = get(playerRef).then((snapshot) => {
        if (snapshot.exists()) {
          let currentData = snapshot.val();
          const newMatches = (currentData.matches || 0) + 1;
          const battingContribution = matchStats[playerName]?.batting || {
            runs: 0,
            balls: 0,
          };
          const bowlingContribution = matchStats[playerName]?.bowling || {
            runs: 0,
            balls: 0,
            wickets: 0,
          };
          const newBattingRuns =
            (currentData.batting.runs || 0) + battingContribution.runs;
          const newBattingBalls =
            (currentData.batting.balls || 0) + battingContribution.balls;
          const newStrikeRate =
            newBattingBalls > 0
              ? (newBattingRuns / newBattingBalls) * 100
              : currentData.batting.strikeRate;
          const newAverage =
            newMatches > 0
              ? newBattingRuns / newMatches
              : currentData.batting.average;
          const newBowlingRuns =
            (currentData.bowling.runs || 0) + bowlingContribution.runs;
          const newBowlingBalls =
            (currentData.bowling.balls || 0) + bowlingContribution.balls;
          const newWickets =
            (currentData.bowling.wickets || 0) + bowlingContribution.wickets;
          const updatedRecord = {
            matches: newMatches,
            batting: {
              runs: newBattingRuns,
              balls: newBattingBalls,
              strikeRate: newStrikeRate,
              average: newAverage,
            },
            bowling: {
              runs: newBowlingRuns,
              balls: newBowlingBalls,
              wickets: newWickets,
            },
            email: currentData.email,
          };
          return set(playerRef, updatedRecord);
        } else {
          console.log(
            `Record for player ${playerName} does not exist. Skipping update.`
          );
        }
      });
      promises.push(p);
    }
    await Promise.all(promises);
    console.log("Overall player stats updated.");
  };

  const resetScore = () => {
    setTotalRuns(0);
    setWickets(0);
    setBallsInOver(0);
    setCompletedOvers(0);
    setHistory([]);
    setAllBowlersStats({});
    setShowBatsmanModal(false);
    setShowBowlerModal(false);
    setIsAfterNoBall(false);
  };

  const incrementBall = () => {
    setBallsInOver((prev) => {
      const newBalls = prev + 1;
      if (newBalls === 6) {
        setCompletedOvers((prev) => prev + 1);
        setBallsInOver(0);
        setCurrentBatsmen((prev) => ({
          striker: prev.nonStriker,
          nonStriker: prev.striker,
        }));
        setShowBowlerModal(true);
        return 0;
      }
      return newBalls;
    });
  };

  const handleLegalBall = (runValue) => {
    setTotalRuns((prev) => prev + runValue);
    setHistory((prev) => [...prev, { type: "run", value: runValue }]);
    setCurrentBatsmen((prev) => ({
      ...prev,
      striker: {
        ...prev.striker,
        runs: prev.striker.runs + runValue,
        balls: prev.striker.balls + 1,
      },
    }));
    setCurrentBowler((prev) => ({
      ...prev,
      runsGiven: prev.runsGiven + runValue,
      balls: prev.balls + 1,
    }));
    if (runValue % 2 !== 0) {
      setCurrentBatsmen((prev) => ({
        striker: prev.nonStriker,
        nonStriker: prev.striker,
      }));
    }

    if (isAfterNoBall) {
      setIsAfterNoBall(false);
    } else {
      incrementBall();
    }
  };

  const handleWicket = () => {
    setWickets((prev) => prev + 1);
    setHistory((prev) => [...prev, { type: "wicket" }]);
    if (innings === 1) {
      setDismissedBatsmenFirst((prev) => [...prev, currentBatsmen.striker]);
    } else if (innings === 2) {
      setDismissedBatsmenSecond((prev) => [...prev, currentBatsmen.striker]);
    }
    setCurrentBatsmen((prev) => ({
      ...prev,
      striker: { ...prev.striker, balls: prev.striker.balls + 1 },
    }));
    setCurrentBowler((prev) => ({
      ...prev,
      wickets: prev.wickets + 1,
      balls: prev.balls + 1,
    }));

    if (isAfterNoBall) {
      setIsAfterNoBall(false);
    } else {
      incrementBall();
    }

    setShowBatsmanModal(true);
  };

  const handleWide = () => {
    setTotalRuns((prev) => prev + 1);
    setHistory((prev) => [...prev, { type: "wide" }]);
    setCurrentBowler((prev) => ({
      ...prev,
      runsGiven: prev.runsGiven + 1,
    }));
  };

  const handleNoBall = () => {
    setTotalRuns((prev) => prev + 1);
    setHistory((prev) => [...prev, { type: "noBall" }]);
    setCurrentBowler((prev) => ({
      ...prev,
      runsGiven: prev.runsGiven + 1,
    }));
    setIsAfterNoBall(true);
  };

  const handleUndo = () => {
    setHistory((prevHistory) => {
      if (prevHistory.length === 0) return prevHistory;
      const newHistory = [...prevHistory];
      const lastEvent = newHistory.pop();
      if (lastEvent.type === "run") {
        setTotalRuns((prev) => prev - lastEvent.value);
        setCurrentBatsmen((prev) => ({
          ...prev,
          striker: {
            ...prev.striker,
            runs: prev.striker.runs - lastEvent.value,
            balls: prev.striker.balls - 1,
          },
        }));
        setCurrentBowler((prev) => ({
          ...prev,
          runsGiven: prev.runsGiven - lastEvent.value,
        }));
        setBallsInOver((prev) => {
          if (prev === 0 && completedOvers > 0) {
            setCompletedOvers((prevOvers) => prevOvers - 1);
            return 5;
          }
          return prev > 0 ? prev - 1 : 0;
        });
      } else if (lastEvent.type === "wicket") {
        setWickets((prev) => prev - 1);
        setCurrentBatsmen((prev) => ({
          ...prev,
          striker: { ...prev.striker, balls: prev.striker.balls - 1 },
        }));
        setCurrentBowler((prev) => ({
          ...prev,
          wickets: prev.wickets - 1,
        }));
        setBallsInOver((prev) => {
          if (prev === 0 && completedOvers > 0) {
            setCompletedOvers((prevOvers) => prevOvers - 1);
            return 5;
          }
          return prev > 0 ? prev - 1 : 0;
        });
      } else if (lastEvent.type === "wide") {
        setTotalRuns((prev) => prev - 1);
        setCurrentBowler((prev) => ({
          ...prev,
          runsGiven: prev.runsGiven - 1,
        }));
      } else if (lastEvent.type === "noBall") {
        setTotalRuns((prev) => prev - 1);
        setCurrentBowler((prev) => ({
          ...prev,
          runsGiven: prev.runsGiven - 1,
        }));
      }
      return newHistory;
    });
  };

  const handleSelectBatsman = (player) => {
    setCurrentBatsmen((prev) => ({
      ...prev,
      striker: { name: player, runs: 0, balls: 0 },
    }));
    setBattingTeamBench((prev) => prev.filter((p) => p !== player));
    setShowBatsmanModal(false);
  };

  const handleSelectBowler = (player) => {
    const existingStats = allBowlersStats[player] || {
      runsGiven: 0,
      wickets: 0,
      balls: 0,
    };
    setCurrentBowler({
      name: player,
      ...existingStats,
    });
    setAllBowlersStats((prev) => ({
      ...prev,
      [player]: {
        runsGiven: currentBowler.runsGiven,
        wickets: currentBowler.wickets,
        balls: currentBowler.balls,
      },
    }));
    setShowBowlerModal(false);
  };

  const handleSwitchInnings = () => {
    const firstInningData = {
      history,
      batsmen: {
        striker: currentBatsmen.striker,
        nonStriker: currentBatsmen.nonStriker,
        bench: battingTeamBench,
        dismissed: dismissedBatsmenFirst,
      },
      bowlers: { ...allBowlersStats, current: currentBowler },
      extras: 0,
      team1TotalRuns: totalRuns,
      team1Wickets: wickets,
    };
    setFirstInning(firstInningData);
    setTargetRuns(totalRuns + 1);
    setInnings(2);
    resetScore();
    setDismissedBatsmenSecond([]);
    if (team2Players.length > 1 && team1Players.length > 0) {
      setCurrentBatsmen({
        striker: { name: team2Players[0], runs: 0, balls: 0 },
        nonStriker: { name: team2Players[1] || "", runs: 0, balls: 0 },
      });
      setBattingTeamBench(team2Players.slice(2));
      setBowlingTeam(team1Players);
      setCurrentBowler({
        name: team1Players[8] || team1Players[0],
        runsGiven: 0,
        wickets: 0,
        balls: 0,
      });
    }
    const temp = battingTeam1;
    battingTeam1 = bowlingTeam1;
    bowlingTeam1 = temp;
    setSwitchMessage(
      `${isInningSwitched ? bowlingTeam1 : battingTeam1} need ${
        totalRuns + 1
      } runs to win from 18 balls.`
    );

    setIsInningSwitched(true);
  };

  const displayOvers = `${completedOvers}.${ballsInOver}`;
  const bowlerOvers = `${Math.floor(currentBowler.balls / 6)}.${
    currentBowler.balls % 6
  }`;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.screenContainer}>
        <View style={styles.header}>
          <AnimatedButton
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </AnimatedButton>
          <Text style={styles.headerTitle}>Live Score</Text>
        </View>

        <Animated.View style={[styles.scoreCard, { opacity: fadeAnim }]}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreColumn}>
              <Text style={styles.teamName}>{battingTeam1}</Text>
              <Text style={styles.scoreDetails}>
                CRR:{" "}
                {(totalRuns / (completedOvers + ballsInOver / 6) || 0).toFixed(
                  2
                )}
              </Text>
              <Text style={styles.scoreDetails}>
                RRR:{" "}
                {(totalRuns / (completedOvers + ballsInOver / 6) || 0).toFixed(
                  2
                )}
              </Text>
            </View>
            <View style={styles.scoreColumn}>
              <Text style={styles.currentScore}>
                {totalRuns}/{wickets}
              </Text>
              <Text style={styles.overs}>{displayOvers} Overs</Text>
            </View>
          </View>
          <Text style={styles.extras}>
            Extras: 0 (B:0, LB:0, WD:0, NB:0, P:0)
          </Text>
        </Animated.View>

        <View style={styles.detailContainer}>
          <Text style={styles.detailTitle}>Batsman Details</Text>
          <Text style={styles.detailText}>
            Striker: {currentBatsmen.striker.name} –{" "}
            {currentBatsmen.striker.runs} ({currentBatsmen.striker.balls})
          </Text>
          <Text style={styles.detailText}>
            Non-Striker: {currentBatsmen.nonStriker.name} –{" "}
            {currentBatsmen.nonStriker.runs} ({currentBatsmen.nonStriker.balls})
          </Text>
          <Text style={styles.detailTitle}>Bowler Details</Text>
          <Text style={styles.detailText}>
            {currentBowler.name} – {currentBowler.runsGiven} runs,{" "}
            {currentBowler.wickets} wickets, {bowlerOvers} overs
          </Text>
        </View>

        <View style={styles.quickActions}>
          {[0, 1, 2, 3, 4, 5, 6].map((num, index) => (
            <AnimatedButton
              key={index}
              style={styles.quickButton}
              onPress={() => handleLegalBall(num)}
            >
              <Text style={styles.quickButtonText}>{num}</Text>
            </AnimatedButton>
          ))}
        </View>

        <View style={styles.actionButtonsContainer}>
          <AnimatedButton style={styles.actionButton} onPress={handleWicket}>
            <Text style={styles.actionButtonText}>WICKET</Text>
          </AnimatedButton>
          <AnimatedButton style={styles.actionButton} onPress={handleWide}>
            <Text style={styles.actionButtonText}>WD</Text>
          </AnimatedButton>
          <AnimatedButton style={styles.actionButton} onPress={handleNoBall}>
            <Text style={styles.actionButtonText}>NB</Text>
          </AnimatedButton>
          <AnimatedButton style={styles.actionButton} onPress={handleUndo}>
            <Text style={styles.actionButtonText}>UNDO</Text>
          </AnimatedButton>
        </View>

        <AnimatedButton style={styles.resetButton} onPress={resetScore}>
          <Text style={styles.resetButtonText}>RESET</Text>
        </AnimatedButton>

        <Modal visible={showBatsmanModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Next Batsman</Text>
              {battingTeamBench.map((player, index) => (
                <AnimatedButton
                  key={index}
                  style={styles.modalItem}
                  onPress={() => handleSelectBatsman(player)}
                >
                  <Text style={styles.modalItemText}>{player}</Text>
                </AnimatedButton>
              ))}
              <AnimatedButton
                onPress={() => setShowBatsmanModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </AnimatedButton>
            </View>
          </View>
        </Modal>

        <Modal visible={showBowlerModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Bowler</Text>
              {bowlingTeam.map((player, index) => (
                <AnimatedButton
                  key={index}
                  style={styles.modalItem}
                  onPress={() => handleSelectBowler(player)}
                >
                  <Text style={styles.modalItemText}>{player}</Text>
                </AnimatedButton>
              ))}
              <AnimatedButton
                onPress={() => setShowBowlerModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </AnimatedButton>
            </View>
          </View>
        </Modal>

        {switchMessage !== "" && (
          <Text style={styles.switchMessage}>{switchMessage}</Text>
        )}

        <Modal visible={showMatches} animationType="slide"></Modal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#3498db",
    padding: 8,
    borderRadius: 20,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 22,
    color: "#2c3e50",
    fontWeight: "bold",
  },
  scoreCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#2c3e50",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scoreColumn: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  scoreDetails: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  currentScore: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#e74c3c",
    textAlign: "right",
  },
  overs: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "right",
  },
  extras: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    marginTop: 8,
  },
  detailContainer: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
    textAlign: "left",
  },
  detailText: {
    fontSize: 14,
    color: "#2c3e50",
    textAlign: "left",
    marginBottom: 4,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 16,
  },
  quickButton: {
    backgroundColor: "#27ae60",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  quickButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: "#3498db",
    width: 100,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  resetButton: {
    backgroundColor: "#e74c3c",
    width: 100,
    height: 40,
    borderRadius: 8,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(44, 62, 80, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#bdc3c7",
    width: "100%",
    alignItems: "center",
  },
  modalItemText: {
    fontSize: 18,
    color: "#2c3e50",
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: "#2980b9",
    padding: 10,
    borderRadius: 8,
    width: "60%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  switchMessage: {
    position: "absolute",
    bottom: 650,
    alignSelf: "center",
    fontSize: 16,
    color: "#2c3e50",
    backgroundColor: "#ecf0f1",
    padding: 8,
    borderRadius: 8,
  },
});

export default ScoreScreen;

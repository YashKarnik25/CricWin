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
import { useNavigation } from "expo-router/react-navigation";
import { database } from "../lib/firebase";
import {
  ref,
  query,
  orderByChild,
  equalTo,
  get,
  update,
} from "firebase/database";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const AnimatedButton = ({ children, onPress, style, disabled, ...props }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    if (disabled) return;
    Animated.timing(scaleValue, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    if (disabled) return;
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };
  return (
    <AnimatedTouchable
      onPress={disabled ? null : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={disabled ? 1 : 0.8}
      style={[
        style,
        { transform: [{ scale: scaleValue }], opacity: disabled ? 0.6 : 1 },
      ]}
      {...props}
    >
      {children}
    </AnimatedTouchable>
  );
};

const ScoreScreen = ({ match, battingTeam1, bowlingTeam1 }) => {
  const navigation = useNavigation();
  const [showMatches, setShowMatches] = useState(false);
  const [currentBattingTeam, setCurrentBattingTeam] = useState(battingTeam1);
  const [currentBowlingTeam, setCurrentBowlingTeam] = useState(bowlingTeam1);
  const [tournamentOvers, setTournamentOvers] = useState(null);
  const maxOvers = Number(match?.overs || tournamentOvers || 10);

  const [firstInning, setFirstInning] = useState(null);
  const [secondInning, setSecondInning] = useState(null);

  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [teamPlayerEmails, setTeamPlayerEmails] = useState({});

  const [dismissedBatsmenFirst, setDismissedBatsmenFirst] = useState([]);
  const [dismissedBatsmenSecond, setDismissedBatsmenSecond] = useState([]);

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

  // History tracking for Snapshot Undo/Redo
  const [history, setHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);

  const [showBatsmanModal, setShowBatsmanModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);

  const [innings, setInnings] = useState(1);
  const [targetRuns, setTargetRuns] = useState(null);
  const [switchMessage, setSwitchMessage] = useState("");
  const [isAfterNoBall, setIsAfterNoBall] = useState(false);
  const [extras, setExtras] = useState({ wides: 0, noBalls: 0, total: 0 });
  const [fielderCatches, setFielderCatches] = useState({});
  const [showDismissalModal, setShowDismissalModal] = useState(false);
  const [showFielderModal, setShowFielderModal] = useState(false);
  const [pendingDismissal, setPendingDismissal] = useState("");
  const inningsSwitchingRef = useRef(false);
  const matchFinalizedRef = useRef(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setCurrentBattingTeam(battingTeam1);
    setCurrentBowlingTeam(bowlingTeam1);
  }, [battingTeam1, bowlingTeam1]);

  useEffect(() => {
    let isMounted = true;
    const fetchTournamentOvers = async () => {
      if (match?.overs || !match?.tournamentId) return;
      try {
        const snapshot = await get(
          ref(database, `tournaments/${match.tournamentId}/overs`),
        );
        if (isMounted && snapshot.exists()) {
          setTournamentOvers(Number(snapshot.val()));
        }
      } catch (error) {
        console.error("Error fetching tournament overs:", error);
      }
    };
    fetchTournamentOvers();
    return () => {
      isMounted = false;
    };
  }, [match?.overs, match?.tournamentId]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsRef = ref(database, "teams");
        const teamQuery1 = query(
          teamsRef,
          orderByChild("teamName"),
          equalTo(battingTeam1),
        );
        const teamQuery2 = query(
          teamsRef,
          orderByChild("teamName"),
          equalTo(bowlingTeam1),
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
          setTeamPlayerEmails(
            [...t1, ...t2].reduce((emails, player) => {
              if (player.name && player.email) emails[player.name] = player.email;
              return emails;
            }, {}),
          );
        } else {
          console.log("No team data available");
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };
    fetchTeams();
  }, [match]);

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

  const storeMatchData = async (firstData, secondData, winningTeamName) => {
    try {
      await update(ref(database, `matches/${match.id}`), {
        scoreCard: {
          firstInning: firstData,
          secondInning: secondData,
        },
        winner: winningTeamName,
      });
      console.log("Match data stored successfully.");
    } catch (error) {
      console.error("Error storing match data:", error);
      throw error;
    }
  };

  const updateMatchStatus = async () => {
    try {
      const matchRef = ref(database, `matches/${match.id}`);
      await update(matchRef, { status: "completed" });
      console.log("Match status updated to completed.");
    } catch (error) {
      console.error("Error updating match status:", error);
      throw error;
    }
  };

  const updateOverallPlayerStats = async (firstData, secondData, winnerName) => {
    const matchStats = {};
    const initPlayer = (name) => {
      if (!name) return;
      if (!matchStats[name]) {
        matchStats[name] = {
          batting: { runs: 0, balls: 0 },
          bowling: { runs: 0, balls: 0, wickets: 0 },
          catches: 0,
        };
      }
    };
    const addBattingStats = (inningsData) => {
      const batsmen = inningsData?.batsmen;
      if (!batsmen) return;
      const countedBatsmen = new Set();
      [batsmen.striker, batsmen.nonStriker, ...(batsmen.dismissed || [])]
        .filter((player) => {
          if (!player?.name || countedBatsmen.has(player.name)) return false;
          countedBatsmen.add(player.name);
          return true;
        })
        .forEach((player) => {
          initPlayer(player.name);
          matchStats[player.name].batting.runs += Number(player.runs) || 0;
          matchStats[player.name].batting.balls += Number(player.balls) || 0;
        });
    };
    const addBowlingStats = (inningsData) => {
      Object.entries(inningsData?.bowlers || {}).forEach(([name, bowler]) => {
        if (name === "current" || !bowler) return;
        initPlayer(name);
        matchStats[name].bowling.runs += Number(bowler.runsGiven) || 0;
        matchStats[name].bowling.balls += Number(bowler.balls) || 0;
        matchStats[name].bowling.wickets += Number(bowler.wickets) || 0;
      });
    };
    addBattingStats(firstData);
    addBattingStats(secondData);
    addBowlingStats(firstData);
    addBowlingStats(secondData);
    Object.entries(fielderCatches).forEach(([name, catches]) => {
      initPlayer(name);
      matchStats[name].catches += catches;
    });

    const allPlayers = Array.from(
      new Set([...team1Players, ...team2Players, ...Object.keys(matchStats)]),
    ).filter(Boolean);
    const tournamentId = match?.tournamentId;
    const matchId = match?.id;
    let tournamentName = "";
    if (tournamentId) {
      const tournamentSnapshot = await get(
        ref(database, `tournaments/${tournamentId}/name`),
      );
      if (tournamentSnapshot.exists()) tournamentName = tournamentSnapshot.val();
    }

    await Promise.all(
      allPlayers.map(async (playerName) => {
        const playerRef = ref(database, `playerStats/${playerName}`);
        const snapshot = await get(playerRef);
        const currentData = snapshot.exists() ? snapshot.val() : {};
        if (matchId && currentData.matchHistory?.[matchId]) return;
        const contribution = matchStats[playerName] || {
          batting: { runs: 0, balls: 0 },
          bowling: { runs: 0, balls: 0, wickets: 0 },
          catches: 0,
        };
        const nextMatches = (Number(currentData.matches) || 0) + 1;
        const mergeStats = (existing = {}, addition, matchesPlayed) => {
          const runs = (Number(existing.runs) || 0) + addition.runs;
          const balls = (Number(existing.balls) || 0) + addition.balls;
          const stats = { ...existing, runs, balls };
          if ("wickets" in addition) {
            stats.wickets = (Number(existing.wickets) || 0) + addition.wickets;
          }
          if ("strikeRate" in existing || addition.balls > 0) {
            stats.strikeRate = balls > 0 ? (runs / balls) * 100 : 0;
          }
          if ("average" in existing || addition.runs > 0) {
            stats.average = matchesPlayed > 0 ? runs / matchesPlayed : runs;
          }
          return stats;
        };
        const matchContribution = {
          batting: {
            ...contribution.batting,
            strikeRate:
              contribution.batting.balls > 0
                ? (contribution.batting.runs / contribution.batting.balls) *
                  100
                : 0,
            average: contribution.batting.runs,
          },
          bowling: contribution.bowling,
          catches: contribution.catches,
          matches: 1,
        };
        const updates = {
          matches: nextMatches,
          batting: mergeStats(
            currentData.batting,
            contribution.batting,
            nextMatches,
          ),
          bowling: mergeStats(
            currentData.bowling,
            contribution.bowling,
            nextMatches,
          ),
          catches: (Number(currentData.catches) || 0) + contribution.catches,
        };
        const playerEmail =
          currentData.email || teamPlayerEmails[playerName] || "";
        if (playerEmail) updates.email = playerEmail;

        if (tournamentId) {
          const tournamentStats = currentData.tournaments?.[tournamentId] || {};
          const tournamentMatches = (Number(tournamentStats.matches) || 0) + 1;
          updates[`tournaments/${tournamentId}`] = {
            ...tournamentStats,
            name: tournamentName || tournamentStats.name || tournamentId,
            matches: tournamentMatches,
            batting: mergeStats(
              tournamentStats.batting,
              contribution.batting,
              tournamentMatches,
            ),
            bowling: mergeStats(
              tournamentStats.bowling,
              contribution.bowling,
              tournamentMatches,
            ),
            catches:
              (Number(tournamentStats.catches) || 0) + contribution.catches,
          };
        }
        if (matchId) {
          updates[`matchHistory/${matchId}`] = {
            ...matchContribution,
            matchId,
            tournamentId: tournamentId || null,
            winner: winnerName,
          };
        }
        await update(playerRef, updates);
      }),
    );
  };

  const getInningsData = (teamRunsKey, teamWicketsKey, dismissedBatsmen) => ({
    history,
    batsmen: {
      striker: currentBatsmen.striker,
      nonStriker: currentBatsmen.nonStriker,
      bench: battingTeamBench,
      dismissed: dismissedBatsmen,
    },
    bowlers: {
      ...allBowlersStats,
      ...(currentBowler.name ? { [currentBowler.name]: currentBowler } : {}),
    },
    extras,
    [teamRunsKey]: totalRuns,
    [teamWicketsKey]: wickets,
  });

  async function finalizeMatch(winnerName, resultMessage) {
    if (matchFinalizedRef.current || !firstInning) return;
    matchFinalizedRef.current = true;
    const secondInningData = getInningsData(
      "team2TotalRuns",
      "team2Wickets",
      dismissedBatsmenSecond,
    );
    setSecondInning(secondInningData);
    try {
      await Promise.all([
        storeMatchData(firstInning, secondInningData, winnerName),
        updateOverallPlayerStats(firstInning, secondInningData, winnerName),
        updateMatchStatus(),
      ]);
      Alert.alert("Match Result", resultMessage, [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("Dashboard");
            setShowMatches(true);
          },
        },
      ]);
    } catch (error) {
      console.error("Error finalizing match:", error);
      Alert.alert("Error", "The match result could not be saved.");
      matchFinalizedRef.current = false;
    }
  }

  const resetScore = (preserveCatches = false) => {
    setTotalRuns(0);
    setWickets(0);
    setBallsInOver(0);
    setCompletedOvers(0);
    setHistory([]);
    setRedoHistory([]);
    setAllBowlersStats({});
    setExtras({ wides: 0, noBalls: 0, total: 0 });
    if (!preserveCatches) setFielderCatches({});
    setShowBatsmanModal(false);
    setShowBowlerModal(false);
    setShowDismissalModal(false);
    setShowFielderModal(false);
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

  // -----------------------------------------------------
  // UNDO / REDO SNAPSHOT ARCHITECTURE
  // -----------------------------------------------------
  const saveStateToHistory = (actionDetails) => {
    const snapshot = {
      totalRuns,
      wickets,
      ballsInOver,
      completedOvers,
      currentBatsmen: JSON.parse(JSON.stringify(currentBatsmen)),
      currentBowler: JSON.parse(JSON.stringify(currentBowler)),
      allBowlersStats: JSON.parse(JSON.stringify(allBowlersStats)),
      extras: { ...extras },
      fielderCatches: { ...fielderCatches },
      isAfterNoBall,
      battingTeamBench: [...battingTeamBench],
      dismissedBatsmenFirst: [...dismissedBatsmenFirst],
      dismissedBatsmenSecond: [...dismissedBatsmenSecond],
    };
    setHistory((prev) => [...prev, { ...actionDetails, snapshot }]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastEvent = history[history.length - 1];

    setRedoHistory((prev) => [...prev, lastEvent]);
    setHistory((prev) => prev.slice(0, -1));

    // Restore Exact Snapshot
    const s = lastEvent.snapshot;
    setTotalRuns(s.totalRuns);
    setWickets(s.wickets);
    setBallsInOver(s.ballsInOver);
    setCompletedOvers(s.completedOvers);
    setCurrentBatsmen(s.currentBatsmen);
    setCurrentBowler(s.currentBowler);
    setAllBowlersStats(s.allBowlersStats);
    setExtras(s.extras);
    setFielderCatches(s.fielderCatches);
    setIsAfterNoBall(s.isAfterNoBall);
    setBattingTeamBench(s.battingTeamBench);
    setDismissedBatsmenFirst(s.dismissedBatsmenFirst);
    setDismissedBatsmenSecond(s.dismissedBatsmenSecond);
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    const redoEvent = redoHistory[redoHistory.length - 1];
    setRedoHistory((prev) => prev.slice(0, -1));

    // Re-execute Action
    if (redoEvent.type === "run") handleLegalBall(redoEvent.value, true);
    else if (redoEvent.type === "wicket")
      handleWicket(true, redoEvent.dismissalType, redoEvent.fielder);
    else if (redoEvent.type === "wide") handleWide(true);
    else if (redoEvent.type === "noBall") handleNoBall(true);
  };

  const handleLegalBall = (runValue, isRedo = false) => {
    if (!isRedo) setRedoHistory([]);
    saveStateToHistory({ type: "run", value: runValue });

    setTotalRuns((prev) => prev + runValue);
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

  const handleWicket = (
    isRedo = false,
    dismissalType = "Bowled",
    fielder = "",
  ) => {
    if (!isRedo) setRedoHistory([]);
    saveStateToHistory({ type: "wicket", dismissalType, fielder });

    setWickets((prev) => prev + 1);
    if (innings === 1) {
      setDismissedBatsmenFirst((prev) => [
        ...prev,
        { ...currentBatsmen.striker, dismissalType, fielder },
      ]);
    } else if (innings === 2) {
      setDismissedBatsmenSecond((prev) => [
        ...prev,
        { ...currentBatsmen.striker, dismissalType, fielder },
      ]);
    }
    setCurrentBatsmen((prev) => ({
      ...prev,
      striker: { ...prev.striker, balls: prev.striker.balls + 1 },
    }));
    setCurrentBowler((prev) => ({
      ...prev,
      wickets: prev.wickets + (dismissalType === "Run Out" ? 0 : 1),
      balls: prev.balls + 1,
    }));
    if (dismissalType === "Caught" && fielder) {
      setFielderCatches((prev) => ({
        ...prev,
        [fielder]: (prev[fielder] || 0) + 1,
      }));
    }

    if (isAfterNoBall) {
      setIsAfterNoBall(false);
    } else {
      incrementBall();
    }

    setShowBatsmanModal(true);
  };

  const startWicket = () => setShowDismissalModal(true);

  const selectDismissalType = (dismissalType) => {
    setPendingDismissal(dismissalType);
    setShowDismissalModal(false);
    if (dismissalType === "Caught" || dismissalType === "Run Out") {
      setShowFielderModal(true);
    } else {
      handleWicket(false, dismissalType);
    }
  };

  const selectWicketFielder = (fielder) => {
    setShowFielderModal(false);
    handleWicket(false, pendingDismissal, fielder);
  };

  const handleWide = (isRedo = false) => {
    if (!isRedo) setRedoHistory([]);
    saveStateToHistory({ type: "wide" });

    setTotalRuns((prev) => prev + 1);
    setExtras((prev) => ({
      ...prev,
      wides: prev.wides + 1,
      total: prev.total + 1,
    }));
    setCurrentBowler((prev) => ({
      ...prev,
      runsGiven: prev.runsGiven + 1,
    }));
  };

  const handleNoBall = (isRedo = false) => {
    if (!isRedo) setRedoHistory([]);
    saveStateToHistory({ type: "noBall" });

    setTotalRuns((prev) => prev + 1);
    setExtras((prev) => ({
      ...prev,
      noBalls: prev.noBalls + 1,
      total: prev.total + 1,
    }));
    setCurrentBowler((prev) => ({
      ...prev,
      runsGiven: prev.runsGiven + 1,
    }));
    setIsAfterNoBall(true);
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
    if (!player || player === currentBowler.name) return;
    const outgoingStats = currentBowler.name
      ? { [currentBowler.name]: { ...currentBowler } }
      : {};
    const updatedStats = { ...allBowlersStats, ...outgoingStats };
    const existingStats = updatedStats[player] || {
      runsGiven: 0,
      wickets: 0,
      balls: 0,
    };
    setAllBowlersStats(updatedStats);
    setCurrentBowler({
      name: player,
      ...existingStats,
    });
    setShowBowlerModal(false);
  };

  function handleSwitchInnings() {
    if (inningsSwitchingRef.current) return;
    inningsSwitchingRef.current = true;
    const firstInningData = getInningsData(
      "team1TotalRuns",
      "team1Wickets",
      dismissedBatsmenFirst,
    );
    setFirstInning(firstInningData);
    setTargetRuns(totalRuns + 1);
    setInnings(2);
    resetScore(true);
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
    setCurrentBattingTeam(currentBowlingTeam);
    setCurrentBowlingTeam(currentBattingTeam);
    setSwitchMessage(
      `${currentBowlingTeam} need ${totalRuns + 1} runs to win.`,
    );
  }

  useEffect(() => {
    if (innings === 1 && !inningsSwitchingRef.current && team1Players.length > 0) {
      const maxWickets = team1Players.length - 1;
      if (completedOvers >= maxOvers || wickets >= maxWickets) {
        handleSwitchInnings();
      }
    }
  }, [
    completedOvers,
    wickets,
    innings,
    team1Players,
    maxOvers,
    handleSwitchInnings,
  ]);

  useEffect(() => {
    if (innings === 2 && targetRuns !== null && !matchFinalizedRef.current) {
      const maxWicketsTeam2 =
        team2Players.length > 0 ? team2Players.length - 1 : 10;
      const inningsComplete =
        completedOvers >= maxOvers || wickets >= maxWicketsTeam2;
      if (totalRuns >= targetRuns) {
        finalizeMatch(currentBattingTeam, "wins!");
      } else if (inningsComplete && totalRuns === targetRuns - 1) {
        finalizeMatch("Match Tied!", "Match Tied!");
      } else if (inningsComplete && totalRuns < targetRuns - 1) {
        finalizeMatch(currentBowlingTeam, "wins!");
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
    currentBattingTeam,
    currentBowlingTeam,
    maxOvers,
    finalizeMatch,
  ]);

  const displayOvers = `${completedOvers}.${ballsInOver}`;
  const bowlerOvers = `${Math.floor(currentBowler.balls / 6)}.${currentBowler.balls % 6}`;

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

        {switchMessage !== "" && (
          <Text style={styles.switchMessage}>{switchMessage}</Text>
        )}

        <Animated.View style={[styles.scoreCard, { opacity: fadeAnim }]}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreColumn}>
              <Text style={styles.teamName}>{currentBattingTeam}</Text>
              <Text style={styles.scoreDetails}>
                CRR:{" "}
                {(totalRuns /
                  Math.max(completedOvers + ballsInOver / 6, 0.1)).toFixed(2)}
              </Text>
              <Text style={styles.scoreDetails}>
                RRR:{" "}
                {innings === 1 || targetRuns === null
                  ? "--"
                  : (
                      (targetRuns - totalRuns) /
                      Math.max(
                        (maxOvers * 6 -
                          (completedOvers * 6 + ballsInOver)) /
                          6,
                        0.1,
                      )
                    ).toFixed(2)}
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
            Extras: {extras.total} (B:0, LB:0, WD:{extras.wides}, NB:
            {extras.noBalls}, P:0)
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
          <AnimatedButton
            style={styles.actionButton}
            onPress={startWicket}
          >
            <Text style={styles.actionButtonText}>WICKET</Text>
          </AnimatedButton>
          <AnimatedButton
            style={styles.actionButton}
            onPress={() => handleWide(false)}
          >
            <Text style={styles.actionButtonText}>WD</Text>
          </AnimatedButton>
          <AnimatedButton
            style={styles.actionButton}
            onPress={() => handleNoBall(false)}
          >
            <Text style={styles.actionButtonText}>NB</Text>
          </AnimatedButton>
          <AnimatedButton
            style={[
              styles.actionButton,
              { backgroundColor: history.length > 0 ? "#3498db" : "#95a5a6" },
            ]}
            onPress={handleUndo}
            disabled={history.length === 0}
          >
            <Text style={styles.actionButtonText}>UNDO</Text>
          </AnimatedButton>
          <AnimatedButton
            style={[
              styles.actionButton,
              {
                backgroundColor: redoHistory.length > 0 ? "#f39c12" : "#95a5a6",
              },
            ]}
            onPress={handleRedo}
            disabled={redoHistory.length === 0}
          >
            <Text style={styles.actionButtonText}>REDO</Text>
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
            </View>
          </View>
        </Modal>

        <Modal visible={showBowlerModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Bowler</Text>
              {bowlingTeam
                .filter((player) => player !== currentBowler.name)
                .map((player, index) => (
                <AnimatedButton
                  key={index}
                  style={styles.modalItem}
                  onPress={() => handleSelectBowler(player)}
                >
                  <Text style={styles.modalItemText}>{player}</Text>
                </AnimatedButton>
              ))}
            </View>
          </View>
        </Modal>

        <Modal
          visible={showDismissalModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowDismissalModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Dismissal</Text>
              {["Bowled", "Caught", "Run Out", "LBW"].map((dismissal) => (
                <AnimatedButton
                  key={dismissal}
                  style={styles.modalItem}
                  onPress={() => selectDismissalType(dismissal)}
                >
                  <Text style={styles.modalItemText}>{dismissal}</Text>
                </AnimatedButton>
              ))}
            </View>
          </View>
        </Modal>

        <Modal
          visible={showFielderModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowFielderModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Fielder</Text>
              {bowlingTeam.map((player) => (
                <AnimatedButton
                  key={player}
                  style={styles.modalItem}
                  onPress={() => selectWicketFielder(player)}
                >
                  <Text style={styles.modalItemText}>{player}</Text>
                </AnimatedButton>
              ))}
            </View>
          </View>
        </Modal>

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
    width: 90,
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
    alignSelf: "stretch",
    fontSize: 16,
    color: "#2c3e50",
    backgroundColor: "#ecf0f1",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    textAlign: "center",
  },
});

export default ScoreScreen;

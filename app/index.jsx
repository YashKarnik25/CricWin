import React from "react";
import { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Button,
  TextInput,
  Alert,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "expo-router/react-navigation";
import { Card } from "../components/Card";
import { database } from "../lib/firebase";
import {
  ref,
  onValue,
  push,
  query,
  equalTo,
  get,
  orderByChild,
  set,
  runTransaction,
} from "firebase/database";
import { Picker } from "@react-native-picker/picker";
import { UserContext } from "./_layout";
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const IndexScreen = ({ navigation }) => {
  const { emailGlobal } = useContext(UserContext);
  const [currentState, setCurrentState] = useState("home");
  const [isLogin, setIsLogin] = useState(false);
  const [hasAnAccount, setHasAnAccount] = useState(true);
  const [tournamentId, setTournamentId] = useState("");

  useEffect(() => {
    setIsLogin(Boolean(emailGlobal));
  }, [emailGlobal]);

  const TournamentCard = ({ tournament }) => {
    const navigation = useNavigation();

    return (
      <TouchableOpacity
        onPress={() => {
          setTournamentId(tournament.id);
          if (isLogin) setCurrentState("register");
          else if (!isLogin) setCurrentState("login");
        }}
      >
        <Card style={styles.cardContainer}>
          <LinearGradient
            colors={["#00b09b", "#96c93d"]}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardContent} id={tournament.tid}>
              <Text style={styles.tournamentName}>{tournament.name}</Text>
              <Text style={styles.prizePool}>₹ {tournament.prizePool}</Text>
              <Text style={styles.tournamentInfo}>
                Entry Fee: ₹ {tournament.entryFee}
              </Text>
              <Text style={styles.tournamentInfo}>
                Ball Type: {tournament.ballType}
              </Text>
              <Text style={styles.tournamentInfo}>
                Overs: {tournament.overs}
              </Text>
              <Text style={styles.tournamentInfo}>
                Location: {tournament.location}
              </Text>
            </View>
          </LinearGradient>
        </Card>
      </TouchableOpacity>
    );
  };

  const TournamentSection = ({ title, data }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={data}
        renderItem={({ item }) => <TournamentCard tournament={item} />}
        keyExtractor={(item) => item.id}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        snapToAlignment="start"
        snapToInterval={width - 48}
        decelerationRate="fast"
      />
    </View>
  );

  const HomeScreen = () => {
    const [tournaments, setTournaments] = useState([]);

    useEffect(() => {
      const tournamentsRef = ref(database, "tournaments");
      onValue(tournamentsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const tournamentsArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setTournaments(tournamentsArray);
        }
      });
    }, []);

    const lowTier = tournaments.filter(
      (t) => Number.parseInt(t.prizePool) < 10000,
    );
    const midTier = tournaments.filter((t) => {
      const pool = Number.parseInt(t.prizePool);
      return pool >= 10000 && pool < 50000;
    });
    const highTier = tournaments.filter(
      (t) => Number.parseInt(t.prizePool) >= 50000,
    );

    return (
      <ScrollView style={styles.container}>
        {isLogin && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              setCurrentState("login");
              setIsLogin(false);
            }}
          >
            <MaterialIcons name="logout" size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
        <StatusBar style="dark" />
        <Text style={styles.header}>Cricket Tournaments</Text>
        <TournamentSection title="Prize Pool: Up to ₹10,000" data={lowTier} />
        <TournamentSection
          title="Prize Pool: ₹10,000 - ₹50,000"
          data={midTier}
        />
        <TournamentSection
          title="Prize Pool: ₹50,000 and above"
          data={highTier}
        />
      </ScrollView>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f0f0f0",
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-end",
      backgroundColor: "#FFF",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginTop: 12,
      marginRight: 16,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    logoutText: {
      color: "#FF3B30",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginVertical: 20,
      color: "#333",
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginLeft: 16,
      marginBottom: 10,
      color: "#333",
    },
    listContainer: {
      paddingHorizontal: 16,
    },
    cardContainer: {
      width: width - 80,
      height: 200,
      marginRight: 16,
      overflow: "hidden",
    },
    cardGradient: {
      flex: 1,
    },
    cardContent: {
      flex: 1,
      padding: 16,
      justifyContent: "center",
    },
    tournamentName: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#ffffff",
      marginBottom: 8,
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
    prizePool: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#ffffff",
      marginBottom: 12,
      textShadowColor: "rgba(0, 0, 0, 0.5)",
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 4,
    },
    tournamentInfo: {
      fontSize: 14,
      color: "#ffffff",
      marginBottom: 4,
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
  });

  const RegisterTournaments = ({ tid }) => {
    const { emailGlobal, roleGlobal } = useContext(UserContext);
    const tournamentId = tid;
    const teamRef = ref(database, "teams");
    const [teamName, setTeamName] = useState("");
    const [teamEmail, setTeamEmail] = useState("");

    const handleRegister = async () => {
      const normalizedTeamName = teamName.trim();
      const normalizedEmail = teamEmail.trim().toLowerCase();
      const normalizedLoginEmail = emailGlobal.trim().toLowerCase();
      if (!normalizedTeamName || !normalizedEmail) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }
      if (roleGlobal !== "owner") {
        Alert.alert("Manager Required", "Only a team manager can register a team.");
        return;
      }
      try {
        const userQuery = query(
          ref(database, "user"),
          orderByChild("email"),
          equalTo(normalizedLoginEmail),
        );
        const userSnapshot = await get(userQuery);
        const account = userSnapshot.exists()
          ? Object.values(userSnapshot.val())[0]
          : null;
        if (!account || account.role !== "owner" || roleGlobal !== "owner") {
          Alert.alert("Manager Required", "Sign in with a manager account to register.");
          return;
        }

        const teamsSnapshot = await get(teamRef);
        const matchingTeam = teamsSnapshot.exists()
          ? Object.values(teamsSnapshot.val()).find(
              (team) =>
                String(team.teamName || "").trim().toLowerCase() ===
                normalizedTeamName.toLowerCase(),
            )
          : null;
        if (!matchingTeam) {
          Alert.alert("No Such Team", `Please register you team first`);
          return;
        }
        const teamOwnerEmail = String(
          matchingTeam.ownerEmail || matchingTeam.email || "",
        )
          .trim()
          .toLowerCase();
        if (teamOwnerEmail !== normalizedLoginEmail) {
          Alert.alert("Team Ownership Required", "You can only register a team owned by your account.");
          return;
        }
        if (
          String(matchingTeam.email || "").trim().toLowerCase() !==
          normalizedEmail
        ) {
          Alert.alert("Invalid Email", "The email address does not match this team.");
          return;
        }

        const tournamentRef = ref(database, `tournaments/${tournamentId}`);
        const tournamentSnapshot = await get(tournamentRef);
        if (!tournamentSnapshot.exists()) {
          Alert.alert("Error", "Tournament not found.");
          return;
        }
        const tournament = tournamentSnapshot.val();
        const registeredTeams = Array.isArray(tournament.teams)
          ? tournament.teams
          : Object.values(tournament.teams || {});
        if (
          registeredTeams.some(
            (team) =>
              String(team).toLowerCase() === normalizedTeamName.toLowerCase(),
          )
        ) {
          Alert.alert(
            "Already Registered",
            "This team is already registered for the tournament.",
          );
          return;
        }
        if (!Number.isFinite(Number(tournament.slots)) || Number(tournament.slots) <= 0) {
          Alert.alert("No Slots", "No tournament slots are available.");
          return;
        }
        const entryFee = Number(tournament.entryFee);
        const appUrl =
          "upi://pay?pa=yashkarnik25-1@okicici&pn=CricWun&am=" +
          entryFee +
          "&tn=Payment%20for%20Tournament%20Registration&cu=INR";
        const canOpen = await Linking.canOpenURL(appUrl);
        if (!canOpen) {
          Alert.alert(
            "Payment Unavailable",
            "Google Pay is not installed or UPI is not supported.",
          );
          return;
        }
        await Linking.openURL(appUrl);

        let registrationError = "";
        const transaction = await runTransaction(
          tournamentRef,
          (currentTournament) => {
            if (!currentTournament) {
              registrationError = "Tournament not found.";
              return;
            }
            const existingTeams = Array.isArray(currentTournament.teams)
              ? currentTournament.teams
              : Object.values(currentTournament.teams || {});
            const slots = Number(currentTournament.slots);
            if (existingTeams.some((team) => String(team).toLowerCase() === normalizedTeamName.toLowerCase())) {
              registrationError = "This team is already registered for the tournament.";
              return;
            }
            if (!Number.isFinite(slots) || slots <= 0) {
              registrationError = "No tournament slots are available.";
              return;
            }
            return {
              ...currentTournament,
              teams: [...existingTeams, normalizedTeamName],
              slots: slots - 1,
            };
          },
          { applyLocally: false },
        );
        if (!transaction.committed) {
          Alert.alert("Registration Failed", registrationError || "Registration could not be completed.");
          return;
        }
        Alert.alert("Success", "Team registered successfully.");
        setCurrentState("home");
      } catch (error) {
        console.error("Error registering for tournament:", error);
        Alert.alert("Error", "Tournament registration failed. Please try again.");
      }
    };

    return (
      <View style={registerStyle.container}>
        <TextInput
          style={registerStyle.input}
          placeholder="Enter team name"
          value={teamName}
          onChangeText={setTeamName}
          placeholderTextColor="#999"
        />
        <TextInput
          style={registerStyle.input}
          placeholder="Enter Email of the team"
          value={teamEmail}
          onChangeText={setTeamEmail}
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={registerStyle.button} onPress={handleRegister}>
          <Text style={registerStyle.buttonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={registerStyle.button}
          onPress={() => {
            setCurrentState("home");
          }}
        >
          <Text style={registerStyle.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const registerStyle = StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      backgroundColor: "#f5f5f5",
      justifyContent: "center",
      maxWidth: 500,
      alignSelf: "center",
      width: "100%",
    },
    input: {
      height: 55,
      backgroundColor: "#ffffff",
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      fontSize: 16,
      color: "#333333",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: "#e0e0e0",
    },
    button: {
      height: 55,
      backgroundColor: "#4CAF50",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 8,
      shadowColor: "#4CAF50",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonText: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
  });

  const SignUpPage = () => {
    const [form, setForm] = useState({
      firstname: "",
      lastname: "",
      email: "",
      contact: "",
      role: "player",
      password: "",
      confirmPassword: "",
    });

    const handleInputChange = (field, value) => {
      setForm({ ...form, [field]: value });
    };

    const handleSignup = async () => {
      const {
        firstname,
        lastname,
        email,
        contact,
        role,
        password,
        confirmPassword,
      } = form;
      const normalizedEmail = email.trim().toLowerCase();

      if (
        !firstname.trim() ||
        !lastname.trim() ||
        !normalizedEmail ||
        !contact.trim() ||
        !password.trim() ||
        !confirmPassword.trim()
      ) {
        Alert.alert("Error", "Please fill in all fields.");
        return;
      }
      if (!["player", "owner"].includes(role)) {
        Alert.alert("Invalid Role", "Choose Player or Manager to create an account.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        Alert.alert("Invalid Email", "Please enter a valid email address.");
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match.");
        return;
      }
      const userRef = ref(database, "user");
      try {
        const duplicate = await get(
          query(userRef, orderByChild("email"), equalTo(normalizedEmail)),
        );
        if (duplicate.exists()) {
          Alert.alert("Duplicate Email", "An account already exists for this email.");
          return;
        }
        await push(userRef, {
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          email: normalizedEmail,
          contact: contact.trim(),
          role,
          password,
        });
        const initialStats = {
          matches: 0,
          batting: { runs: 0, balls: 0, average: 0, strikeRate: 0 },
          bowling: { balls: 0, runs: 0, wickets: 0 },
          catches: 0,
          email: normalizedEmail,
          tournaments: {},
          matchHistory: {},
        };
        await set(
          ref(database, `playerStats/${firstname.trim()} ${lastname.trim()}`),
          initialStats,
        );
        Alert.alert("Success", "User added successfully");
        setCurrentState("login");
      } catch (error) {
        console.error("Error adding User:", error);
        Alert.alert("Error", "Failed to create account.");
      }
    };

    return (
      <ScrollView>
        <View style={signUpStyle.container}>
          <Text style={signUpStyle.title}>Create Account</Text>
          <Text style={signUpStyle.subtitle}>Sign up to get started</Text>

          <TextInput
            style={signUpStyle.input}
            placeholder="First Name"
            placeholderTextColor="#aaa"
            value={form.firstname}
            onChangeText={(value) => handleInputChange("firstname", value)}
          />
          <TextInput
            style={signUpStyle.input}
            placeholder="Last Name"
            placeholderTextColor="#aaa"
            value={form.lastname}
            onChangeText={(value) => handleInputChange("lastname", value)}
          />
          <TextInput
            style={signUpStyle.input}
            placeholder="Email"
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(value) => handleInputChange("email", value)}
          />
          <TextInput
            style={signUpStyle.input}
            placeholder="Contact"
            placeholderTextColor="#aaa"
            keyboardType="phone-pad"
            value={form.contact}
            onChangeText={(value) => handleInputChange("contact", value)}
          />

          <View style={signUpStyle.dropdownContainer}>
            <Picker
              selectedValue={form.role}
              style={signUpStyle.dropdown}
              onValueChange={(itemValue) =>
                handleInputChange("role", itemValue)
              }
            >
              <Picker.Item label="Choose Role" value=" " />
              <Picker.Item label="Player" value="player" />
              <Picker.Item label="Owner" value="owner" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>

          <TextInput
            style={signUpStyle.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={form.password}
            onChangeText={(value) => handleInputChange("password", value)}
          />
          <TextInput
            style={signUpStyle.input}
            placeholder="Confirm Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={form.confirmPassword}
            onChangeText={(value) =>
              handleInputChange("confirmPassword", value)
            }
          />

          <TouchableOpacity style={signUpStyle.button} onPress={handleSignup}>
            <Text style={signUpStyle.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          <Text style={signUpStyle.footerText}>
            Already have an account?{" "}
            <Text
              style={signUpStyle.linkText}
              onPress={() => {
                setCurrentState("login");
              }}
            >
              Log in here
            </Text>
          </Text>
        </View>
      </ScrollView>
    );
  };

  const signUpStyle = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f9f9f9",
      paddingHorizontal: 20,
      marginTop: 5,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: "#666",
      marginBottom: 30,
    },
    input: {
      width: "100%",
      height: 50,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 8,
      paddingHorizontal: 15,
      backgroundColor: "#fff",
      marginBottom: 15,
      fontSize: 16,
      color: "#333",
    },
    dropdownContainer: {
      width: "100%",
      height: 50,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 8,
      backgroundColor: "#fff",
      marginBottom: 15,
      justifyContent: "center",
    },
    dropdown: {
      width: "100%",
      height: "100%",
      paddingHorizontal: 15,
      color: "#333",
    },
    button: {
      width: "100%",
      height: 50,
      backgroundColor: "#4CAF50",
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    buttonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
    },
    footerText: {
      fontSize: 14,
      color: "#666",
    },
    linkText: {
      color: "#4CAF50",
      fontWeight: "bold",
    },
  });

  const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { emailGlobal, setEmailGlobal, setRoleGlobal } =
      useContext(UserContext);

    const handleLogin = async () => {
      if (!email.trim() || !password.trim()) {
        Alert.alert("Error", "Please enter both email and password.");
        return;
      }
      if (email === "admin@gmail.com" && password === "123") {
        navigation.navigate("AdminLayout", { screen: "Dashboard" });
        return;
      }
      try {
        const userRef = ref(database, "user");
        const fetchUserQuery = query(
          userRef,
          orderByChild("email"),
          equalTo(email.trim().toLowerCase()),
        );
        const snapshot = await get(fetchUserQuery);

        if (snapshot.exists()) {
          const userData = Object.values(snapshot.val())[0];
          if (userData.password === password) {
            setEmailGlobal(email.trim().toLowerCase());
            setRoleGlobal(userData.role || "");
            setIsLogin(true);
            setCurrentState("home");
          } else {
            Alert.alert("Error", "Invalid password.");
          }
        } else {
          Alert.alert("Error", "User not found.");
        }
      } catch (error) {
        console.error("Login error:", error);
        Alert.alert(
          "Error",
          "An error occurred during login. Please try again.",
        );
      }
    };

    return (
      <View style={loginStyle.container}>
        <Text style={loginStyle.title}>Welcome Back</Text>
        <Text style={loginStyle.subtitle}>Log in to your account</Text>

        <TextInput
          style={loginStyle.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={loginStyle.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={loginStyle.button} onPress={handleLogin}>
          <Text style={loginStyle.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={loginStyle.button}
          onPress={() => {
            setCurrentState("home");
          }}
        >
          <Text style={loginStyle.buttonText}>Back</Text>
        </TouchableOpacity>

        <Text style={loginStyle.footerText}>
          Don't have an account?{" "}
          <Text
            style={loginStyle.linkText}
            onPress={() => {
              setCurrentState("signup");
            }}
          >
            Sign up here
          </Text>
        </Text>
      </View>
    );
  };

  const loginStyle = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f9f9f9",
      paddingHorizontal: 20,
    },
    logout: {
      color: "red",
      float: "right",
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: "#666",
      marginBottom: 30,
    },
    input: {
      width: "100%",
      height: 50,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 8,
      paddingHorizontal: 15,
      backgroundColor: "#fff",
      marginBottom: 15,
      fontSize: 16,
      color: "#333",
    },
    button: {
      width: "100%",
      height: 50,
      backgroundColor: "#4CAF50",
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    buttonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
    },
    footerText: {
      fontSize: 14,
      color: "#666",
    },
    linkText: {
      color: "#4CAF50",
      fontWeight: "bold",
    },
    backButton: {
      width: "33%",
      height: 50,
      backgroundColor: "#4CAF50",
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
  });

  if (currentState === "home") return <HomeScreen />;
  else if ((currentState === "home" || currentState === "register") && isLogin)
    return <RegisterTournaments tid={tournamentId} />;
  else if (currentState === "login") return <LoginPage />;
  else if (currentState === "signup") return <SignUpPage />;
};
export default IndexScreen;

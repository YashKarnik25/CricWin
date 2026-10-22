import React, { useEffect, useRef, useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Linking,
  TouchableOpacity,
  Animated,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ref,
  push,
  query,
  orderByChild,
  equalTo,
  get,
  set,
} from "firebase/database";
import { database } from "../lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useNavigation } from "expo-router/react-navigation";
import { Picker } from "@react-native-picker/picker";
import { UserContext } from "./_layout";

const menuItems = [
  {
    id: "0",
    title: "Login / Account",
    description: "Sign in or manage your account",
  },
  { id: "1", title: "Team Register", description: "Register a new team" },
  { id: "2", title: "About Us", description: "Learn more about us..." },
  {
    id: "3",
    title: "Terms & Conditions",
    description: "Please read this carefully",
  },
  {
    id: "4",
    title: "Become a Sponsor",
    description: "Support us by becoming a sponsor",
  },
  {
    id: "5",
    title: "Contact Us",
    description: "Send us your feedback or queries",
  },
];

const AnimatedCard = ({ index, onPress, children }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateY, index]);

  return (
    <Animated.View
      style={[styles.card, { opacity: fadeAnim, transform: [{ translateY }] }]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const TeamRegistrationForm = ({
  navigation,
  teamName,
  setTeamName,
  teamEmail,
  setTeamEmail,
  contact,
  setContact,
  players,
  setPlayers,
  handleSubmit,
}) => {
  const handlePlayerChange = (text, index, field) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: text };
    setPlayers(newPlayers);
  };

  return (
    <ScrollView style={styles.containerTeam}>
      <Text style={styles.title}>Team Registration</Text>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Team Information</Text>
        <TextInput
          style={styles.input}
          value={teamName}
          onChangeText={setTeamName}
          placeholder="Team Name"
          placeholderTextColor="#94a3b8"
        />
        <TextInput
          style={styles.input}
          value={teamEmail}
          onChangeText={setTeamEmail}
          placeholder="Team Email"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          value={contact}
          onChangeText={setContact}
          placeholder="Contact Number"
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Player Details</Text>
        {players.map((player, index) => (
          <View key={index} style={styles.playerContainer}>
            <Text style={styles.playerNumber}>Player {index + 1}</Text>
            <TextInput
              style={styles.playerInput}
              value={player.name}
              onChangeText={(text) => handlePlayerChange(text, index, "name")}
              placeholder={`Player ${index + 1} Name`}
              placeholderTextColor="#94a3b8"
            />
            <TextInput
              style={styles.playerInput}
              value={player.email}
              onChangeText={(text) => handlePlayerChange(text, index, "email")}
              placeholder={`Player ${index + 1} Email`}
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
            />
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Registration</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const MoreScreen = () => {
  const [selectedScreen, setSelectedScreen] = useState("menu");
  const navigation = useNavigation();
  const { emailGlobal, setEmailGlobal, setRoleGlobal } = useContext(UserContext);

  // Authentication States
  const [authView, setAuthView] = useState("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupForm, setSignupForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    contact: "",
    role: "player",
    password: "",
    confirmPassword: "",
  });

  const handlePress = (item) => {
    setSelectedScreen(item.title);
  };

  const goBack = () => {
    setSelectedScreen("menu");
  };

  useEffect(() => {
    if (selectedScreen !== "menu") {
      const backAction = () => {
        setSelectedScreen("menu");
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction,
      );

      return () => backHandler.remove();
    }
  }, [selectedScreen]);

  const [name, setName] = useState("");
  const [sponsorEmail, setSponsorEmail] = useState("");
  const [mode, setMode] = useState("digital");
  const [duration, setDuration] = useState("15 days");
  const [amount, setAmount] = useState(0);

  const [sponsors, setSponsors] = useState([]);
  const [showSponsorList, setShowSponsorList] = useState(false);
  const [sortBy, setSortBy] = useState("latest");
  const [isLoading, setIsLoading] = useState(false);

  const durationMapping = {
    "15 days": 15,
    "1 month": 30,
    "3 month": 90,
  };

  useEffect(() => {
    const days = durationMapping[duration];
    if (mode === "digital") {
      setAmount(days * 100);
    } else if (mode === "physical") {
      setAmount(days * 125);
    }
  }, [mode, duration]);

  const fetchSponsors = async () => {
    setIsLoading(true);
    try {
      const sponsorsRef = ref(database, "sponsor");
      const snapshot = await get(sponsorsRef);

      if (snapshot.exists()) {
        const sponsorData = [];
        snapshot.forEach((childSnapshot) => {
          sponsorData.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
            timestamp: childSnapshot.val().timestamp || Date.now(),
          });
        });
        setSponsors(sponsorData);
      } else {
        setSponsors([]);
      }
    } catch (error) {
      console.error("Error fetching sponsors:", error);
      Alert.alert("Error", "Failed to load sponsor data");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSponsorList = () => {
    if (!showSponsorList) {
      fetchSponsors();
    }
    setShowSponsorList(!showSponsorList);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Information", "Please enter your name");
      return;
    }

    if (!sponsorEmail.trim()) {
      Alert.alert("Missing Information", "Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sponsorEmail.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    try {
      const sponsorsRef = ref(database, "sponsor");
      const newSponsorRef = push(sponsorsRef);
      await set(newSponsorRef, {
        name,
        email: sponsorEmail.trim().toLowerCase(),
        mode,
        duration,
        amount,
        timestamp: Date.now(),
      });
      if (mode === "digital") {
        const phoneNumber = 919023149599;
        const sponsorId = newSponsorRef.key;
        const message = encodeURIComponent(
          `🏏 *CRICKWIN SPONSORSHIP REQUEST* 🏏\n\n` +
            `*Sponsor ID:* ${sponsorId}\n` +
            `*Name:* ${name}\n` +
            `*Email:* ${sponsorEmail.trim().toLowerCase()}\n` +
            `*Mode:* ${mode}\n` +
            `*Duration:* ${duration}\n` +
            `*Amount:* ₹${amount}\n\n` +
            `Hello, I would like to sponsor CrickWin as a digital sponsor. Please find my details above. I will be sending my advertisement content shortly.`,
        );

        let url = `whatsapp://send?phone=${phoneNumber}&text=${message}`;
        Linking.canOpenURL(url)
          .then((supported) => {
            if (!supported) {
              Alert.alert(
                "WhatsApp not installed",
                "Please install WhatsApp to use this feature",
              );
            } else {
              return Linking.openURL(url);
            }
          })
          .catch((err) => console.error("Error opening WhatsApp:", err));
      } else {
        Alert.alert(
          "Form Submitted",
          `Name: ${name}\nEmail: ${sponsorEmail.trim().toLowerCase()}\nMode: ${mode}\nDuration: ${duration}\nAmount: ₹${amount}`,
        );
      }
    } catch (e) {
      console.error("Error adding record: ", e);
      Alert.alert("Error", "Error adding record: " + e.message);
    }
  };

  const RadioButton = ({ label, selected, onPress }) => {
    return (
      <TouchableOpacity style={styles.radioButtonContainer} onPress={onPress}>
        <View
          style={[styles.radioButton, selected && styles.radioButtonSelected]}
        >
          {selected && <View style={styles.radioButtonInner} />}
        </View>
        <Text style={styles.radioLabel}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState(
    Array.from({ length: 11 }, () => ({ name: "", email: "" })),
  );
  const [teamEmail, setTeamEmail] = useState("");
  const [contact, setContact] = useState("");

  const handleSubmitTeam = async () => {
    const normalizedEmails = players.map((player) =>
      player.email.trim().toLowerCase(),
    );
    const emailCounts = normalizedEmails.reduce((counts, playerEmail) => {
      if (playerEmail) counts[playerEmail] = (counts[playerEmail] || 0) + 1;
      return counts;
    }, {});
    const duplicateEmails = Object.keys(emailCounts).filter(
      (playerEmail) => emailCounts[playerEmail] > 1,
    );
    if (duplicateEmails.length > 0) {
      Alert.alert(
        "Duplicate Player Emails",
        `Each player must have a unique email. Duplicates: ${duplicateEmails.join(", ")}`,
      );
      return;
    }
    const normalizedTeamName = teamName.trim();
    const normalizedTeamEmail = teamEmail.trim().toLowerCase();
    if (
      !normalizedTeamName ||
      players.some((player, index) => !player.name.trim() || !normalizedEmails[index]) ||
      !normalizedTeamEmail ||
      !contact.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (new Set(normalizedEmails).size !== 11) {
      Alert.alert("Error", "Exactly 11 unique player email addresses are required.");
      return;
    }

    try {
      const teamRef = ref(database, "teams");
      const teamsSnapshot = await get(teamRef);
      const teamExists =
        teamsSnapshot.exists() &&
        Object.values(teamsSnapshot.val()).some(
          (team) =>
            String(team.teamName || "").trim().toLowerCase() ===
            normalizedTeamName.toLowerCase(),
        );
      if (teamExists) {
        Alert.alert("Duplicate Team", "A team with this name is already registered.");
        return;
      }

      const emailRef = ref(database, "user");
      const results = await Promise.all(
        normalizedEmails.map((playerEmail) =>
          get(query(emailRef, orderByChild("email"), equalTo(playerEmail))),
        ),
      );
      const missingEmails = normalizedEmails.filter(
        (_, index) => !results[index].exists(),
      );
      if (missingEmails.length > 0) {
        Alert.alert(
          "Unregistered Players",
          `These player emails do not have accounts:\n${missingEmails.join(", ")}`,
        );
        return;
      }

      const playersArray = players.map((player, index) => ({
        name: player.name.trim(),
        email: normalizedEmails[index],
      }));
      await push(teamRef, {
        teamName: normalizedTeamName,
        email: normalizedTeamEmail,
        ownerEmail: emailGlobal.trim().toLowerCase(),
        contact: contact.trim(),
        playersArray,
      });
      Alert.alert("Success", "Team registration submitted successfully!");
    } catch (error) {
      console.error("Error registering team:", error);
      Alert.alert("Error", "Failed to add team. Please try again.");
    }
  };

  const handleLoginSubmit = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    if (loginEmail === "admin@gmail.com" && loginPassword === "123") {
      navigation.navigate("AdminLayout", { screen: "Dashboard" });
      return;
    }
    try {
      const userRef = ref(database, "user");
      const fetchUserQuery = query(
        userRef,
        orderByChild("email"),
        equalTo(loginEmail.trim().toLowerCase()),
      );
      const snapshot = await get(fetchUserQuery);

      if (snapshot.exists()) {
        const userData = Object.values(snapshot.val())[0];
        if (userData.password === loginPassword) {
          setEmailGlobal(loginEmail.trim().toLowerCase());
          setRoleGlobal(userData.role || "");
          Alert.alert("Success", "Logged in successfully!");
          setSelectedScreen("menu");
        } else {
          Alert.alert("Error", "Invalid password.");
        }
      } else {
        Alert.alert("Error", "User not found.");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "An error occurred during login. Please try again.");
    }
  };

  const handleSignupSubmit = async () => {
    const {
      firstname,
      lastname,
      email,
      contact,
      role,
      password,
      confirmPassword,
    } = signupForm;

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
      const playerName = `${firstname.trim()} ${lastname.trim()}`;
      await set(ref(database, `playerStats/${playerName}`), initialStats);
      Alert.alert("Success", "Account created successfully!");
      setAuthView("login");
    } catch (error) {
      console.error("Error adding User:", error);
      Alert.alert("Error", "Failed to create account. Please try again.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {selectedScreen === "menu" ? (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>More Options</Text>
          {menuItems.map((item, index) => (
            <AnimatedCard
              key={item.id}
              index={index}
              onPress={() => handlePress(item)}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="arrow-forward" size={24} color="#4CAF50" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDescription}>{item.description}</Text>
                </View>
              </View>
            </AnimatedCard>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.contactContainer}>
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* LOGIN / ACCOUNT SECTION */}
            {selectedScreen === "Login / Account" && (
              <View style={loginStyle.container}>
                <Text
                  style={[styles.contactHeader, styles.headerSpacing]}
                ></Text>
                {emailGlobal ? (
                  <View
                    style={{
                      width: "100%",
                      alignItems: "center",
                      marginTop: 20,
                    }}
                  >
                    <Ionicons
                      name="person-circle-outline"
                      size={120}
                      color="#4CAF50"
                    />
                    <Text style={loginStyle.title}>My Account</Text>
                    <Text style={loginStyle.subtitle}>{emailGlobal}</Text>
                    <TouchableOpacity
                      style={[
                        loginStyle.button,
                        { backgroundColor: "#f44336", marginTop: 30 },
                      ]}
                      onPress={() => {
                        setEmailGlobal("");
                        setRoleGlobal("");
                        Alert.alert("Success", "Logged out successfully");
                        setSelectedScreen("menu");
                      }}
                    >
                      <Text style={loginStyle.buttonText}>Logout</Text>
                    </TouchableOpacity>
                  </View>
                ) : authView === "login" ? (
                  <View style={{ width: "100%", alignItems: "center" }}>
                    <Text style={loginStyle.title}>Welcome Back</Text>
                    <Text style={loginStyle.subtitle}>
                      Log in to your account
                    </Text>

                    <TextInput
                      style={loginStyle.input}
                      placeholder="Email"
                      placeholderTextColor="#aaa"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={loginEmail}
                      onChangeText={setLoginEmail}
                    />

                    <TextInput
                      style={loginStyle.input}
                      placeholder="Password"
                      placeholderTextColor="#aaa"
                      secureTextEntry
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                    />

                    <TouchableOpacity
                      style={loginStyle.button}
                      onPress={handleLoginSubmit}
                    >
                      <Text style={loginStyle.buttonText}>Login</Text>
                    </TouchableOpacity>

                    <Text style={loginStyle.footerText}>
                      Don't have an account?{" "}
                      <Text
                        style={loginStyle.linkText}
                        onPress={() => setAuthView("signup")}
                      >
                        Sign up here
                      </Text>
                    </Text>
                  </View>
                ) : (
                  <View style={{ width: "100%", alignItems: "center" }}>
                    <Text style={loginStyle.title}>Create Account</Text>
                    <Text style={loginStyle.subtitle}>
                      Sign up to get started
                    </Text>

                    <TextInput
                      style={loginStyle.input}
                      placeholder="First Name"
                      placeholderTextColor="#aaa"
                      value={signupForm.firstname}
                      onChangeText={(v) =>
                        setSignupForm({ ...signupForm, firstname: v })
                      }
                    />
                    <TextInput
                      style={loginStyle.input}
                      placeholder="Last Name"
                      placeholderTextColor="#aaa"
                      value={signupForm.lastname}
                      onChangeText={(v) =>
                        setSignupForm({ ...signupForm, lastname: v })
                      }
                    />
                    <TextInput
                      style={loginStyle.input}
                      placeholder="Email"
                      placeholderTextColor="#aaa"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={signupForm.email}
                      onChangeText={(v) =>
                        setSignupForm({ ...signupForm, email: v })
                      }
                    />
                    <TextInput
                      style={loginStyle.input}
                      placeholder="Contact"
                      placeholderTextColor="#aaa"
                      keyboardType="phone-pad"
                      value={signupForm.contact}
                      onChangeText={(v) =>
                        setSignupForm({ ...signupForm, contact: v })
                      }
                    />

                    <View style={loginStyle.dropdownContainer}>
                      <Picker
                        selectedValue={signupForm.role}
                        style={loginStyle.dropdown}
                        onValueChange={(v) =>
                          setSignupForm({ ...signupForm, role: v })
                        }
                      >
                        <Picker.Item label="Choose Role" value=" " />
                        <Picker.Item label="Player" value="player" />
                        <Picker.Item label="Manager" value="owner" />
                        <Picker.Item label="Other" value="other" />
                      </Picker>
                    </View>

                    <TextInput
                      style={loginStyle.input}
                      placeholder="Password"
                      placeholderTextColor="#aaa"
                      secureTextEntry
                      value={signupForm.password}
                      onChangeText={(v) =>
                        setSignupForm({ ...signupForm, password: v })
                      }
                    />
                    <TextInput
                      style={loginStyle.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="#aaa"
                      secureTextEntry
                      value={signupForm.confirmPassword}
                      onChangeText={(v) =>
                        setSignupForm({ ...signupForm, confirmPassword: v })
                      }
                    />

                    <TouchableOpacity
                      style={loginStyle.button}
                      onPress={handleSignupSubmit}
                    >
                      <Text style={loginStyle.buttonText}>Sign Up</Text>
                    </TouchableOpacity>

                    <Text style={loginStyle.footerText}>
                      Already have an account?{" "}
                      <Text
                        style={loginStyle.linkText}
                        onPress={() => setAuthView("login")}
                      >
                        Log in here
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
            )}

            {selectedScreen === "About Us" && (
              <View style={styles.aboutContainer}>
                <LinearGradient
                  colors={["#00695c", "#00796b", "#00897b"]}
                  style={styles.aboutHeaderGradient}
                >
                  <Text style={styles.aboutHeaderText}>About Us</Text>
                </LinearGradient>

                <View style={styles.aboutSection}>
                  <View style={styles.aboutTitleContainer}>
                    <Ionicons
                      name="information-circle-outline"
                      size={24}
                      color="#00796b"
                    />
                    <Text style={styles.aboutSectionTitle}>Who We Are</Text>
                  </View>
                  <Text style={styles.aboutText}>
                    Welcome to CrickWin Tournament Management & Live Score App!
                    🏏 We provide an all-in-one platform for cricket enthusiasts
                    to store match scores, manage tournaments, and analyze
                    player performances.
                  </Text>
                </View>

                <View style={styles.aboutSection}>
                  <View style={styles.aboutTitleContainer}>
                    <Ionicons name="list-outline" size={24} color="#00796b" />
                    <Text style={styles.aboutSectionTitle}>Our Features</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons
                      name="refresh-circle-outline"
                      size={20}
                      color="#00796b"
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureText}>
                      Match Updates with real-time score tracking
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons
                      name="trophy-outline"
                      size={20}
                      color="#00796b"
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureText}>
                      Tournament Management for scheduling, registration, and
                      fixtures
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons
                      name="stats-chart-outline"
                      size={20}
                      color="#00796b"
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureText}>
                      Detailed Player Stats with batting and bowling analysis
                    </Text>
                  </View>
                </View>

                <View style={styles.aboutMissionSection}>
                  <View style={styles.aboutTitleContainer}>
                    <Ionicons name="flag-outline" size={24} color="#00796b" />
                    <Text style={styles.aboutSectionTitle}>Our Mission</Text>
                  </View>
                  <Text style={styles.missionText}>
                    "We aim to bring cricket fans closer to the game with
                    cutting-edge technology and intuitive designs."
                  </Text>
                  <View style={styles.missionImageContainer}>
                    <Ionicons
                      name="cricket-outline"
                      size={60}
                      color="#b2dfdb"
                    />
                  </View>
                </View>
              </View>
            )}
            {selectedScreen === "Team Register" && (
              <>
                <Text
                  style={[styles.contactHeader, styles.headerSpacing]}
                ></Text>

                <TeamRegistrationForm
                  teamName={teamName}
                  setTeamName={setTeamName}
                  teamEmail={teamEmail}
                  setTeamEmail={setTeamEmail}
                  contact={contact}
                  setContact={setContact}
                  players={players}
                  setPlayers={setPlayers}
                  handleSubmit={handleSubmitTeam}
                />
              </>
            )}

            {selectedScreen === "Terms & Conditions" && (
              <View style={styles.termsContainer}>
                <LinearGradient
                  colors={["#1a237e", "#283593", "#3949ab"]}
                  style={styles.termsHeaderGradient}
                >
                  <Text style={styles.termsHeaderText}>Terms & Conditions</Text>
                </LinearGradient>

                <View style={styles.termsSection}>
                  <View style={styles.termsTitleContainer}>
                    <Ionicons name="person-outline" size={22} color="#304ffe" />
                    <Text style={styles.termsSectionTitle}>Eligibility</Text>
                  </View>
                  <Text style={styles.termsText}>
                    All participants must meet the minimum age requirement and
                    comply with the tournament's eligibility criteria.
                    Registration is open only to individuals and teams that meet
                    these guidelines.
                  </Text>
                </View>

                <View style={styles.termsDivider} />

                <View style={styles.termsSection}>
                  <View style={styles.termsTitleContainer}>
                    <Ionicons
                      name="information-circle-outline"
                      size={22}
                      color="#304ffe"
                    />
                    <Text style={styles.termsSectionTitle}>
                      Accurate Information
                    </Text>
                  </View>
                  <Text style={styles.termsText}>
                    • All registration details provided must be accurate and
                    complete.
                  </Text>
                  <Text style={styles.termsText}>
                    • The organizers reserve the right to verify the submitted
                    information and cancel registrations found to be fraudulent.
                  </Text>
                </View>

                <View style={styles.termsDivider} />

                <View style={styles.termsSection}>
                  <View style={styles.termsTitleContainer}>
                    <Ionicons name="cash-outline" size={22} color="#304ffe" />
                    <Text style={styles.termsSectionTitle}>
                      Registration and Entry Fees
                    </Text>
                  </View>
                  <Text style={styles.termsText}>
                    All fees paid during registration are non-refundable unless
                    otherwise specified in the tournament's refund policy.
                    Participants are responsible for ensuring payment is made on
                    time.
                  </Text>
                </View>

                <View style={styles.termsDivider} />

                <View style={styles.termsSection}>
                  <View style={styles.termsTitleContainer}>
                    <Ionicons
                      name="close-circle-outline"
                      size={22}
                      color="#304ffe"
                    />
                    <Text style={styles.termsSectionTitle}>
                      Cancellation and Refund Policy
                    </Text>
                  </View>
                  <Text style={styles.termsText}>
                    Cancellations must be submitted in writing. Refund
                    eligibility will be determined based on the tournament's
                    cancellation policy, and no refunds will be issued after the
                    tournament has commenced.
                  </Text>
                </View>

                <View style={styles.termsDivider} />

                <View style={styles.termsSection}>
                  <View style={styles.termsTitleContainer}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={22}
                      color="#304ffe"
                    />
                    <Text style={styles.termsSectionTitle}>
                      Code of Conduct
                    </Text>
                  </View>
                  <Text style={styles.termsText}>
                    Participants must conduct themselves in a sportsmanlike
                    manner and abide by the tournament rules. Any form of
                    misconduct, abuse, or unsportsmanlike behavior may result in
                    disqualification.
                  </Text>
                </View>

                <View style={styles.termsDivider} />

                <View style={styles.termsSection}>
                  <View style={styles.termsTitleContainer}>
                    <Ionicons name="medkit-outline" size={22} color="#304ffe" />
                    <Text style={styles.termsSectionTitle}>
                      Health and Safety
                    </Text>
                  </View>
                  <Text style={styles.termsText}>
                    Participants confirm that they are medically fit to compete.
                    The organizers are not liable for any injuries or health
                    issues that may arise during the tournament.
                  </Text>
                </View>

                <View style={styles.termsDivider} />

                <View style={styles.termsSection}>
                  <View style={styles.termsTitleContainer}>
                    <Ionicons name="shirt-outline" size={22} color="#304ffe" />
                    <Text style={styles.termsSectionTitle}>
                      Equipment and Uniform Guidelines
                    </Text>
                  </View>
                  <Text style={styles.termsText}>
                    Teams must adhere to the provided equipment and uniform
                    requirements. Any deviations must be approved by the
                    tournament officials in advance.
                  </Text>
                </View>

                <View style={styles.termsDivider} />

                <View style={styles.termsSection}>
                  <View style={styles.termsTitleContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={22}
                      color="#304ffe"
                    />
                    <Text style={styles.termsSectionTitle}>
                      Scheduling and Rule Changes
                    </Text>
                  </View>
                  <Text style={styles.termsText}>
                    The organizers reserve the right to modify match schedules,
                    tournament rules, and venues as needed. All changes will be
                    communicated to the registered participants in a timely
                    manner.
                  </Text>
                </View>

                <View style={styles.termsDivider} />

                <View style={styles.termsSection}>
                  <View style={styles.termsTitleContainer}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={22}
                      color="#304ffe"
                    />
                    <Text style={styles.termsSectionTitle}>
                      Disqualification
                    </Text>
                  </View>
                  <Text style={styles.termsText}>
                    The organizers maintain the authority to disqualify any team
                    or player found in violation of the tournament rules or
                    engaging in dishonest practices without prior notice.
                  </Text>
                </View>

                <View style={styles.termsDivider} />

                <View style={styles.termsSection}>
                  <View style={styles.termsTitleContainer}>
                    <Ionicons
                      name="document-text-outline"
                      size={22}
                      color="#304ffe"
                    />
                    <Text style={styles.termsSectionTitle}>
                      Liability Waiver
                    </Text>
                  </View>
                  <Text style={styles.termsText}>
                    By registering and participating, teams and players waive
                    any liability claims against the tournament organizers for
                    any injuries, losses, or damages incurred during the event.
                  </Text>
                </View>

                <View style={styles.termsDivider} />

                <View style={styles.termsSection}>
                  <View style={styles.termsTitleContainer}>
                    <Ionicons name="camera-outline" size={22} color="#304ffe" />
                    <Text style={styles.termsSectionTitle}>
                      Media and Publicity
                    </Text>
                  </View>
                  <Text style={styles.termsText}>
                    Participants grant the tournament organizers permission to
                    capture and use photographs, videos, and other media for
                    promotional and publicity purposes without any compensation.
                  </Text>
                </View>

                <View style={styles.termsDivider} />

                <View style={styles.termsSection}>
                  <View style={styles.termsTitleContainer}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={22}
                      color="#304ffe"
                    />
                    <Text style={styles.termsSectionTitle}>Final Decision</Text>
                  </View>
                  <Text style={styles.termsText}>
                    All decisions made by the tournament organizers regarding
                    match outcomes, disputes, scheduling, and rule enforcement
                    are final and binding.
                  </Text>
                </View>
              </View>
            )}

            {selectedScreen === "Become a Sponsor" && (
              <>
                <Text style={[styles.contactHeader, styles.headerSpacing]}>
                  Become a Sponsor
                </Text>
                <Text style={styles.contactText}>
                  Sponsoring our platform helps promote your brand among cricket
                  enthusiasts and gain visibility. By partnering with us, you
                  can reach a dedicated audience of cricket fans and players who
                  are passionate about the game.
                </Text>
                <Text style={styles.contactSubHeader}>Sponsorship</Text>

                <View style={styles.containerSp}>
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    value={sponsorEmail}
                    onChangeText={setSponsorEmail}
                    keyboardType="email-address"
                  />

                  <Text style={styles.label}>Mode</Text>
                  <View style={styles.radioGroup}>
                    <RadioButton
                      label="Digital"
                      selected={mode === "digital"}
                      onPress={() => setMode("digital")}
                    />
                    <RadioButton
                      label="Physical"
                      selected={mode === "physical"}
                      onPress={() => setMode("physical")}
                    />
                  </View>

                  <Text style={styles.label}>Duration</Text>
                  <View style={styles.radioGroup}>
                    <RadioButton
                      label="15 days"
                      selected={duration === "15 days"}
                      onPress={() => setDuration("15 days")}
                    />
                    <RadioButton
                      label="1 month"
                      selected={duration === "1 month"}
                      onPress={() => setDuration("1 month")}
                    />
                    <RadioButton
                      label="3 month"
                      selected={duration === "3 month"}
                      onPress={() => setDuration("3 month")}
                    />
                  </View>

                  <Text style={styles.label}>Amount</Text>
                  <TextInput
                    style={[styles.input, styles.readOnlyInput]}
                    value={`₹${amount}`}
                    editable={false}
                  />

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.submitButtonText}>Pay</Text>
                  </TouchableOpacity>

                  <View style={styles.noteSection}>
                    <Text style={styles.noteText}>
                      1. In physical mode the sponsor has to needs to provide
                      the physical banner to the desired location.
                    </Text>
                    <Text style={styles.noteText}>
                      2. In digital mode you will be redirected to the whatsapp
                      and need to send the respective image to the number in
                      chat.
                    </Text>
                  </View>
                </View>
              </>
            )}

            {selectedScreen === "Contact Us" && (
              <View style={styles.contactUsContainer}>
                <LinearGradient
                  colors={["#2e7d32", "#388e3c", "#43a047"]}
                  style={styles.contactHeaderGradient}
                >
                  <Text style={styles.contactHeaderText}>Contact Us</Text>
                </LinearGradient>

                <View style={styles.contactSection}>
                  <View style={styles.contactSectionHeader}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={24}
                      color="#2e7d32"
                    />
                    <Text style={styles.contactSectionTitle}>
                      Our Support Team
                    </Text>
                  </View>
                  <Text style={styles.contactParagraph}>
                    We value your feedback and inquiries! Whether you have
                    questions about our services, need support, or want to
                    discuss partnership opportunities, we are here to help.
                  </Text>

                  <View style={styles.contactInfoItem}>
                    <Ionicons
                      name="mail-outline"
                      size={22}
                      color="#2e7d32"
                      style={styles.contactInfoIcon}
                    />
                    <Text style={styles.contactInfoLabel}>Email: </Text>
                    <Text style={styles.contactInfoValue}>
                      support@crickettournamentapp.com
                    </Text>
                  </View>

                  <View style={styles.contactInfoItem}>
                    <Ionicons
                      name="call-outline"
                      size={22}
                      color="#2e7d32"
                      style={styles.contactInfoIcon}
                    />
                    <Text style={styles.contactInfoLabel}>Phone: </Text>
                    <Text style={styles.contactInfoValue}>+91 98765 43210</Text>
                  </View>
                </View>

                <View style={styles.contactSection}>
                  <View style={styles.contactSectionHeader}>
                    <Ionicons
                      name="share-social-outline"
                      size={24}
                      color="#2e7d32"
                    />
                    <Text style={styles.contactSectionTitle}>Follow Us</Text>
                  </View>
                  <Text style={styles.contactParagraph}>
                    Stay updated with the latest news and events by following us
                    on our social media channels:
                  </Text>

                  <View style={styles.socialMediaContainer}>
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => {
                        Linking.canOpenURL("fb://profile/Yash Karnik")
                          .then((supported) => {
                            if (supported) {
                              return Linking.openURL(
                                "fb://profile/Yash Karnik",
                              );
                            } else {
                              return Linking.openURL(
                                "https://www.facebook.com/Yash Karnik",
                              );
                            }
                          })
                          .catch((err) =>
                            console.error("Error opening Facebook:", err),
                          );
                      }}
                    >
                      <Ionicons
                        name="logo-facebook"
                        size={28}
                        color="#ffffff"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.socialButton, styles.socialTwitter]}
                      onPress={() => {
                        Linking.canOpenURL(
                          "twitter://user?screen_name=crickwin",
                        )
                          .then((supported) => {
                            if (supported) {
                              return Linking.openURL(
                                "twitter://user?screen_name=YASHKARNIK25",
                              );
                            } else {
                              return Linking.openURL(
                                "https://twitter.com/YASHKARNIK25",
                              );
                            }
                          })
                          .catch((err) =>
                            console.error("Error opening Twitter:", err),
                          );
                      }}
                    >
                      <Ionicons name="logo-twitter" size={28} color="#ffffff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.socialButton, styles.socialInstagram]}
                      onPress={() => {
                        Linking.canOpenURL("instagram://user?username=crickwin")
                          .then((supported) => {
                            if (supported) {
                              return Linking.openURL(
                                "instagram://user?username=hardik_29_._",
                              );
                            } else {
                              return Linking.openURL(
                                "https://www.instagram.com/hardik_29_._",
                              );
                            }
                          })
                          .catch((err) =>
                            console.error("Error opening Instagram:", err),
                          );
                      }}
                    >
                      <Ionicons
                        name="logo-instagram"
                        size={28}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const loginStyle = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    paddingBottom: 20,
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

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#e0f7fa",
    flexGrow: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#00796B",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  iconContainer: {
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#00796B",
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: "#555",
  },
  contactContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 0,
  },
  scrollContainer: {
    flex: 1,
    padding: 10,
  },
  contactSubHeader: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#555555",
    marginTop: 20,
    marginBottom: 5,
    textAlign: "center",
  },
  contactHeader: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 50,
    textAlign: "center",
  },
  contactText: {
    fontSize: 16,
    color: "#333",
    textAlign: "justify",
    marginBottom: 10,
    marginHorizontal: 20,
    lineHeight: 24,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#004D40",
    padding: 10,
    borderRadius: 10,
  },
  backText: {
    color: "#FFF",
    fontSize: 16,
    marginLeft: 5,
  },
  contactEmail: {
    color: "green",
    fontWeight: "bold",
  },
  contactPhone: {
    color: "green",
    fontWeight: "bold",
  },
  contactLink: {
    color: "#4CAF50",
    textDecorationLine: "underline",
  },
  containerSp: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    color: "#2c3e50",
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.84,
    elevation: 2,
  },
  readOnlyInput: {
    backgroundColor: "#f0f0f0",
  },
  label: {
    fontSize: 18,
    color: "#555",
    marginBottom: 10,
    fontWeight: "600",
  },
  radioGroup: {
    flexDirection: "row",
    marginBottom: 20,
  },
  radioButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 25,
  },
  radioButton: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioButtonSelected: {
    borderColor: "#90EE90",
  },
  radioButtonInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: "#90EE90",
  },
  radioLabel: {
    fontSize: 16,
    color: "#333",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5.84,
    elevation: 5,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  noteSection: {
    marginTop: 30,
  },
  noteText: {
    fontSize: 12,
    color: "#999",
    lineHeight: 18,
    marginBottom: 5,
  },
  containerTeam: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f4f8",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
    color: "#1a365d",
    marginTop: 20,
    letterSpacing: 0.5,
  },
  formSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#1a365d",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c5282",
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#4299e1",
    paddingLeft: 10,
  },
  playerContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  playerNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4299e1",
    marginBottom: 10,
  },
  playerInput: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2d3748",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  text: {
    fontSize: 18,
    marginBottom: 15,
    color: "#2c5282",
    fontWeight: "600",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#4299e1",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 25,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  termsContainer: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    paddingBottom: 20,
  },
  termsHeaderGradient: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 15,
    elevation: 4,
  },
  termsHeaderText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginTop: 20,
  },
  termsSection: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    elevation: 2,
  },
  termsTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  termsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#304ffe",
    marginLeft: 8,
  },
  termsText: {
    fontSize: 15,
    color: "#424242",
    lineHeight: 22,
    marginVertical: 4,
    fontFamily: "System",
  },
  termsDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 40,
    marginVertical: 5,
  },
  headerSpacing: {
    marginTop: 20,
  },
  aboutContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingBottom: 20,
  },
  aboutHeaderGradient: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 15,
    marginTop: 10,
    elevation: 4,
  },
  aboutHeaderText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  aboutSection: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 18,
    marginHorizontal: 15,
    marginVertical: 8,
    elevation: 2,
  },
  aboutTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  aboutSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#00796b",
    marginLeft: 10,
  },
  aboutText: {
    fontSize: 16,
    color: "#424242",
    lineHeight: 24,
    marginVertical: 4,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 8,
    flexWrap: "nowrap",
  },
  featureIcon: {
    marginRight: 10,
    marginTop: 2,
    flexShrink: 0,
  },
  featureText: {
    fontSize: 16,
    color: "#424242",
    lineHeight: 24,
    marginVertical: 4,
    flex: 1,
    flexWrap: "wrap",
  },
  aboutMissionSection: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 18,
    marginHorizontal: 15,
    marginVertical: 8,
    elevation: 2,
    alignItems: "center",
  },
  missionText: {
    fontSize: 18,
    color: "#00796b",
    lineHeight: 26,
    textAlign: "center",
    fontStyle: "italic",
    marginVertical: 10,
    fontWeight: "500",
  },
  missionImageContainer: {
    alignItems: "center",
    marginTop: 15,
  },
  contactUsContainer: {
    flex: 1,
    backgroundColor: "#f9fbe7",
    paddingBottom: 20,
  },
  contactHeaderGradient: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 15,
    marginTop: 10,
    elevation: 4,
  },
  contactHeaderText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  contactSection: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 18,
    marginHorizontal: 15,
    marginVertical: 8,
    elevation: 2,
  },
  contactSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contactSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2e7d32",
    marginLeft: 10,
  },
  contactParagraph: {
    fontSize: 16,
    color: "#424242",
    lineHeight: 24,
    marginBottom: 15,
  },
  contactInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    flexWrap: "wrap",
  },
  contactInfoIcon: {
    marginRight: 10,
  },
  contactInfoLabel: {
    fontSize: 16,
    color: "#424242",
    fontWeight: "600",
  },
  contactInfoValue: {
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "500",
  },
  socialMediaContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 5,
  },
  socialButton: {
    backgroundColor: "#4267B2",
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    borderRadius: 25,
    elevation: 3,
    marginHorizontal: 12,
  },
  socialTwitter: {
    backgroundColor: "#1DA1F2",
  },
  socialInstagram: {
    backgroundColor: "#C13584",
  },
});

export default MoreScreen;

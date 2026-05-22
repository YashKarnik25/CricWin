import React, { useEffect, useState, useRef, useContext } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { ref, onValue } from "firebase/database";
import { database } from "./firebase";
import { useNavigation } from "@react-navigation/native";
import { UserContext } from "./_layout";

const { width, height } = Dimensions.get("window");

// Enhanced Image Slider Component with pagination dots and smooth transitions
const ImageSlider = ({ images, interval = 3000 }) => {
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sliderTimer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: width * nextIndex, animated: true });
    }, interval);
    return () => clearInterval(sliderTimer);
  }, [currentIndex, images.length, interval]);

  const renderDots = () => {
    return images.map((_, index) => {
      const inputRange = [
        (index - 1) * width,
        index * width,
        (index + 1) * width,
      ];
      const dotWidth = scrollX.interpolate({
        inputRange,
        outputRange: [8, 16, 8],
        extrapolate: "clamp",
      });
      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.3, 1, 0.3],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              width: dotWidth,
              opacity,
            },
          ]}
        />
      );
    });
  };

  return (
    <View style={styles.sliderContainer}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        ref={scrollViewRef}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {images.map((imageSource, index) => (
          <View key={index} style={styles.sliderItem}>
            <Image
              source={imageSource}
              style={styles.sliderImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.gradient}
            >
              <Text style={styles.adLabel}>Featured Ad</Text>
            </LinearGradient>
          </View>
        ))}
      </Animated.ScrollView>
      <View style={styles.pagination}>{renderDots()}</View>
    </View>
  );
};

// User Profile Header Component
const UserProfileHeader = ({ username = "Cricketer" }) => {
  return (
    <View style={styles.profileHeader}>
      <LinearGradient
        colors={["#2E7D32", "#4CAF50", "#81C784"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileBackground}
      >
        <View style={styles.profileContent}>
          <View style={styles.profileAvatar}>
            <LinearGradient
              colors={["#81C784", "#4CAF50"]}
              style={styles.avatarGradient}
            >
              <Text style={styles.profileInitial}>
                {username && username.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.profileName}>{username}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

// Quick Actions Component
const QuickActions = () => {
  const navigation = useNavigation();

  const actions = [
    {
      id: 1,
      title: "Join Tournament",
      icon: "trophy-outline",
      color: "#4285F4",
      onPress: () => navigation.navigate("Tournaments"),
    },
    {
      id: 2,
      title: "Your Matches",
      icon: "calendar-outline",
      color: "#FBBC05",
      onPress: () => navigation.navigate("History"),
    },
    {
      id: 3,
      title: "Statistics",
      icon: "stats-chart-outline",
      color: "#34A853",
      onPress: () => navigation.navigate("Profile", { initialTab: "stats" }),
    },
  ];

  return (
    <View style={styles.quickActionsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionItem}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View
              style={[styles.actionIcon, { backgroundColor: action.color }]}
            >
              <Ionicons name={action.icon} size={24} color="white" />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Upcoming Tournament Card Component
const TournamentCard = ({ item }) => {
  const navigation = useNavigation();
  const { emailGlobal } = useContext(UserContext);

  const handleRegisterPress = () => {
    if (!emailGlobal) {
      // If user is not logged in, show alert and redirect to login
      Alert.alert(
        "Login Required",
        "You need to login before registering for a tournament",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Login",
            onPress: () => navigation.navigate("Tournaments"),
          },
        ]
      );
    } else {
      // Navigate to register tournament page with tournament id
      navigation.navigate("Tournaments", {
        screen: "register",
        params: {
          tournamentId: item.id,
          tournamentName: item.name,
        },
      });
    }
  };

  return (
    <BlurView intensity={80} tint="light" style={styles.tournamentCard}>
      <LinearGradient
        colors={["#A7D129", "#4CAF50"]}
        style={styles.tournamentBadge}
      >
        <Text style={styles.tournamentDate}>
          {new Date().toLocaleDateString()}
        </Text>
      </LinearGradient>
      <View style={styles.tournamentContent}>
        <Text style={styles.tournamentName}>{item.name}</Text>
        <View style={styles.tournamentDetails}>
          <View style={styles.tournamentDetailItem}>
            <Ionicons name="cash-outline" size={16} color="#4CAF50" />
            <Text style={styles.tournamentDetailText}>₹{item.prizePool}</Text>
          </View>
          <View style={styles.tournamentDetailItem}>
            <Ionicons name="location-outline" size={16} color="#4CAF50" />
            <Text style={styles.tournamentDetailText}>{item.location}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegisterPress}
          activeOpacity={0.8}
        >
          <Text style={styles.registerButtonText}>Register Now</Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  );
};

// Enhanced News Card Component
const NewsCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
    <Image source={{ uri: item.urlToImage }} style={styles.image} />
    <BlurView intensity={80} tint="light" style={styles.cardContent}>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.description} numberOfLines={3}>
        {item.description}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.source}>{item.source.name}</Text>
        <Text style={styles.date}>
          {new Date(item.publishedAt).toLocaleDateString()}
        </Text>
      </View>
    </BlurView>
  </TouchableOpacity>
);

const Home = () => {
  const navigation = useNavigation();
  const { emailGlobal } = useContext(UserContext);
  const [articles, setArticles] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("Cricketer");

  const sliderImages = [
    require("../assets/images/ad1.png"),
    require("../assets/images/ad2.png"),
  ];

  const fetchNews = async () => {
    try {
      const response = await fetch(
        "https://newsapi.org/v2/everything?q=cricket&sortBy=publishedAt&apiKey=20f109bb98d642aba213bef1b2549eec"
      );
      const jsonData = await response.json();
      const topEightArticles = jsonData.articles.slice(0, 6);
      setArticles(topEightArticles);
    } catch (error) {
      console.error("Error fetching news:", error);
    }
  };

  const fetchTournaments = () => {
    const tournamentsRef = ref(database, "tournaments");
    onValue(tournamentsRef, (snapshot) => {
      const snapData = snapshot.val();
      if (snapData) {
        const tournamentsArray = Object.keys(snapData)
          .map((key) => ({
            id: key,
            ...snapData[key],
          }))
          .slice(0, 3); // Only take the first 3 tournaments
        setTournaments(tournamentsArray);
      }
      setLoading(false);
    });
  };

  const fetchUserInfo = async () => {
    if (emailGlobal) {
      try {
        const userEmail = emailGlobal.replace(/\./g, ",");
        const userRef = ref(database, `user/${userEmail}`);

        onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            console.log("User data found:", userData);
            if (userData.name) {
              setUsername(userData.name);
            } else if (userData.firstname && userData.lastname) {
              setUsername(`${userData.firstname} ${userData.lastname}`);
            } else if (userData.firstName && userData.lastName) {
              setUsername(`${userData.firstName} ${userData.lastName}`);
            } else if (userData.playerName) {
              setUsername(userData.playerName);
            }
          } else {
            const allUsersRef = ref(database, "user");
            onValue(allUsersRef, (snapshot) => {
              const allUsers = snapshot.val();
              if (allUsers) {
                const userFound = Object.values(allUsers).find(
                  (user) => user.email === emailGlobal
                );

                if (userFound) {
                  console.log("User found by email query:", userFound);
                  if (userFound.name) {
                    setUsername(userFound.name);
                  } else if (userFound.firstname && userFound.lastname) {
                    setUsername(`${userFound.firstname} ${userFound.lastname}`);
                  } else if (userFound.firstName && userFound.lastName) {
                    setUsername(`${userFound.firstName} ${userFound.lastName}`);
                  } else if (userFound.playerName) {
                    setUsername(userFound.playerName);
                  }
                }
              }
            });
          }
        });
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    }
  };

  useEffect(() => {
    fetchNews();
    fetchTournaments();
    fetchUserInfo();
  }, [emailGlobal]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <UserProfileHeader username={username} />
        <QuickActions />
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Sponsors</Text>
          </View>
          <ImageSlider images={sliderImages} />
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Tournaments</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Tournaments")}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {tournaments.length > 0 ? (
            <FlatList
              data={tournaments}
              renderItem={({ item }) => <TournamentCard item={item} />}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tournamentList}
              ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No upcoming tournaments</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Cricket News</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {articles.length > 0 ? (
            articles.map((item, index) => (
              <NewsCard
                key={index}
                item={item}
                onPress={() => Linking.openURL(item.url)}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No news available</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  profileHeader: {
    width: "100%",
    height: 130,
  },
  profileBackground: {
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  avatarGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  quickActionsContainer: {
    padding: 15,
    marginTop: 10,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionItem: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  sectionContainer: {
    padding: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  seeAll: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "600",
  },
  sliderContainer: {
    height: 180,
    marginBottom: 10,
    borderRadius: 15,
    overflow: "hidden",
  },
  sliderItem: {
    position: "relative",
    width: width - 30,
    height: 180,
    borderRadius: 15,
    overflow: "hidden",
  },
  sliderImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    justifyContent: "flex-end",
    padding: 15,
  },
  adLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginHorizontal: 4,
  },
  tournamentList: {
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 20,
  },
  tournamentCard: {
    width: 280,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  tournamentBadge: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  tournamentDate: {
    color: "white",
    fontWeight: "bold",
  },
  tournamentContent: {
    padding: 15,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  tournamentDetails: {
    marginBottom: 15,
  },
  tournamentDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  tournamentDetailText: {
    marginLeft: 10,
    color: "#666",
  },
  registerButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  registerButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  card: {
    height: 320,
    borderRadius: 15,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: "white",
  },
  image: {
    width: "100%",
    height: 180,
  },
  cardContent: {
    padding: 15,
    backgroundColor: "white",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  description: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  source: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default Home;

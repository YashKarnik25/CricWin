import React, { createContext, useState, ReactNode } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./index";
import AddTournament from "./addTournament";
import RegisterTournaments from "./registerTournaments";
import TeamRegistrationForm from "./registerTeam";
import AdminHome from "./ListOfTeams";
import Profile from "./Profile";
import History from "./History";
import Home from "./Home";
import MoreSreen from "./More";
import Sponsor from "./addSponsor";
import AdminDashboard from "./adminDashboard";
import ManageTeams from "./admin/manageTeams";
import ManagePlayers from "./admin/managePlayers";
import ManageSponsors from "./admin/manageSponsors";

interface UserContextType {
  emailGlobal: string;
  setEmailGlobal: (email: string) => void;
}

interface UserContext2Type {
  isUserLogin: boolean;
  setIsLogin: (isLogin: boolean) => void;
}

export const UserContext = createContext<UserContextType>({
  emailGlobal: "",
  setEmailGlobal: () => {},
});

export const UserContext2 = createContext<UserContext2Type>({
  isUserLogin: false,
  setIsLogin: () => {},
});

const UserProvider = ({ children }: { children: ReactNode }) => {
  const [emailGlobal, setEmailGlobal] = useState("");
  return (
    <UserContext.Provider value={{ emailGlobal, setEmailGlobal }}>
      {children}
    </UserContext.Provider>
  );
};

const UserProvider2 = ({ children }: { children: ReactNode }) => {
  const [isLogin, setIsLogin] = useState(false);
  return (
    <UserContext2.Provider value={{ isUserLogin: isLogin, setIsLogin }}>
      {children}
    </UserContext2.Provider>
  );
};

const Tab = createBottomTabNavigator();

const UserBottomTabNavigator = () => {
  return (
    <View style={styles.userContainer}>
      <CustomHeader title="CricWin" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;
            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Tournaments") {
              iconName = focused ? "trophy" : "trophy-outline";
            } else if (route.name === "Profile") {
              iconName = focused ? "person" : "person-outline";
            } else if (route.name === "History") {
              iconName = focused ? "time" : "time-outline";
            } else if (route.name === "More") {
              iconName = focused
                ? "ellipsis-horizontal"
                : "ellipsis-horizontal-outline";
            } else {
              iconName = "home";
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#4CAF50",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: { display: "flex" },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Tournaments" component={HomeScreen} />
        <Tab.Screen name="Profile" component={Profile} />
        <Tab.Screen name="History" component={History} />
        <Tab.Screen name="More" component={MoreSreen} />
      </Tab.Navigator>
    </View>
  );
};

const AdminBottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Add") {
            iconName = focused ? "add-circle" : "add-circle-outline";
          } else if (route.name === "Tournaments") {
            iconName = focused ? "trophy" : "trophy-outline";
          } else if (route.name === "Teams") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Sponsors") {
            iconName = focused ? "business" : "business-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Add" component={AddTournament} />
      <Tab.Screen name="Tournaments" component={AdminHome} />
      <Tab.Screen name="Teams" component={ManageTeams} />
      <Tab.Screen name="Sponsors" component={ManageSponsors} />
    </Tab.Navigator>
  );
};

interface CustomHeaderProps {
  title: string;
}

const CustomHeader = ({ title }: CustomHeaderProps) => {
  return (
    <View style={styles.headerContainer}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
      />
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
};

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <UserProvider>
      <View style={styles.appContainer}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="UserLayout" component={UserBottomTabNavigator} />
          <Stack.Screen
            name="AdminLayout"
            component={AdminBottomTabNavigator}
          />
        </Stack.Navigator>
      </View>
    </UserProvider>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  userContainer: {
    flex: 1,
  },
  headerContainer: {
    height: 60,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4CAF50",
  },
});

export default AppNavigator;

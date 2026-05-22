import React from "react";
import { View, Text, StyleSheet } from "react-native";

const RegisterTournaments = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Register for Tournament</Text>
      {/* Additional registration form elements will go here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
});

export default RegisterTournaments;

import React, { useState } from "react";
import { Text, Switch, View, StyleSheet, ImageBackground } from "react-native";
import useStore, { Background, Bird, PipeSpeed } from "../../store/store";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";

const SettingsPage = () => {
  const { pipeSpeed, bird, background, setPipeSpeed, setBird, setBackground } =
    useStore();
  const [selectedBird, setSelectedBird] = useState(bird);
  const [selectedBackground, setSelectedBackground] = useState(background);

  const handlePipeSpeedChange = (speed: PipeSpeed) => {
    setPipeSpeed(speed);
  };

  const handleBirdChange = (bird: Bird) => {
    setSelectedBird(bird);
    setBird(bird);
  };

  const handleBackgroundChange = (background: Background) => {
    setSelectedBackground(background);
    setBackground(background);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.setting}>
        <Text style={styles.label}>Pipe Speed</Text>
        <Picker
          selectedValue={pipeSpeed}
          onValueChange={handlePipeSpeedChange}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="Speed 1" value={1} />
          <Picker.Item label="Speed 2" value={2} />
          <Picker.Item label="Speed 3" value={3} />
        </Picker>
      </View>
      <View style={styles.setting}>
        <Text style={styles.label}>Bird</Text>
        <Picker
          selectedValue={selectedBird}
          onValueChange={handleBirdChange}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item
            label="Yellow Bird"
            value="/assets/sprites/yellowbird-upflap.png"
          />
          <Picker.Item
            label="Blue Bird"
            value="/assets/sprites/bluebird-upflap.png"
          />
          <Picker.Item
            label="Red Bird"
            value="/assets/sprites/redbird-upflap.png"
          />
        </Picker>
      </View>
      <View style={styles.setting}>
        <Text style={styles.label}>Background</Text>
        <Picker
          selectedValue={selectedBackground}
          onValueChange={handleBackgroundChange}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item
            label="Day Background"
            value="/assets/sprites/background-day.png"
          />
          <Picker.Item
            label="Night Background"
            value="/assets/sprites/background-night.png"
          />
        </Picker>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 20,
  },
  setting: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  picker: {
    backgroundColor: "white",
    borderRadius: 10,
  },
  pickerItem: {
    fontSize: 16,
    height: 120,
  },
});

export default SettingsPage;

import { Canvas, Image, useImage } from "@shopify/react-native-skia";
import { StatusBar } from "expo-status-bar";
import { Button, Pressable, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useStore from "@/store/store";
import { Audio } from "expo-av";
import { useEffect, useState } from "react";
import { router } from "expo-router";

// Create a mapping for your background images
const backgrounds = {
  "/assets/sprites/background-day.png": require("../../assets/sprites/background-day.png"),
  "/assets/sprites/background-night.png": require("../../assets/sprites/background-night.png"),
};

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const { highScore, background, isMuted, setIsMuted } = useStore();

  // Use the mapping to get the correct image source
  const bgSource = backgrounds[background];
  const bg = useImage(bgSource);
  const message = useImage(require("../../assets/sprites/message.png"));

  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Function to load and play the audio
  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/sprites/audio.mp3")
    );
    setSound(sound);
    await sound.setIsLoopingAsync(true);
    await sound.playAsync();
  }

  // Load the audio when the component mounts
  useEffect(() => {
    if (isMuted) {
      return;
    }
    playSound();
    return () => {
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
    };
  }, [isMuted]);

  // Function to unmute the audio
  const unmute = async () => {
    setIsMuted(false);
    if (sound) {
      await sound.setIsMutedAsync(false);
    }
  };
  const mute = async () => {
    setIsMuted(true);
    if (sound) {
      await sound.setIsMutedAsync(true);
    }
  };

  return (
    <SafeAreaView>
      <Canvas style={{ width, height }}>
        {/* Background */}
        <Image image={bg} fit="cover" width={width} height={height}></Image>
        <Image
          image={message}
          x={width / 15}
          fit="contain"
          width={width - 50}
          height={height}
        ></Image>
      </Canvas>
      <View style={{ position: "absolute", top: 40, left: 20 }}>
        {isMuted ? (
          <Button title={"Unmute"} onPress={unmute} />
        ) : (
          <Button title={"Mute"} onPress={mute} />
        )}
      </View>
      <View style={{ position: "absolute", top: 40, right: 20 }}>
        <Button title={`high score: ${highScore}`} />
      </View>
      <Pressable onPressIn={() => router.push("/game")}>
        <View
          style={{
            position: "absolute",
            bottom: 40,
            right: 0,
            backgroundColor: "transparent",
            height: height - 150,
            width: width + 100,
          }}
        ></View>
      </Pressable>
      <StatusBar style="light" hidden={true} />
    </SafeAreaView>
  );
}
//TODO review the onPressIn function vs onPress

import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  Canvas,
  useImage,
  Image,
  Group,
  Text,
  matchFont,
} from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import {
  Button,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Image as ReactNativeImage } from "react-native";
import useStore from "@/store/store";

// Create a mapping for your background images
const backgrounds = {
  "/assets/sprites/background-day.png": require("../assets/sprites/background-day.png"),
  "/assets/sprites/background-night.png": require("../assets/sprites/background-night.png"),
};

// Create a mapping for your bird images
const birds = {
  "/assets/sprites/yellowbird-upflap.png": require("../assets/sprites/yellowbird-upflap.png"),
  "/assets/sprites/bluebird-upflap.png": require("../assets/sprites/bluebird-upflap.png"),
  "/assets/sprites/redbird-upflap.png": require("../assets/sprites/redbird-upflap.png"),
};

const GRAVITY = 1000;
const JUMP_FORCE = -500;
const pipeWidth = 104;
const pipeHeight = 640;

const Game = () => {
  const { highScore, setHighScore, background, bird, pipeSpeed } = useStore();

  const { width, height } = useWindowDimensions();
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" });
  const fontStyle = {
    fontFamily,
    fontSize: 40,
    FontWeight: "bold",
  };
  const font = matchFont(fontStyle);

  // Use the mappings to get the correct image source
  const bgSource = backgrounds[background];
  const birdSource = birds[bird];
  const bg = useImage(bgSource);
  const birdImage = useImage(birdSource);

  const pipeBottom = useImage(require("../assets/sprites/pipe-green.png"));
  const pipeTop = useImage(
    require("../assets/sprites/pipe-green-upsidedown.png")
  );
  const base = useImage(require("../assets/sprites/base.png"));
  const speed = useSharedValue(pipeSpeed);
  const gameOver = useSharedValue(false);
  const pipeX = useSharedValue(width - 50);
  const pipeOffset = useSharedValue(0);
  const topPipeY = useDerivedValue(() => pipeOffset.value - 320);
  const bottomPipeY = useDerivedValue(() => height - 320 + pipeOffset.value);
  const birdY = useSharedValue(height / 3);
  const birdX = width / 4;

  const birdYVelocity = useSharedValue(0);
  const birdTransform = useDerivedValue(() => {
    return [
      {
        rotate: interpolate(
          birdYVelocity.value,
          [-500, 500],
          [-0.5, 0.5],
          Extrapolation.CLAMP
        ),
      },
    ];
  });
  const birdOrigin = useDerivedValue(() => {
    return { x: width / 4 + 32, y: birdY.value + 24 };
  });
  const obstacles = useDerivedValue(() => [
    // bottom pipe
    {
      x: pipeX.value,
      y: bottomPipeY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
    // top pipe
    {
      x: pipeX.value,
      y: topPipeY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
  ]);

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || gameOver.value || isPaused) {
      return;
    }
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  useEffect(() => {
    moveTheMap();
    return () => {
      cancelAnimation(pipeX);
    };
  }, []);

  const moveTheMap = () => {
    pipeX.value = withRepeat(
      withSequence(
        withTiming(-150, {
          duration: 3000 / speed.value,
          easing: Easing.linear,
        }),
        withTiming(width, { duration: 0 })
      ),
      -1 //this will make it repeat infinitely
    );
  };

  //scoring system
  useAnimatedReaction(
    () => pipeX.value,
    (currentValue, previousValue) => {
      const middle = birdX;

      //change offset of the next gap
      if (previousValue && currentValue < -100 && previousValue > -100) {
        pipeOffset.value = Math.random() * 400 - 200;
      }

      if (
        currentValue !== previousValue &&
        previousValue &&
        currentValue <= middle &&
        previousValue > middle
      ) {
        runOnJS(setScore)(score + 1);
      }
    }
  );

  //high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score]);

  const isPointCollidingWithRect = (
    point: { x: number; y: number },
    rect: {
      x: number;
      y: number;
      h: number;
      w: number;
    }
  ) => {
    "worklet";
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.w &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.h
    );
  };

  //collision detection
  useAnimatedReaction(
    () => birdY.value,
    (currentValue, previousValue) => {
      const center = {
        x: birdX + 32,
        y: birdY.value + 24,
      };

      // for ground and celin collision
      if (currentValue > height - 100 || currentValue < 0) {
        gameOver.value = true;
        runOnJS(setIsGameOver)(true);
      }

      const isColliding = obstacles.value.some((rect) =>
        isPointCollidingWithRect(center, rect)
      );

      if (isColliding) {
        gameOver.value = true;
        runOnJS(setIsGameOver)(true);
      }
    }
  );

  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previousValue) => {
      if (currentValue && !previousValue) {
        cancelAnimation(pipeX);
      }
    }
  );

  const restartGame = () => {
    "worklet";
    birdY.value = height / 3;
    birdYVelocity.value = 0;
    runOnJS(setIsGameOver)(false);
    gameOver.value = false;
    pipeX.value = width;
    runOnJS(moveTheMap)();
    runOnJS(setScore)(0);
  };
  const gesture = Gesture.Tap().onStart(() => {
    if (isPaused) {
      return;
    }
    if (gameOver.value) {
      //restart
      restartGame();
    } else {
      //jump
      birdYVelocity.value = JUMP_FORCE;
    }
  });

  // Pausing the game
  const pauseTheGame = () => {
    if (gameOver.value) {
      return;
    }
    cancelAnimation(pipeX);
    setIsPaused(true);
  };
  const playTheGame = () => {
    if (gameOver.value) {
      return;
    }
    moveTheMap();
    setIsPaused(false);
  };
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height: 1500 }}>
          {/* Background */}
          <Image image={bg} fit="cover" width={width} height={height}></Image>
          {/* Pipes */}
          <Image
            image={pipeTop}
            y={topPipeY}
            x={pipeX}
            width={pipeWidth}
            height={pipeHeight}
          />
          <Image
            image={pipeBottom}
            y={bottomPipeY}
            x={pipeX}
            width={pipeWidth}
            height={pipeHeight}
          />
          {/* Ground */}
          <Image
            image={base}
            width={width}
            height={150}
            y={height - 75}
            x={0}
            fit={"cover"}
          />
          {/* Bird */}
          <Group transform={birdTransform} origin={birdOrigin}>
            <Image
              image={birdImage}
              y={birdY}
              x={birdX}
              width={64}
              height={48}
            />
          </Group>
          <Text
            font={font}
            x={width / 2}
            y={100}
            text={score.toString()}
          ></Text>
        </Canvas>
      </GestureDetector>
      <View style={{ position: "absolute", top: 10, right: 20 }}>
        <Button title={`high score: ${highScore}`} />
      </View>
      {isGameOver && (
        <View
          style={{
            position: "absolute",
            top: "45%",
            left: 0,
          }}
        >
          <Pressable onPress={() => restartGame()}>
            <ReactNativeImage
              source={require("../assets/sprites/gameover.png")}
              style={{ width: width, height: 200, objectFit: "contain" }}
            />
          </Pressable>
        </View>
      )}
    </GestureHandlerRootView>
  );
};
export default Game;

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
import { Button, Platform, View, useWindowDimensions } from "react-native";
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

const GRAVITY = 1000;
const JUMP_FORCE = -500;
const pipeWidth = 104;
const pipeHeight = 640;

const App = () => {
  const { width, height } = useWindowDimensions();
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" });
  const fontStyle = {
    fontFamily,
    fontSize: 40,
    FontWeight: "bold",
  };
  const font = matchFont(fontStyle);

  const bg = useImage(require("./assets/sprites/background-day.png"));
  const bird = useImage(require("./assets/sprites/yellowbird-upflap.png"));
  const pipeBottom = useImage(require("./assets/sprites/pipe-green.png"));
  const pipeTop = useImage(
    require("./assets/sprites/pipe-green-upsidedown.png")
  );
  const base = useImage(require("./assets/sprites/base.png"));
  const pauseButton = useImage(require("./assets/sprites/pause.png"));
  const playButton = useImage(require("./assets/sprites/play.png"));

  const pipeSpeed = useSharedValue(1);
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
          duration: 3000 / pipeSpeed.value,
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
      }

      const isColliding = obstacles.value.some((rect) =>
        isPointCollidingWithRect(center, rect)
      );

      if (isColliding) {
        gameOver.value = true;
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
            <Image image={bird} y={birdY} x={birdX} width={64} height={48} />
          </Group>
          {/* Simulation */}
          {/* <Circle cy={birdCenterY} cx={birdCenterX} r={15} /> */}
          {/* <Rect x={0} y={0} width={256} height={256} color={"lightblue"} /> */}
          {/* Score */}
          <Text
            font={font}
            x={width / 2}
            y={100}
            text={score.toString()}
          ></Text>
        </Canvas>
      </GestureDetector>
      <View style={{ position: "absolute", top: 40, right: 20 }}>
        {isPaused ? (
          <Button title={"Resume"} onPress={playTheGame} />
        ) : (
          <Button title={"Pause"} onPress={pauseTheGame} />
        )}
      </View>
    </GestureHandlerRootView>
  );
};
export default App;

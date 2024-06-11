import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type PipeSpeed = 1 | 2 | 3;
export type Bird =
  | "/assets/sprites/yellowbird-upflap.png"
  | "/assets/sprites/bluebird-upflap.png"
  | "/assets/sprites/redbird-upflap.png";
export type Background =
  | "/assets/sprites/background-day.png"
  | "/assets/sprites/background-night.png";

interface StoreState {
  isMuted: boolean;
  highScore: number;
  pipeSpeed: PipeSpeed;
  bird: Bird;
  background: Background;
  setIsMuted: (isMuted: boolean) => void;
  setHighScore: (score: number) => void;
  setPipeSpeed: (speed: PipeSpeed) => void;
  setBird: (bird: Bird) => void;
  setBackground: (background: Background) => void;
}

const useStore = create<StoreState>()(
  persist(
    (set) => ({
      isMuted: false,
      highScore: 0,
      pipeSpeed: 1,
      bird: "/assets/sprites/yellowbird-upflap.png",
      background: "/assets/sprites/background-day.png",
      setIsMuted: (isMuted: boolean) => set({ isMuted }),
      setHighScore: (score: number) => set({ highScore: score }),
      setPipeSpeed: (speed: PipeSpeed) => set({ pipeSpeed: speed }),
      setBird: (bird: Bird) => set({ bird }),
      setBackground: (background: Background) => set({ background }),
    }),
    {
      name: "game-settings", // unique name
      storage: createJSONStorage(() => AsyncStorage), // use AsyncStorage for storage
    }
  )
);

export default useStore;

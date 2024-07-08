import { create } from "zustand";

interface CustomStore {
  clickedHparam: string | null;
  setClickedHparam: (column: string | null) => void;
}

export const useCustomStore = create<CustomStore>((set) => ({
  clickedHparam: null,
  setClickedHparam: (hparam) => set({ clickedHparam: hparam }),
}));

import { create } from "zustand";
import { Experiment } from "./model/experiment";
import { Hyperparam } from "./model/hyperparam";

interface CustomStore {
  clickedHparam: string | null;
  setClickedHparam: (column: string | null) => void;

  exp: Experiment | null;
  setExp: (experiment: Experiment) => void;

  hyperparams: Hyperparam[];
  setHyperparams: (hyperparams: Hyperparam[]) => void;
}

export const useCustomStore = create<CustomStore>((set) => ({
  clickedHparam: null,
  setClickedHparam: (hparam) => set({ clickedHparam: hparam }),

  exp: null,
  setExp: (exp) => set({ exp }),

  hyperparams: [],
  setHyperparams: (hyperparams) => set({ hyperparams }),
}));

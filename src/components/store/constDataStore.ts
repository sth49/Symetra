import { create } from "zustand";
import { Experiment } from "../../model/experiment";
import { Hyperparam } from "../../model/hyperparam";

interface ConstDataStore {
  exp: Experiment | null;
  setExp: (experiment: Experiment) => void;

  hyperparams: Hyperparam[];
  setHyperparams: (hyperparams: Hyperparam[]) => void;
}

export const useConstDataStore = create<ConstDataStore>((set) => ({
  exp: null,
  setExp: (exp) => set({ exp }),

  hyperparams: [],
  setHyperparams: (hyperparams) => set({ hyperparams }),
}));

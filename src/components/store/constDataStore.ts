import { create } from "zustand";
import { Experiment, Target } from "../../model/experiment";
import { Hyperparam } from "../../model/hyperparam";
interface ConstDataStore {
  exp: Experiment | null;
  setExp: (experiment: Experiment) => void;

  hyperparams: Hyperparam[];
  setHyperparams: (hyperparams: Hyperparam[]) => void;

  hparamSort: {
    id: string;
    desc: boolean;
  } | null;
  setHparamSort: (sort: { id: string; desc: boolean }) => void;

  target: Target[];
  setTarget: (target: Target[]) => void;
}

export const useConstDataStore = create<ConstDataStore>((set) => ({
  exp: null,
  setExp: (exp) => set({ exp }),

  hyperparams: [],
  setHyperparams: (hyperparams) => set({ hyperparams }),

  hparamSort: null,
  setHparamSort: (sort) => set({ hparamSort: sort }),

  target: [],
  setTarget: (target) => set({ target }),
}));

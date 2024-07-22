import { create } from "zustand";
import { Experiment } from "./model/experiment";
import { Hyperparam } from "./model/hyperparam";
import { Group } from "./model/group";

interface CustomStore {
  clickedHparam: string | null;
  setClickedHparam: (column: string | null) => void;

  exp: Experiment | null;
  setExp: (experiment: Experiment) => void;

  hyperparams: Hyperparam[];
  setHyperparams: (hyperparams: Hyperparam[]) => void;

  groups: Group[];
  setGroups: (groups: Group[]) => void;

  hoveredGroup: Set<any>;
  setHoveredGroup: (hoveredGroup: Set<any>) => void;

  selectedGroup: Set<any>;
  setSelectedGroup: (selectedGroup: Set<any>) => void;
}

export const useCustomStore = create<CustomStore>((set) => ({
  clickedHparam: null,
  setClickedHparam: (hparam) => set({ clickedHparam: hparam }),

  exp: null,
  setExp: (exp) => set({ exp }),

  hyperparams: [],
  setHyperparams: (hyperparams) => set({ hyperparams }),

  groups: [],
  setGroups: (groups) => set({ groups }),

  hoveredGroup: new Set(),
  setHoveredGroup: (hoveredGroup) => set({ hoveredGroup }),

  selectedGroup: new Set(),
  setSelectedGroup: (selectedGroup) => set({ selectedGroup }),
}));

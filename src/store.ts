import { create } from "zustand";
import { Experiment } from "./model/experiment";
import { Hyperparam } from "./model/hyperparam";
import { Group, Groups } from "./model/group";
import { TrialPathModel } from "./model/trialPath";

interface HparamValue {
  name: string;
  value: any;
}

interface CustomStore {
  clickedHparam: string | null;
  setClickedHparam: (column: string | null) => void;

  // exp: Experiment | null;
  // setExp: (experiment: Experiment) => void;

  // hyperparams: Hyperparam[];
  // setHyperparams: (hyperparams: Hyperparam[]) => void;

  groups: Groups;
  setGroups: (groups: Groups) => void;

  hoveredGroup: Set<any>;
  setHoveredGroup: (hoveredGroup: Set<any>) => void;

  selectedGroup: Set<any>;
  setSelectedGroup: (selectedGroup: Set<any>) => void;

  clickedHparamValue: HparamValue | null;
  setClickedHparamValue: (value: HparamValue | null) => void;

  trialPathModel: TrialPathModel;
  setTrialPathModel: (trialPathModel: TrialPathModel) => void;

  selectedTrials: number[];
  setSelectedTrials: (selectedTrials: number[]) => void;

  selectedRowPositions: any[];
  setSelectedRowPositions: (selectedRowPositions: any[]) => void;
}

export const useCustomStore = create<CustomStore>((set) => ({
  clickedHparam: null,
  setClickedHparam: (hparam) => set({ clickedHparam: hparam }),

  // exp: null,
  // setExp: (exp) => set({ exp }),

  // hyperparams: [],
  // setHyperparams: (hyperparams) => set({ hyperparams }),

  groups: new Groups(),
  setGroups: (groups) => set({ groups }),

  hoveredGroup: new Set(),
  setHoveredGroup: (hoveredGroup) => set({ hoveredGroup }),

  selectedGroup: new Set(),
  setSelectedGroup: (selectedGroup) => set({ selectedGroup }),

  clickedHparamValue: null, // 선택된 하이퍼파라미터 값에 대한 다른 하이퍼파라미터 값들의 correlation 구할때 사용
  setClickedHparamValue: (value) => set({ clickedHparamValue: value }),

  trialPathModel: new TrialPathModel(),
  setTrialPathModel: (trialPathModel) => set({ trialPathModel }),

  selectedTrials: [],
  setSelectedTrials: (selectedTrials) => set({ selectedTrials }),

  selectedRowPositions: [],
  setSelectedRowPositions: (selectedRowPositions) =>
    set({ selectedRowPositions }),
}));

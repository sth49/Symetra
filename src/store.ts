import { create } from "zustand";
import { Group, Groups } from "./model/group";
import { TrialPathModel } from "./model/trialPath";

interface HparamValue {
  name: string;
  displayName: string;
  value: any;
}

interface CustomStore {
  clickedHparam: string | null;
  setClickedHparam: (column: string | null) => void;

  groups: Groups;
  setGroups: (groups: Groups) => void;

  hoveredGroup: Set<any>;
  setHoveredGroup: (hoveredGroup: Set<any>) => void;

  selectedGroup: Set<any>;
  setSelectedGroup: (selectedGroup: Set<any>) => void;

  currentSelectedGroup: Group | null;
  setCurrentSelectedGroup: (group: Group | null) => void;

  currentSelectedGroup2: Group | null;
  setCurrentSelectedGroup2: (group: Group | null) => void;

  editGroupName: (groupId: number, newName: string) => void;

  clickedHparamValue: HparamValue | null;
  setClickedHparamValue: (value: HparamValue | null) => void;

  trialPathModel: TrialPathModel;
  setTrialPathModel: (trialPathModel: TrialPathModel) => void;

  selectedTrials: number[];
  setSelectedTrials: (selectedTrials: number[]) => void;

  selectedRowPositions: any[];
  setSelectedRowPositions: (selectedRowPositions: any[]) => void;

  selectFlag: boolean;
  setSelectFlag: (selectFlag: boolean) => void;

  selectOneTrial: number | null;
  setSelectOneTrial: (selectOneTrial: number | null) => void;

  selectedBranchId: string | null;
  setSelectedBranchId: (branchId: string | null) => void;
}

export const useCustomStore = create<CustomStore>((set) => ({
  clickedHparam: null,
  setClickedHparam: (hparam) => set({ clickedHparam: hparam }),

  groups: new Groups(),
  setGroups: (groups) => set({ groups }),

  hoveredGroup: new Set(),
  setHoveredGroup: (hoveredGroup) => set({ hoveredGroup }),

  selectedGroup: new Set(),
  setSelectedGroup: (selectedGroup) => set({ selectedGroup }),

  currentSelectedGroup: null,
  setCurrentSelectedGroup: (group) => set({ currentSelectedGroup: group }),

  currentSelectedGroup2: null,
  setCurrentSelectedGroup2: (group) => set({ currentSelectedGroup2: group }),

  editGroupName: (groupId, newName) =>
    set((state) => {
      const newGroups = state.groups.clone();
      const group = newGroups.getGroup(groupId);
      if (group) {
        group.editName(newName);
        return {
          groups: newGroups,
          currentSelectedGroup:
            state.currentSelectedGroup &&
            state.currentSelectedGroup.id === groupId
              ? group
              : state.currentSelectedGroup,
        };
      }
      return state;
    }),

  clickedHparamValue: null, // 선택된 하이퍼파라미터 값에 대한 다른 하이퍼파라미터 값들의 correlation 구할때 사용
  setClickedHparamValue: (value) => set({ clickedHparamValue: value }),

  trialPathModel: new TrialPathModel(),
  setTrialPathModel: (trialPathModel) => set({ trialPathModel }),

  selectedTrials: [],
  setSelectedTrials: (selectedTrials) => set({ selectedTrials }),

  selectedRowPositions: [],
  setSelectedRowPositions: (selectedRowPositions) =>
    set({ selectedRowPositions }),

  selectFlag: false,
  setSelectFlag: (selectFlag) => set({ selectFlag }),

  selectOneTrial: null,
  setSelectOneTrial: (selectOneTrial) => set({ selectOneTrial }),

  selectedBranchId: null,
  setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
}));

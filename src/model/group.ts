import { Trial } from "./trial";

export class Groups {
  public lastGroupId = 0;
  public groups: Group[] = [];
  constructor() {
    console.log("Groups created");
  }

  getGroup(id: number) {
    return this.groups.find((group) => group.id === id);
  }

  addGroup(trials: Trial[]) {
    const group = new Group(this.lastGroupId, trials);
    this.groups.push(group);
    this.lastGroupId++;
  }
  deleteGroup(id: number) {
    this.groups = this.groups.filter((group) => group.id !== id);
  }
  getLength() {
    return this.groups.length;
  }
}

export class Group {
  constructor(public id: number, public trials: Trial[]) {}

  getCoverages() {
    const coverages = this.trials.map((trial) => trial.metric);
    return coverages;
  }
  getBranches() {
    const branches = this.trials.map((trial) =>
      Object.values(trial.branch).map((b, index) =>
        b === 1 ? index + 1 : null
      )
    );
    return branches.map((branch) => branch.filter((b) => b !== null)).flat();
  }
}

import { Trial } from "./trial";

export class Groups {
  public lastGroupId = -3;
  public groups: Group[] = [];
  constructor() {
    console.log("Groups created");
  }

  getGroup(id: number) {
    return this.groups.find((group) => group.id === id);
  }

  addGroup(trials: Trial[], name?: string) {
    const group = new Group(
      this.lastGroupId,
      trials,
      name ? name : "Group " + (this.lastGroupId + 1)
    );
    this.groups.push(group);
    this.lastGroupId++;
  }
  editGroup(group: Group) {
    const index = this.groups.findIndex((g) => g.id === group.id);
    this.groups[index] = group;
  }
  deleteGroup(id: number) {
    this.groups = this.groups.filter((group) => group.id !== id);
  }
  getLength() {
    return this.groups.length;
  }
  clone() {
    const clone = new Groups();
    clone.lastGroupId = this.lastGroupId;
    clone.groups = this.groups.map((group) => group.clone());
    return clone;
  }
}

export class Group {
  constructor(
    public id: number,
    public trials: Trial[],
    public name: string = "Group " + (id + 1)
  ) {}

  getLength() {
    return this.trials.length;
  }

  editName(name: string) {
    this.name = name;
  }

  clone() {
    return new Group(this.id, this.trials, this.name);
  }

  getCoverages() {
    const coverages = this.trials.map((trial) => trial.metric);
    return coverages;
  }
  getStats() {
    const avg =
      this.trials.reduce((acc, trial) => acc + trial.metric, 0) /
      this.trials.length;
    const max = Math.max(...this.trials.map((trial) => trial.metric));
    const min = Math.min(...this.trials.map((trial) => trial.metric));
    return {
      avg: avg,
      max: max,
      min: min,
      acc: this.getUnion().size,
    };
  }

  getUnion() {
    const unionSet = new Set<number>();
    for (const trial of this.trials) {
      trial.branch.forEach((b) => unionSet.add(b));
    }
    return unionSet;
  }

  getOrignalBranches(maxBranch: number = 3365) {
    const branchCount = {};
    for (let i = 1; i < maxBranch + 1; i++) {
      branchCount[i] = 0;
    }
    this.trials.forEach((trial) => {
      trial.branch.forEach((b) => {
        if (branchCount[b] === undefined) {
          branchCount[b] = 1;
        } else {
          branchCount[b]++;
        }
      });
    });
    return branchCount;
  }

  getBranches(maxBranch: number = 3365) {
    //format {3: 45, } means branch 3 has 45 trials
    // const branchCount = {};
    // for (let i = 1; i < maxBranch + 1; i++) {
    //   branchCount[i] = 0;
    // }
    // this.trials.forEach((trial) => {
    //   trial.branch.forEach((b) => {
    //     if (branchCount[b] === undefined) {
    //       branchCount[b] = 1;
    //     } else {
    //       branchCount[b]++;
    //     }
    //   });
    // });
    const branchCount = this.getOrignalBranches(maxBranch);

    Object.keys(branchCount).forEach((key) => {
      branchCount[key] = branchCount[key] / this.trials.length;
    });

    return Object.entries(branchCount).sort(
      ([, a], [, b]) => Number(b) - Number(a)
    );
  }

  // getBranches() {
  //   const branches = this.trials.map((trial) =>
  //     Object.values(trial.branch).map((b, index) =>
  //       b === 1 ? index + 1 : null
  //     )
  //   );
  //   return branches.map((branch) => branch.filter((b) => b !== null)).flat();
  // }

  getHyperparam(hyperparam: string) {
    return this.trials.map((trial) => trial.params[hyperparam]);
  }

  getHparamMax(hyperparam: string) {
    if (hyperparam === "Coverage") {
      return Math.max(...this.trials.map((trial) => trial.metric));
    }
    return parseFloat(
      Math.max(
        ...this.trials.map((trial) => Number(trial.params[hyperparam]))
      ).toFixed(2)
    );
  }
  getHparamMin(hyperparam: string) {
    if (hyperparam === "Coverage") {
      return Math.min(...this.trials.map((trial) => trial.metric));
    }
    return parseFloat(
      Math.min(
        ...this.trials.map((trial) => Number(trial.params[hyperparam]))
      ).toFixed(2)
    );
  }
  getHparamMean(hyperparam: string) {
    if (hyperparam === "Coverage") {
      return parseFloat(
        (
          this.trials.reduce((acc, trial) => acc + trial.metric, 0) /
          this.trials.length
        ).toFixed(2)
      );
    }
    return parseFloat(
      (
        this.trials.reduce(
          (acc, trial) => acc + Number(trial.params[hyperparam]),
          0
        ) / this.trials.length
      ).toFixed(2)
    );
  }
}

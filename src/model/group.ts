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

  addGroup(trials: Trial[], name?: string) {
    const group = new Group(
      this.lastGroupId,
      trials,
      name ? name : "Group " + (this.lastGroupId + 1)
    );
    this.groups.push(group);
    this.lastGroupId++;
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
    clone.groups = this.groups.map((group) => {
      return new Group(group.id, group.trials, group.name);
    });
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
    };
  }

  getUnion() {
    const unionSet = new Set<number>();
    for (const trial of this.trials) {
      trial.branch.forEach((b) => unionSet.add(b));
    }
    return unionSet;
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

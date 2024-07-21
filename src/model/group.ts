import { Trial } from "./trial";

export class Group {
  constructor(public id: string, public trials: Trial[]) {}

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

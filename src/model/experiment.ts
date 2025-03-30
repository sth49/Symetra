import { Hyperparam, HyperparamJson, Metric } from "./hyperparam";
import { Trial, TrialJson } from "./trial";

export interface ConfigJson {
  name: string;
  targets: TargetJson[];
  hyperparameters: HyperparamJson[];
  metric: Metric;
}

interface TargetJson {
  name: string;
  r2: number;
  mse: number;
  base: number;
  total: number;
  max: number;
}

export class Target {
  constructor(
    public name: string,
    public r2: number,
    public mse: number,
    public base: number,
    public total: number,
    public max: number
  ) {}
  static fromJson(targetJson: TargetJson) {
    return new Target(
      targetJson.name,
      targetJson.r2,
      targetJson.mse,
      targetJson.base,
      targetJson.total,
      targetJson.max
    );
  }
}
function parseBranchInfo(info: string) {
  const originalPath = info.match(/File:(.*?)\s/)?.[1] || "";

  const line = parseInt(info.match(/Line:(\d+)/)?.[1] || "0");

  const filePath = `program/${originalPath}`;

  return { filePath, line };
}

export class BranchInfo {
  public fileName: string;
  constructor(
    public branch: string,
    public filePath: string,
    public line: number
  ) {
    this.fileName = filePath.split("/").pop();
  }
  static fromJson(index, branchInfoString) {
    try {
      const { filePath, line } = parseBranchInfo(branchInfoString);

      return new BranchInfo(index, filePath, line);
    } catch (e) {
      return new BranchInfo(index, "Could not found the condition...", 0);
    }
  }
}
export class Experiment {
  constructor(
    public name: string,
    public hyperparams: Hyperparam[],
    public trials: Trial[],
    public metric: Metric,
    public branchInfo: BranchInfo[]
  ) {}

  static fromJson(configJson: any, trialJson, paramList, branchInfo) {
    const allHyperparams = [] as Hyperparam[];
    configJson["hyperparameters"].map((column: HyperparamJson) => {
      allHyperparams.push(Hyperparam.fromJson(column, trialJson));
    });

    const hyperparams = allHyperparams.filter((param) =>
      paramList.includes(param.name)
    );

    const trials = [] as Trial[];

    trialJson.map((trial: TrialJson) => {
      trials.push(Trial.fromJson(trial));
    });
    const unionSet = new Set<number>();
    for (const trial of trials) {
      trial.branch.forEach((b) => unionSet.add(b));
    }

    const branchInfoList = [] as BranchInfo[];

    Object.keys(branchInfo).map((key) => {
      branchInfoList.push(BranchInfo.fromJson(key, branchInfo[key]));
    });

    return new Experiment(
      configJson.name,
      hyperparams,
      trials,
      Metric.fromJson(configJson.metric, unionSet.size),
      branchInfoList
    );
  }
}

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
  // console.log("Original path:", originalPath); // gcal-4.1/src/gcal.c

  const line = parseInt(info.match(/Line:(\d+)/)?.[1] || "0");

  // program 폴더는 이미 public에 있으므로 경로 앞에 추가
  const filePath = `program/${originalPath}`;
  // console.log("Final file path:", filePath);

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
      // const filePath = branchInfoString.split(" ")[0].split("File:")[1];
      // const line = parseInt(branchInfoString.split(" ")[1].split("Line:")[1]);
      // const condition = parseInt(branchInfoString.split(" ")[2].split(":")[1]);

      const { filePath, line } = parseBranchInfo(branchInfoString);

      return new BranchInfo(index, filePath, line);
    } catch (e) {
      // console.log("error", e);
      return new BranchInfo(index, "Could not found the condition...", 0);
    }
  }
}
export class Experiment {
  constructor(
    public name: string,
    public hyperparams: Hyperparam[],
    public trials: Trial[],
    public metric: Metric, // public featureOrder: string[],
    public branchInfo: BranchInfo[]
  ) {}

  static fromJson(configJson: ConfigJson, trialJson, paramList, branchInfo) {
    const allHyperparams = [] as Hyperparam[];
    configJson["hyperparameters"].map((column: HyperparamJson) => {
      allHyperparams.push(Hyperparam.fromJson(column, trialJson));
    });

    const hyperparams = allHyperparams.filter((param) =>
      paramList.includes(param.name)
    );

    const trials = [] as Trial[];

    // console.log(trialJson[0]);
    // console.log(trialJson[1]);

    trialJson.map((trial: TrialJson) => {
      trials.push(Trial.fromJson(trial));
    });
    const unionSet = new Set<number>();
    for (const trial of trials) {
      trial.branch.forEach((b) => unionSet.add(b));
    }

    // hyperparams.map((param) => param.name );

    const branchInfoList = [] as BranchInfo[];
    // branchInfo.map((branchInfoString, index) => {
    //   console.log("branchInfoString", branchInfoString);
    // });
    console.log("branchInfo", branchInfo);
    Object.keys(branchInfo).map((key) => {
      branchInfoList.push(BranchInfo.fromJson(key, branchInfo[key]));
    });

    // console.log("branchInfoString", branchInfo[index]);

    // column 이름 추출
    return new Experiment(
      configJson.name,
      hyperparams,
      trials,
      Metric.fromJson(configJson.metric, unionSet.size),
      branchInfoList
    );
  }
}

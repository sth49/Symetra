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
export class Experiment {
  constructor(
    public name: string,
    public hyperparams: Hyperparam[],
    public trials: Trial[],
    public metric: Metric // public featureOrder: string[],
  ) {}

  static fromJson(configJson: ConfigJson, trialJson, paramList) {
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

    // hyperparams.map((param) => param.name );

    // column 이름 추출
    return new Experiment(
      configJson.name,
      // hyperparams,
      hyperparams,

      trials,
      Metric.fromJson(configJson.metric, unionSet.size)
    );
  }
}

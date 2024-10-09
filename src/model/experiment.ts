import { Hyperparam, HyperparamJson, Metric } from "./hyperparam";
import { Trial, TrialJson } from "./trial";

export interface ConfigJson {
  name: string;
  hyperparameters: HyperparamJson[];
  metric: Metric;
}

export class Experiment {
  constructor(
    public name: string,
    public hyperparams: Hyperparam[],
    public trials: Trial[],
    public metric: Metric // public featureOrder: string[]
  ) {}

  static fromJson(configJson: ConfigJson, trialJson) {
    const hyperparams = [] as Hyperparam[];
    configJson["hyperparameters"].map((column: HyperparamJson) => {
      hyperparams.push(Hyperparam.fromJson(column, trialJson));
    });
    const trials = [] as Trial[];

    trialJson.map((trial: TrialJson) => {
      trials.push(Trial.fromJson(trial));
    });

    // column 이름 추출
    return new Experiment(
      configJson.name,
      hyperparams,
      trials,
      Metric.fromJson(configJson.metric)
    );
  }
}

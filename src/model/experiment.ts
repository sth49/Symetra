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
    public metric: Metric
  ) {}

  static fromJson(configJson: ConfigJson, trialJson: TrialJson[]) {
    const hyperparams = [] as Hyperparam[];
    configJson["hyperparameters"].map((column: HyperparamJson) => {
      hyperparams.push(Hyperparam.fromJson(column));
    });
    const trials = [] as Trial[];

    trialJson.map((trial: TrialJson) => {
      trials.push(Trial.fromJson(trial));
    });

    console.log(trials);

    return new Experiment(
      configJson.name,
      hyperparams,
      trials,
      Metric.fromJson(configJson.metric)
    );
  }
}

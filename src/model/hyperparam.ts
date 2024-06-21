import * as d3 from "d3";
import { schemeCategory10 } from "d3";

export enum HyperparamTypes {
  Numerical,
  Categorical,
  Boolean,
  List,
}

export interface HyperparamJson {
  name: string;
  displayName: string;
  value: unknown;
  valueType: string;
  type: string;
}

export class Metric {
  constructor(public name: string, public displayName: string) {}

  static fromJson(json: Metric) {
    return new Metric(json.name, json.displayName);
  }
}

export class Hyperparam {
  public type!: HyperparamTypes;
  public shapValues: number[] = [];
  public values: any[] = [];
  constructor(
    public name: string,
    public displayName: string,
    public value: string[] | number[] | boolean[] | string[][],
    public valueType: string
  ) {}

  static fromJson(json: HyperparamJson, trialJson, shapValueJson) {
    let hparam: Hyperparam;
    if (json.type === "numerical") {
      hparam = new NumericalHyperparam(json);
    } else if (json.type === "categorical") {
      hparam = new CategoricalHyperparam(json);
    } else if (json.type === "boolean") {
      hparam = new BooleanHyperparam(json);
    } else if (json.type === "list") {
      hparam = new ListHyperparam(json);
    } else {
      throw new Error("Invalid hyperparam type");
    }
    trialJson.map((trial) => {
      hparam.values.push(trial.config[hparam.name]);
    });

    shapValueJson.map((value) => {
      hparam.shapValues.push(value[hparam.name]);
    });
    // hparam.shapValues = shapValue;
    return hparam;
  }
  getColor(arg0: string): string | undefined {
    throw new Error("Method not implemented.");
  }
  formatting(arg0: any): any {
    throw new Error("Method not implemented.");
  }
  getEffect(): number {
    // shapValues 배열의 절대값의 합 계산
    const effect = this.shapValues.reduce(
      (acc, currentValue) => acc + Math.abs(currentValue),
      0
    );
    if (isNaN(effect)) {
      return 0;
    }
    return effect;
  }
  getEffectByValue() {
    throw new Error("Method not implemented.");
  }
}

export class NumericalHyperparam extends Hyperparam {
  type = HyperparamTypes.Numerical;
  constructor(json: HyperparamJson) {
    const value = json.value as number[];
    super(json.name, json.displayName, value, json.valueType);
  }
  formatting(value: number) {
    if (this.valueType === "int") {
      return value;
    } else {
      return value.toFixed(2);
    }
  }
}

export class CategoricalHyperparam extends Hyperparam {
  type = HyperparamTypes.Categorical;
  public scale: d3.ScaleOrdinal<string, string>; // Add the missing type arguments

  constructor(json: HyperparamJson) {
    const value = (json.value as string[]).sort();
    super(json.name, json.displayName, value, json.valueType);
    this.scale = d3
      .scaleOrdinal<string, string>(schemeCategory10) // Add the missing type arguments
      .domain(value);
  }
  getColor(value: string) {
    return this.scale(value);
  }
  getEffectByValue() {
    let effectByValue: { [key: string]: number } = {};

    this.values.map((value) => {
      const index = this.value.indexOf(value);
      const shapValue = this.shapValues[index];
      // mean of shap values
      effectByValue[value] = shapValue / this.shapValues.length;
    });
    return effectByValue;
  }
}

export class BooleanHyperparam extends Hyperparam {
  type = HyperparamTypes.Boolean;
  constructor(json: HyperparamJson) {
    const value = json.value as boolean[];
    super(json.name, json.displayName, value, json.valueType);
  }
  getEffectByValue() {
    let effectByValue: { [key: string]: number } = {};

    this.values.map((value) => {
      const index = this.value.indexOf(value);
      const shapValue = this.shapValues[index];
      // mean of shap values
      effectByValue[value] = shapValue / this.shapValues.length;
    });
    return effectByValue;
  }
}
export class ListHyperparam extends Hyperparam {
  type = HyperparamTypes.List;
  constructor(json: HyperparamJson) {
    const value = json.value as number[];
    super(json.name, json.displayName, value, json.valueType);
  }
}

import * as d3 from "d3";
import { schemeCategory10 } from "d3";

import {
  scaleLinear,
  scaleOrdinal,
  scaleThreshold,
  scaleQuantile,
} from "@visx/scale";
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
  public shapValues: number[] = []; // 모든 trial의 해당 hp에 대한 shap value 저장
  public values: any[] = []; // 모든 trial의 해당 hp에 대한 값 저장
  public visible = true;
  public scale: any;
  constructor(
    public name: string,
    public displayName: string,
    public value: string[] | number[] | boolean[] | string[][],
    public valueType: string
  ) {}

  static fromJson(json: HyperparamJson, trialJson) {
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

    trialJson.map((trial) => {
      hparam.shapValues.push(trial.shap_values[hparam.name]);
    });
    // hparam.shapValues = shapValue;
    return hparam;
  }
  getColor(index: number): string | undefined {
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
  toggleVisible() {
    console.log("toggleVisible");
    this.visible = !this.visible;
  }
}

export class NumericalHyperparam extends Hyperparam {
  type = HyperparamTypes.Numerical;
  constructor(json: HyperparamJson) {
    const value = json.value as number[];
    super(json.name, json.displayName, value, json.valueType);
    this.scale = d3
      .scaleSequential(d3.interpolateReds)
      .domain([Math.min(...value), Math.max(...value)]);
    // this.scale = scaleLinear({
    //   domain: [Math.min(...value), Math.max(...value)],
    //   range: ["#f0f0f0", "#ff0000"],
    // });
  }
  formatting(value: number) {
    if (this.valueType === "int") {
      return value;
    } else {
      return value.toFixed(2);
    }
  }
  getColor(index: number) {
    // return d3.interpolateRdBu((this.value[index] + 1) / 2);
    return this.scale(this.values[index]);
  }
  getEffectByValue() {
    let bins = 10; // 구간 수
    let effectByValue: { [key: string]: number } = {}; // 각 구간별 영향력 평균 저장
    const isInt = this.valueType === "int";

    // 값들의 최소/최대값 계산
    let min = Math.min(...this.values);
    let max = Math.max(...this.values);

    // 구간 범위 계산
    let step = (max - min) / bins;
    let range = Array.from({ length: bins }, (_, i) => min + i * step);
    range.push(max);

    // 각 구간별 영향력 평균 계산
    for (let i = 0; i < bins; i++) {
      let start = range[i];
      let end = range[i + 1];
      let effectSum = 0;
      let count = 0;

      this.shapValues.forEach((val, index) => {
        let value = this.values[index];
        if (value >= start && value < end) {
          effectSum += val;
          count++;
        }
      });

      let effectAvg = count > 0 ? effectSum / count : 0;
      let val = isInt
        ? Math.round(start) + " ~ " + Math.round(end)
        : start.toFixed(2) + " ~ " + end.toFixed(2);
      effectByValue[val] = effectAvg;
    }

    return effectByValue;
  }
}

export class CategoricalHyperparam extends Hyperparam {
  type = HyperparamTypes.Categorical;
  scale: d3.ScaleOrdinal<string, string>; // Add the missing type arguments

  constructor(json: HyperparamJson) {
    const value = (json.value as string[]).sort();
    super(json.name, json.displayName, value, json.valueType);
    this.scale = d3
      .scaleOrdinal<string, string>(schemeCategory10) // Add the missing type arguments
      .domain(value);
  }
  getColor(index: number) {
    // return this.scale(value);
    return this.scale(this.values[index]);
  }
  getEffectByValue() {
    let effectByValue: { [key: string]: number } = {};
    this.values.map((value) => {
      effectByValue[value] = 0;
      let count = 0;
      this.shapValues.map((val, index) => {
        if (this.values[index] === value) {
          effectByValue[value] += val;
          count++;
        }
      });
      effectByValue[value] /= count;
    });
    return effectByValue;
  }
}

// export class BooleanHyperparam extends Hyperparam {
//   type = HyperparamTypes.Boolean;
//   constructor(json: HyperparamJson) {
//     const value = json.value as boolean[];
//     super(json.name, json.displayName, value, json.valueType);
//     this.scale = d3
//       .scaleOrdinal<string, string>(["gray", "white"]) // Add the missing type arguments
//       .domain([true, false]);
//   }
//   getColor(index: number): string | undefined {
//     // return this.values[index] ? "gray" : "white";
//     return this.scale(this.values[index]);
//   }
//   getEffectByValue() {
//     let effectByValue: { [key: string]: number } = {};
//     this.value.map((value) => {
//       effectByValue[value] = 0;
//       let count = 0;
//       this.values.map((val, index) => {
//         if (val === value) {
//           effectByValue[value] += this.shapValues[index];
//           count++;
//         }
//       });
//       effectByValue[value] /= count;
//     });

//     // sort effectByValue by key
//     let ordered = {};
//     Object.keys(effectByValue)
//       .sort()
//       .reverse()
//       .forEach(function (key) {
//         ordered[key] = effectByValue[key];
//       });
//     return ordered;
//   }
// }

// import { scaleOrdinal } from "d3-scale";

export class BooleanHyperparam extends Hyperparam {
  readonly type = HyperparamTypes.Boolean;
  private static readonly scale = scaleOrdinal<boolean, string>()
    .domain([true, false])
    .range(["gray", "white"]);

  constructor(json: HyperparamJson) {
    const value = json.value as boolean[];
    super(json.name, json.displayName, value, json.valueType);
  }

  getColor(index: number): string {
    return BooleanHyperparam.scale(this.values[index]);
  }

  getEffectByValue(): Record<string, number> {
    const effectSum: Record<boolean, number> = { true: 0, false: 0 };
    const count: Record<boolean, number> = { true: 0, false: 0 };

    this.values.forEach((val, index) => {
      effectSum[val] += this.shapValues[index];
      count[val]++;
    });

    const effectByValue: Record<string, number> = {
      true: effectSum[true] / (count[true] || 1),
      false: effectSum[false] / (count[false] || 1),
    };

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

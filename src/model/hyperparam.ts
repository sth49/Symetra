import * as d3 from "d3";
import { schemeCategory10 } from "d3";

import { MdCategory } from "react-icons/md";
import { RxComponentBoolean } from "react-icons/rx";
import { MdOutlineHdrStrong } from "react-icons/md";
import { HiHashtag } from "react-icons/hi";

import { scaleLinear } from "@visx/scale";
import { formatting } from "./utils";
export enum HyperparamTypes {
  Continuous,
  // Discrete,
  Binary,
  Nominal,
  Ordinal,
}

export const HparamIcons = {
  Ordinal: MdOutlineHdrStrong,
  Nominal: MdCategory,
  Binary: RxComponentBoolean,
  Continuous: HiHashtag,
};

export interface HyperparamJson {
  name: string;
  displayName: string;
  value: unknown;
  valueType: string;
  type: string;
}

export class Metric {
  constructor(
    public name: string,
    public displayName: string,
    public totalBranch: number = 0,
    public baseValue: number = 0
  ) {}

  static fromJson(json: Metric, totalBranch: number) {
    return new Metric(json.name, json.displayName, totalBranch, json.baseValue);
  }
}

export class Hyperparam {
  public type!: HyperparamTypes;
  public shapValues: number[] = []; // 모든 trial의 해당 hp에 대한 shap value 저장
  public values: any[] = []; // 모든 trial의 해당 hp에 대한 값 저장
  public visible = true;
  public scale: any;
  public icon: any;
  public effectsByValue: any;
  constructor(
    public name: string,
    public displayName: string,
    public value: string[] | number[] | boolean[] | string[][],
    public valueType: string
  ) {}

  static fromJson(json: HyperparamJson, trialJson) {
    let hparam: Hyperparam;
    if (json.type === "numerical") {
      hparam = new ContinuousHyperparam(json);
    } else if (json.type === "categorical") {
      hparam = new NominalHyperparam(json);
    } else if (json.type === "boolean") {
      hparam = new BinaryHyperparam(json);
    } else if (json.type === "ordinal") {
      hparam = new OrdinalHyperparam(json);
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
  getEffect(trialIds: number[] = []): number {
    // shapValues 배열의 절대값의 합 계산

    if (trialIds.length > 0) {
      const effect = trialIds.reduce(
        // (acc, currentValue) => acc + Math.abs(this.shapValues[currentValue]),
        (acc, currentValue) => acc + this.shapValues[currentValue],
        0
      );
      if (isNaN(effect)) {
        return 0;
      }
      return effect;
    }
    const effect = this.shapValues.reduce(
      // (acc, currentValue) => acc + Math.abs(currentValue),
      (acc, currentValue) => acc + currentValue,
      0
    );
    if (isNaN(effect)) {
      return 0;
    }
    return effect;
  }

  getMeanEffect(): number {
    return this.getEffect() / this.shapValues.length;
  }

  getAbsoluteEffect(trialIds: number[] = []): number {
    return Math.abs(this.getEffect(trialIds));
  }
  getMeanAbsoluteEffect(): number {
    return Math.abs(this.getMeanEffect());
  }
  getPositiveEffect(trialIds: number[] = []): number {
    // shapValues 배열의 양수 합 계산
    if (trialIds.length > 0) {
      const effect = trialIds.reduce(
        (acc, currentValue) => acc + Math.max(0, this.shapValues[currentValue]),
        0
      );
      if (isNaN(effect)) {
        return 0;
      }

      const count = trialIds.reduce(
        (acc, currentValue) =>
          acc + (this.shapValues[currentValue] > 0 ? 1 : 0),
        0
      );

      return effect / count;
    }
    const effect = this.shapValues.reduce(
      (acc, currentValue) => acc + Math.max(0, currentValue),
      0
    );
    if (isNaN(effect)) {
      return 0;
    }

    const count = this.shapValues.reduce(
      (acc, currentValue) => acc + (currentValue > 0 ? 1 : 0),
      0
    );
    return effect / count;
  }

  getNegativeEffect(trialIds: number[] = []): number {
    // shapValues 배열의 음수 합 계산
    if (trialIds.length > 0) {
      const effect = trialIds.reduce(
        (acc, currentValue) => acc + Math.min(0, this.shapValues[currentValue]),
        0
      );
      if (isNaN(effect)) {
        return 0;
      }

      const count = trialIds.reduce(
        (acc, currentValue) =>
          acc + (this.shapValues[currentValue] < 0 ? 1 : 0),
        0
      );

      return effect / count;
    }
    const effect = this.shapValues.reduce(
      (acc, currentValue) => acc + Math.min(0, currentValue),
      0
    );
    if (isNaN(effect)) {
      return 0;
    }

    const count = this.shapValues.reduce(
      (acc, currentValue) => acc + (currentValue < 0 ? 1 : 0),
      0
    );

    return effect / count;
  }

  toggleVisible() {
    // console.log("toggleVisible");
    this.visible = !this.visible;
  }
  getColorByValue(value: any): string {
    throw new Error("Method not implemented.");
  }
  getIdsByValue() {
    throw new Error("Method not implemented.");
  }
  getEffectsByValue() {
    throw new Error("Method not implemented.");
  }
}

export class ContinuousHyperparam extends Hyperparam {
  type = HyperparamTypes.Continuous;
  icon = HiHashtag;
  binCount = 5;
  constructor(json: HyperparamJson) {
    const value = json.value as number[];
    super(json.name, json.displayName, value, json.valueType);
    this.scale = d3
      .scaleSequential(d3.interpolateGreys)
      .domain([Math.min(...value), Math.max(...value)]);
  }

  formatting(value: number) {
    const formatter = new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });

    if (this.valueType === "int") {
      return formatter.format(Math.round(value));
    } else {
      return formatter.format(value);
    }
  }
  getColor(index: number) {
    return this.scale(this.values[index]);
  }
  getColorByValue(value: any): string {
    return this.scale(value);
  }

  getIdsByValue() {
    const idsByValue: { [key: string]: number[] } = {};

    const isInteger = this.values.every(Number.isInteger);
    const isSame = this.values.every((val, i, arr) => val === arr[0]);

    // 값들의 최소/최대값 계산
    const xMin = Math.min(...this.values);
    const xMax =
      isInteger && isSame
        ? Math.max(...this.values) + 10
        : isSame
        ? xMin + 0.5
        : Math.max(...this.values);

    const xScale = scaleLinear({
      domain: [xMin, xMax],
      range: [0, 1],
      nice: true,
    });

    const [niceXMin, niceXMax] = xScale.domain();
    const xRange = niceXMax - niceXMin;
    const binSize = xRange / this.binCount;

    // 구간 범위 계산
    const bins = Array.from({ length: this.binCount }, (_, i) => ({
      x0: isInteger
        ? Math.floor(xMin + i * binSize)
        : (xMin + i * binSize).toFixed(2),
      x1: isInteger
        ? Math.floor(xMin + (i + 1) * binSize)
        : (xMin + (i + 1) * binSize).toFixed(2),
      count: 0,
    }));

    this.values.forEach((value, i) => {
      const binIndex = Math.floor((value - niceXMin) / binSize);
      if (binIndex >= 0 && binIndex < this.binCount) {
        bins[binIndex].count += 1;
      } else if (value === xMax) {
        bins[this.binCount - 1].count += 1;
      }
    });

    // 각 구간별 trial id 저장
    bins.forEach((bin, i) => {
      const binIds = [];
      this.values.forEach((value, j) => {
        if (
          (value >= bin.x0 && value < bin.x1) ||
          (i === this.binCount - 1 && value === xMax)
        ) {
          binIds.push(j + 1);
        }
      });
      idsByValue[
        `${formatting(Number(bin.x0), this.valueType)} ~ ${formatting(
          Number(bin.x1),
          this.valueType
        )}`
      ] = binIds;
    });

    return idsByValue;
  }

  getEffectsByValue() {
    const effectsByValue: { [key: string]: number[] } = {}; // 각 구간별 영향력 저장
    const isInteger = this.values.every(Number.isInteger);
    const isSame = this.values.every((val, i, arr) => val === arr[0]);

    // 값들의 최소/최대값 계산
    const xMin = Math.min(...this.values);
    const xMax =
      isInteger && isSame
        ? Math.max(...this.values) + 10
        : isSame
        ? xMin + 0.5
        : Math.max(...this.values);

    const xScale = scaleLinear({
      domain: [xMin, xMax],
      range: [0, 1],
      nice: true,
    });

    const [niceXMin, niceXMax] = xScale.domain();
    const xRange = niceXMax - niceXMin;
    const binSize = xRange / this.binCount;

    // 구간 범위 계산
    const bins = Array.from({ length: this.binCount }, (_, i) => ({
      x0: isInteger
        ? Math.floor(xMin + i * binSize)
        : (xMin + i * binSize).toFixed(2),
      x1: isInteger
        ? Math.floor(xMin + (i + 1) * binSize)
        : (xMin + (i + 1) * binSize).toFixed(2),
      count: 0,
    }));

    this.values.forEach((value, i) => {
      const binIndex = Math.floor((value - niceXMin) / binSize);
      if (binIndex >= 0 && binIndex < this.binCount) {
        bins[binIndex].count += 1;
      } else if (value === xMax) {
        bins[this.binCount - 1].count += 1;
      }
    });

    // 각 구간별 영향력 저장

    bins.forEach((bin, i) => {
      const binShapValues = [];
      this.values.forEach((value, j) => {
        if (
          (value >= bin.x0 && value < bin.x1) ||
          (i === this.binCount - 1 && value === xMax)
        ) {
          binShapValues.push(this.shapValues[j]);
          // binShapValues.push(Math.abs(this.shapValues[j]));
        }
      });
      effectsByValue[
        `${formatting(Number(bin.x0), this.valueType)} ~ ${formatting(
          Number(bin.x1),
          this.valueType
        )}`
      ] = binShapValues;
    });

    return effectsByValue;
  }

  // getEffectByValue() {
  //   let bins = 5; // 구간 수
  //   let effectByValue: { [key: string]: number } = {}; // 각 구간별 영향력 평균 저장
  //   const isInt = this.valueType === "int";

  //   // 값들의 최소/최대값 계산
  //   let min = Math.min(...this.values);
  //   let max = Math.max(...this.values);

  //   // 구간 범위 계산
  //   let step = (max - min) / bins;
  //   let range = Array.from({ length: bins }, (_, i) => min + i * step);
  //   range.push(max);

  //   // 각 구간별 영향력 평균 계산
  //   for (let i = 0; i < bins; i++) {
  //     let start = range[i];
  //     let end = range[i + 1];
  //     let effectSum = 0;
  //     let count = 0;

  //     this.shapValues.forEach((val, index) => {
  //       let value = this.values[index];
  //       if (value >= start && value < end) {
  //         effectSum += val;
  //         count++;
  //       }
  //     });

  //     let effectAvg = count > 0 ? effectSum / count : 0;
  //     let val = isInt
  //       ? Math.round(start) + " ~ " + Math.round(end)
  //       : start.toFixed(2) + " ~ " + end.toFixed(2);
  //     effectByValue[val] = effectAvg;
  //   }

  //   return effectByValue;
  // }
}

export class CategoricalHyperparam extends Hyperparam {
  constructor(json: HyperparamJson) {
    if (json.valueType === "int") {
      const value = (json.value as number[]).sort();
      super(json.name, json.displayName, value, json.valueType);
    } else {
      const value = (json.value as string[]).sort();
      super(json.name, json.displayName, value, json.valueType);
    }
  }
  getColor(index: number) {
    return this.scale(this.values[index]);
  }
  getColorByValue(value: any): string {
    return this.scale(value);
  }

  getIdsByValue() {
    const idsByValue: { [key: string]: number[] } = {};
    this.values.forEach((value, i) => {
      if (idsByValue[value] === undefined) {
        idsByValue[value] = [];
      }
      idsByValue[value].push(i + 1);
    });
    return idsByValue;
  }
  getEffectsByValue() {
    const effectsByValue: { [key: string]: number[] } = {};
    this.values.forEach((value) => {
      effectsByValue[value] = [];
      this.shapValues.forEach((val, index) => {
        if (this.values[index] === value) {
          // effectsByValue[value].push(Math.abs(val));
          effectsByValue[value].push(val);
        }
      });
    });
    return effectsByValue;
  }
}
export class BinaryHyperparam extends CategoricalHyperparam {
  type = HyperparamTypes.Binary;
  icon = RxComponentBoolean;
  constructor(json: HyperparamJson) {
    super(json);
    this.scale = d3
      .scaleOrdinal<string, string>(["#E2E8F0", "#718096"]) // Add the missing type arguments
      .domain(["true", "false"]);
  }
  getColor(index: number): string | undefined {
    return this.scale(
      this.values[index] === "true" || this.values[index] === true
        ? "true"
        : "false"
    );
  }
  getColorByValue(value: any): string {
    return this.scale(value === "true" || value === true ? "true" : "false");
  }
}
export class NominalHyperparam extends CategoricalHyperparam {
  type = HyperparamTypes.Nominal;
  icon = MdCategory;
  constructor(json: HyperparamJson) {
    super(json);
    this.scale = d3
      .scaleOrdinal<string, string>(schemeCategory10) // Add the missing type arguments
      .domain(this.values);
  }
  getColorByValue(value: any): string {
    return this.scale(value);
  }
}
export class OrdinalHyperparam extends CategoricalHyperparam {
  type = HyperparamTypes.Ordinal;
  icon = MdOutlineHdrStrong;
  constructor(json: HyperparamJson) {
    super(json);
    // this.scale = d3
    //   .scaleOrdinal<string, string>([
    //     "rgba(0, 0, 0, 0.2)",
    //     "rgba(0, 0, 0, 0.5)",
    //   ]) // Add the missing type arguments
    //   .domain(this.values);
    // this.scale = scaleLinear<string>()
    //   .domain([Math.min(...domain), Math.max(...domain)])
    //   .range(d3.interpolateGreys);
    const value = json.value as number[];
    this.scale = d3
      .scaleSequential(d3.interpolateGreys)
      .domain([Math.min(...value) - 1, Math.max(...value) + 1]);
  }
  getColorByValue(value: any): string {
    return this.scale(value);
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

// export class BooleanHyperparam extends Hyperparam {
//   readonly type = HyperparamTypes.Boolean;
//   private static readonly scale = scaleOrdinal<boolean, string>()
//     .domain([true, false])
//     .range(["gray", "white"]);

//   constructor(json: HyperparamJson) {
//     const value = json.value as boolean[];
//     super(json.name, json.displayName, value, json.valueType);
//   }

//   getColor(index: number): string {
//     return BooleanHyperparam.scale(this.values[index]);
//   }

//   getEffectByValue(): Record<string, number> {
//     const effectSum: Record<boolean, number> = { true: 0, false: 0 };
//     const count: Record<boolean, number> = { true: 0, false: 0 };

//     this.values.forEach((val, index) => {
//       effectSum[val] += this.shapValues[index];
//       count[val]++;
//     });

//     const effectByValue: Record<string, number> = {
//       true: effectSum[true] / (count[true] || 1),
//       false: effectSum[false] / (count[false] || 1),
//     };

//     return effectByValue;
//   }
// }

// export class ListHyperparam extends Hyperparam {
//   type = HyperparamTypes.List;
//   constructor(json: HyperparamJson) {
//     const value = json.value as number[];
//     super(json.name, json.displayName, value, json.valueType);
//   }
// }

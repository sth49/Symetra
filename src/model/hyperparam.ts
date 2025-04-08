import * as d3 from "d3";
import { schemeSet3 } from "d3";

import { MdCategory } from "react-icons/md";
import { RxComponentBoolean } from "react-icons/rx";
import { MdOutlineHdrStrong } from "react-icons/md";
import { HiHashtag } from "react-icons/hi";

import { scaleLinear } from "@visx/scale";
import { formatting } from "./utils";
export enum HyperparamTypes {
  Continuous,
  // Ordinal,
  // Discrete,
  Binary,
  Nominal,
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
  description: string;
  default: string;
  defaultValue: string | number | boolean;
}

export class Metric {
  constructor(
    public name: string,
    public displayName: string,
    public totalBranch: number = 0,
    public unionSize: number = 0,
    public baseValue: number = 0
  ) {}

  static fromJson(json: Metric, totalBranch: number) {
    return new Metric(
      json.name,
      json.displayName,
      json.totalBranch,
      totalBranch,
      json.baseValue
    );
  }
}

export class Hyperparam {
  public type!: HyperparamTypes;
  public shapValues: number[] = [];
  public values: any[] = [];
  public visible = true;
  public scale: any;
  public icon: any;
  public effectsByValue: any;
  constructor(
    public name: string,
    public displayName: string,
    public value: string[] | number[] | boolean[] | string[][],
    public valueType: string,
    public description: string,
    public defaultString: string,
    public defaultValue: string | number | boolean
  ) {}

  static fromJson(json: HyperparamJson, trialJson) {
    let hparam: Hyperparam;
    if (json.type === "numerical") {
      hparam = new ContinuousHyperparam(json, trialJson);
    } else if (json.type === "categorical") {
      hparam = new NominalHyperparam(json);
    } else if (json.type === "boolean") {
      hparam = new BinaryHyperparam(json);
    } else {
      throw new Error("Invalid hyperparam type");
    }
    trialJson.map((trial) => {
      hparam.values.push(trial.config[hparam.name][0]);
    });

    trialJson.map((trial) => {
      // hparam.shapValues.push(trial.shap_values[hparam.name]);
      hparam.shapValues.push(trial.config[hparam.name][1]);
    });
    if (hparam.getMeanAbsoluteEffect() < 0.3) {
      hparam.visible = false;
    }
    return hparam;
  }
  getColor(index: number): string | undefined {
    throw new Error("Method not implemented.");
  }
  formatting(arg0: any): any {
    throw new Error("Method not implemented.");
  }
  getEffect(trialIds: number[] = []): number {
    if (trialIds.length > 0) {
      const effect = trialIds.reduce(
        (acc, currentValue) => acc + this.shapValues[currentValue],
        0
      );
      if (isNaN(effect)) {
        return 0;
      }
      return effect;
    }
    const effect = this.shapValues.reduce(
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

  getNotification() {
    throw new Error("Method not implemented.");
  }

  getIsDefault(value) {
    throw new Error("Method not implemented.");
  }
}

export class ContinuousHyperparam extends Hyperparam {
  type = HyperparamTypes.Continuous;
  icon = HiHashtag;
  binCount = 5;
  constructor(json: HyperparamJson, trialJson: any) {
    const values = trialJson.map(
      (trial) => trial.config[json.name][0] as number
    );
    const sortedValues = values.sort((a, b) => a - b);
    const value = [sortedValues[0], sortedValues[sortedValues.length - 1]];
    console.log("value", value);
    super(
      json.name,
      json.displayName,
      value,
      json.valueType,
      json.description,
      json.default,
      json.defaultValue
    );

    this.scale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain(this.value as [number, number]);
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

    bins.forEach((bin, i) => {
      const binIds = [];
      this.values.forEach((value, j) => {
        if (
          (value >= bin.x0 && value < bin.x1) ||
          (i === this.binCount - 1 && value === xMax)
        ) {
          binIds.push(j);
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
    const effectsByValue: { [key: string]: number[] } = {};
    const isInteger = this.values.every(Number.isInteger);
    const isSame = this.values.every((val, i, arr) => val === arr[0]);

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

    bins.forEach((bin, i) => {
      const binShapValues = [];
      this.values.forEach((value, j) => {
        if (
          (value >= bin.x0 && value < bin.x1) ||
          (i === this.binCount - 1 && value === xMax)
        ) {
          binShapValues.push(this.shapValues[j]);
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

  getNotification() {
    if (this.defaultValue === null) {
      return false;
    }
    const effectsByValue = this.getEffectsByValue();
    const effectByValue = {};
    for (const key in effectsByValue) {
      let sum = 0;
      effectsByValue[key].forEach((val) => {
        sum += val;
      });
      effectByValue[key] = sum / effectsByValue[key].length;
    }

    const keys = Object.keys(effectByValue);
    let max = -100000;
    let maxKey = "";
    keys.forEach((key) => {
      if (effectByValue[key] > max) {
        max = effectByValue[key];
        maxKey = key;
      }
    });

    const defaultVal = this.defaultValue;
    const defaultBin = keys.find((key) => {
      const [start, end] = key.split(" ~ ");
      if (
        typeof defaultVal === "number" &&
        defaultVal > Number(start.trim().replace(/,/g, "")) &&
        defaultVal <= Number(end.trim().replace(/,/g, ""))
      ) {
        return key;
      }
    });
    if (defaultBin !== maxKey) {
      return true;
    } else {
      return false;
    }
  }

  getIsDefault(value) {
    const [start, end] = value.split(" ~ ");
    const defaultVal = this.defaultValue;

    if (
      typeof defaultVal === "number" &&
      Number(defaultVal) > Number(start.trim().replace(/,/g, "")) &&
      Number(defaultVal) <= Number(end.trim().replace(/,/g, ""))
    ) {
      return true;
    } else {
      return false;
    }
  }
}

export class CategoricalHyperparam extends Hyperparam {
  constructor(json: HyperparamJson) {
    if (json.valueType === "int") {
      const value = (json.value as number[]).sort();
      super(
        json.name,
        json.displayName,
        value,
        json.valueType,
        json.description,
        json.default,
        json.defaultValue
      );
    } else {
      const value = (json.value as string[]).sort();
      super(
        json.name,
        json.displayName,
        value,
        json.valueType,
        json.description,
        json.default,
        json.defaultValue
      );
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
      idsByValue[value].push(i);
    });
    return idsByValue;
  }
  getEffectsByValue() {
    const effectsByValue: { [key: string]: number[] } = {};
    this.values.forEach((value) => {
      effectsByValue[value] = [];
      this.shapValues.forEach((val, index) => {
        if (this.values[index] === value) {
          effectsByValue[value].push(val);
        }
      });
    });
    return effectsByValue;
  }

  getNotification() {
    if (this.defaultValue === null || this.defaultValue === "-") {
      return false;
    }
    const effectsByValue = this.getEffectsByValue();
    const effectByValue = {};
    for (const key in effectsByValue) {
      let sum = 0;
      effectsByValue[key].forEach((val) => {
        sum += val;
      });
      effectByValue[key] = sum / effectsByValue[key].length;
    }

    const keys = Object.keys(effectByValue);
    let max = -100000;
    let maxKey = "";
    keys.forEach((key) => {
      if (effectByValue[key] > max) {
        max = effectByValue[key];
        maxKey = key;
      }
    });

    const defaultVal =
      this.defaultValue === true
        ? "true"
        : this.defaultValue === false
        ? "false"
        : this.defaultValue;

    if (maxKey !== defaultVal) {
      return true;
    } else {
      return false;
    }
  }

  getIsDefault(value) {
    return this.defaultValue === true
      ? value === "true"
      : this.defaultValue === false
      ? value === "false"
      : this.defaultValue === value;
  }
}
export class BinaryHyperparam extends CategoricalHyperparam {
  type = HyperparamTypes.Binary;
  icon = RxComponentBoolean;
  constructor(json: HyperparamJson) {
    super(json);
    this.scale = d3
      .scaleOrdinal<string, string>(["#E2E8F0", "#718096"])
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
      .scaleOrdinal<string, string>(schemeSet3)
      .domain(this.values);
  }
  getColorByValue(value: any): string {
    return this.scale(value);
  }
}

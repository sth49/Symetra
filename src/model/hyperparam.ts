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
  constructor(public name: string) {}

  static fromJson(json: Metric) {
    return new Metric(json.name);
  }
}

export class Hyperparam {
  public type!: HyperparamTypes;
  constructor(
    public name: string,
    public displayName: string,
    public value: unknown,
    public valueType: string
  ) {}

  static fromJson(json: HyperparamJson) {
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
    return hparam;
  }
}

export class NumericalHyperparam extends Hyperparam {
  type = HyperparamTypes.Numerical;
  constructor(json: HyperparamJson) {
    console.log(json);
    super(json.name, json.displayName, json.value, json.valueType);
  }
}

export class CategoricalHyperparam extends Hyperparam {
  type = HyperparamTypes.Categorical;
  constructor(json: HyperparamJson) {
    super(json.name, json.displayName, json.value, json.valueType);
  }
}

export class BooleanHyperparam extends Hyperparam {
  type = HyperparamTypes.Boolean;
  constructor(json: HyperparamJson) {
    super(json.name, json.displayName, json.value, json.valueType);
  }
}
export class ListHyperparam extends Hyperparam {
  type = HyperparamTypes.List;
  constructor(json: HyperparamJson) {
    super(json.name, json.displayName, json.value, json.valueType);
  }
}

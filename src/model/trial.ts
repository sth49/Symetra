export type ParamDict = {
  [name: string]: unknown;
};
export interface TrialJson {
  id: number;
  config: { [name: string]: unknown };
  shap_values: { [name: string]: unknown };
  metric: number;
  umap_x: number;
  umap_y: number;
  branch?: { [name: string]: unknown };
}

export class Trial {
  constructor(
    public id: number,
    public params: ParamDict,
    public metric: number,
    public shapValues: ParamDict,
    // public embedding?: number[],
    public x: number,
    public y: number,

    public branch?: ParamDict
  ) {}
  static fromJson(json: TrialJson) {
    return new Trial(
      json.id,
      json.config,
      json.metric,
      json.shap_values,
      json.umap_x,
      json.umap_y,
      json.branch
    );
  }
}

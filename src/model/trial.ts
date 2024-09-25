export type ParamDict = {
  [name: string]: unknown;
};

export interface TrialJson {
  id: number;
  config: { [name: string]: unknown };
  shap_values: { [name: string]: unknown };
  metric: number;
  umap_positions: { [name: string]: unknown };
  umap_x: number;
  umap_y: number;
}

export class Trial {
  constructor(
    public id: number,
    public params: ParamDict,
    public metric: number,
    public shapValues: ParamDict,
    public umapPositions: ParamDict
  ) {}
  static fromJson(json: TrialJson) {
    return new Trial(
      json.id,
      json.config,
      json.metric,
      json.shap_values,
      json.umap_positions
    );
  }
}

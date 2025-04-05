export type ParamDict = {
  [name: string]: unknown;
};

export interface TrialJson {
  id: number;
  config: { [name: string]: unknown };
  shap_values: { [name: string]: unknown };
  metric: number;
  umap_positions: { [name: string]: unknown };
  // tsne_positions: { [name: string]: unknown };
  umap_x: number;
  umap_y: number;
  branch: number[];
}

export class Trial {
  constructor(
    public id: number,
    public params: ParamDict,
    public metric: number,
    public shapValues: ParamDict,
    public umapPositions: ParamDict,
    // public tsnePositions: ParamDict,
    public branch: Set<number>
  ) {}
  static fromJson(json: TrialJson) {
    return new Trial(
      json.id,
      json.config,
      json.metric,
      json.shap_values,
      json.umap_positions,
      // json.tsne_positions,
      new Set(json.branch)
    );
  }
  branchOneHot(n: number) {
    const oneHot = Array(n).fill(0);
    this.branch.forEach((b) => {
      oneHot[b] = 1;
    });
    return oneHot;
  }
}

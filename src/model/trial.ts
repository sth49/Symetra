export type ParamDict = {
  [name: string]: unknown;
};

export interface TrialJson {
  id: number;
  // 'di' : [true, 0]
  config: { [name: string]: unknown };
  // shap_values: { [name: string]: unknown };
  metric: number;
  // umap_positions: { [name: string]: unknown };
  umap: any[];
  tsne: any[];
  pca: any[];
  // tsne_positions: { [name: string]: unknown };
  branch: number[];
}

export class Trial {
  constructor(
    public id: number,
    public params: ParamDict,
    public metric: number,
    public shapValues: ParamDict,
    public umap: any[],
    public tsne: any[],
    public pca: any[],
    // public tsnePositions: ParamDict,
    public branch: Set<number>
  ) {}
  static fromJson(json: TrialJson) {
    const params = {};
    const shapValues = {};
    Object.keys(json.config).forEach((key) => {
      params[key] = json.config[key];
      params[key] = json.config[key][0];
      shapValues[key] = json.config[key][1];
      // shapValues[key] = json.shap_values[key][1];
    });

    return new Trial(
      json.id,
      // json.config,
      params,
      json.metric,
      shapValues,
      // json.shap_values,
      json.umap,
      json.tsne,
      json.pca,
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

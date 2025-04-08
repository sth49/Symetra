export type ParamDict = {
  [name: string]: unknown;
};

export interface TrialJson {
  id: number;
  config: { [name: string]: unknown };
  metric: number;
  umap: any[];
  tsne: any[];
  pca: any[];
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
    public branch: Set<number>
  ) {}
  static fromJson(json: TrialJson) {
    const params = {};
    const shapValues = {};
    Object.keys(json.config).forEach((key) => {
      params[key] = json.config[key];
      params[key] = json.config[key][0];
      shapValues[key] = json.config[key][1];
    });

    return new Trial(
      json.id,
      params,
      json.metric,
      shapValues,
      json.umap,
      json.tsne,
      json.pca,
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

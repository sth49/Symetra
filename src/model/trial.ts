export type ParamDict = {
  [name: string]: unknown;
};
export interface TrialJson {
  id: number;
  config: { [name: string]: unknown };
  metric: number;
}

export class Trial {
  constructor(
    public id: number,
    public params: ParamDict,
    public metric: number
  ) {}
  static fromJson(json: TrialJson) {
    return new Trial(json.id, json.config, json.metric);
  }
}

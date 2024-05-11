export type ParamDict = {
  [name: string]: unknown;
};

export class Trial {
  constructor(
    public id: number,
    public params: ParamDict,
    public metric: number
  ) {}
  static fromJson(json: any) {
    return new Trial(json.id, json.params, json.metric);
  }
}

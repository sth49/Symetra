export interface ShapValueJson {
  [name: string]: number;
}
export class ShapValue {
  constructor(public values: ShapValueJson) {}
  static fromJson(json: ShapValueJson) {
    return new ShapValue(json);
  }
}

export class TrialPath {
  constructor(
    public id: number,
    public position: {
      top: number;
      left: number;
      width: number;
      height: number;
    },
    public type: string
  ) {}
}

export class TrialPathModel {
  public selectedTrialPath: TrialPath[] = [];
  public hoveredTrialPath: TrialPath | null = null;
  public isScrolling: boolean = false;
  constructor() {}
  public addTrialPath(id, position, type) {
    this.selectedTrialPath.push(new TrialPath(id, position, type));
    this.selectedTrialPath.sort((a, b) => a.id - b.id);
  }
  public removeTrialPath(trialId: number) {
    this.selectedTrialPath = this.selectedTrialPath.filter(
      (path) => path.id !== trialId
    );
  }
  public isInTrialPath(trialId: number) {
    return this.selectedTrialPath.find((path) => path.id === trialId);
  }
  public updateScrolling(isScrolling: boolean) {
    this.isScrolling = isScrolling;
  }
}

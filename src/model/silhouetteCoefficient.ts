import { Hyperparam, HyperparamTypes } from "./hyperparam";
import { Trial } from "./trial";
export function getBranchSilhouetteCoefficient(
  allTrials: Trial[],
  groupTrials: Trial[],
  totalBranch: number
) {
  const allData = allTrials.map((trial) => trial.branchOneHot(totalBranch));
  const data = groupTrials.map((trial) => trial.branchOneHot(totalBranch));

  if (data.length < 2) {
    return 0; // 실루엣 계수를 계산할 수 없음
  }
  // 그룹 내 거리 미리 계산
  const groupDistances = calculateGroupDistances(data);

  // 그룹 외부 포인트 인덱스 미리 계산
  const outsideGroupIndices = allTrials.reduce((indices, trial, index) => {
    if (!groupTrials.includes(trial)) indices.push(index);
    return indices;
  }, [] as number[]);

  let totalSilhouette = 0;

  for (let i = 0; i < data.length; i++) {
    // a 계산: 같은 그룹 내 다른 포인트들과의 평균 거리
    const a =
      (groupDistances[i].reduce((sum, dist) => sum + dist, 0) -
        groupDistances[i][i]) /
      (data.length - 1);

    // b 계산: 그룹 외부의 포인트들과의 최소 평균 거리
    const b = Math.min(
      ...outsideGroupIndices.map((j) => calculateDistance(data[i], allData[j]))
    );

    // 실루엣 계수 계산
    const silhouette = b !== a ? (b - a) / Math.max(a, b) : 0;
    totalSilhouette += silhouette;
  }

  return totalSilhouette / data.length;
}

function calculateGroupDistances(data: number[][]): number[][] {
  const n = data.length;
  const distances = Array(n)
    .fill(null)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const distance = calculateDistance(data[i], data[j]);
      distances[i][j] = distance;
      distances[j][i] = distance;
    }
  }

  return distances;
}

function calculateDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

export function getAttributeSilhouetteCoefficient(
  allTrials: Trial[],
  groupTrials: Trial[],
  hyperparams: Hyperparam[]
) {
  if (groupTrials.length < 2) {
    return 0; // 실루엣 계수를 계산할 수 없음
  }

  const attributeNames = hyperparams.map((hp) => hp.name);
  const attributeTypes = hyperparams.map((hp) => hp.type);
  const distanceFunctions = attributeTypes.map(getDistanceFunction);
  const ranges = calculateAttributeRanges(allTrials, attributeNames);

  let totalSilhouette = 0;

  for (const trial of groupTrials) {
    let a = 0; // 같은 그룹 내의 평균 거리
    let b = Infinity; // 다른 그룹과의 최소 평균 거리

    // a 계산: 같은 그룹 내 다른 포인트들과의 평균 거리
    const sameGroupDistances = groupTrials
      .filter((t) => t !== trial)
      .map((t) =>
        calculateCombinedDistance(
          trial,
          t,
          attributeNames,
          distanceFunctions,
          ranges
        )
      );
    a =
      sameGroupDistances.length > 0
        ? sameGroupDistances.reduce((sum, dist) => sum + dist, 0) /
          sameGroupDistances.length
        : 0;

    // b 계산: 그룹 외부의 포인트들과의 최소 평균 거리
    const otherGroupTrials = allTrials.filter((t) => !groupTrials.includes(t));
    if (otherGroupTrials.length > 0) {
      const otherGroupDistances = otherGroupTrials.map((t) =>
        calculateCombinedDistance(
          trial,
          t,
          attributeNames,
          distanceFunctions,
          ranges
        )
      );
      b = Math.min(...otherGroupDistances);
    }

    // 실루엣 계수 계산
    const silhouette = b !== a ? (b - a) / Math.max(a, b) : 0;
    totalSilhouette += silhouette;
  }

  return totalSilhouette / groupTrials.length;
}

function calculateCombinedDistance(
  trialA: Trial,
  trialB: Trial,
  attributeNames: string[],
  distanceFunctions: ((a: any, b: any) => number)[],
  ranges: Record<string, { min: number; max: number }>
): number {
  const distances = attributeNames.map((name, index) => {
    const distance = distanceFunctions[index](
      trialA.params[name],
      trialB.params[name]
    );
    return ranges[name]
      ? distance / (ranges[name].max - ranges[name].min)
      : distance;
  });
  return distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
}

function getDistanceFunction(
  attributeType: HyperparamTypes
): (a: any, b: any) => number {
  switch (attributeType) {
    case HyperparamTypes.Continuous:
    case HyperparamTypes.Ordinal:
      return (a: number, b: number) => Math.abs(a - b);
    case HyperparamTypes.Nominal:
      return (a: string, b: string) => (a === b ? 0 : 1);
    case HyperparamTypes.Binary:
      return (a: boolean, b: boolean) => (a === b ? 0 : 1);
    default:
      throw new Error(`Unsupported attribute type: ${attributeType}`);
  }
}

function calculateAttributeRanges(
  trials: Trial[],
  attributeNames: string[]
): Record<string, { min: number; max: number }> {
  const ranges: Record<string, { min: number; max: number }> = {};

  for (const name of attributeNames) {
    const values = trials
      .map((trial) => trial.params[name])
      .filter((value) => typeof value === "number");
    if (values.length > 0) {
      ranges[name] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }
  }

  return ranges;
}

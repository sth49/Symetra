import { Hyperparam, HyperparamTypes } from "./hyperparam";
import { Trial } from "./trial";

export function calculateCorrelation(
  groupTrials: Trial[],
  param1: Hyperparam,
  param2: Hyperparam
) {
  const values1 = groupTrials.map((trial) => trial.params[param1.name]);
  const values2 = groupTrials.map((trial) => trial.params[param2.name]);

  console.log(param1, param2);
  console.log(values1, values2);

  if (
    param1.type === HyperparamTypes.Continuous &&
    param2.type === HyperparamTypes.Continuous
  ) {
    // return calculatePearsonCorrelation(
    //   values1 as number[],
    //   values2 as number[]
    // );
  } else if (
    param1.type === HyperparamTypes.Binary &&
    param2.type === HyperparamTypes.Binary
  ) {
    // const table = calculateContingencyTable(
    //   groupTrials,
    //   param1.name,
    //   param2.name
    // );
    // console.log(table);
    // const { phiCoefficient, chiSquare } = calculateCorrelationMetrics(table);
    // // 백분율 계산
    // console.log(phiCoefficient, chiSquare);
    // const percentages = calculatePercentages(table);
    // console.log(percentages);

    const result = calculateCombinationCorrelations(
      groupTrials,
      param1.name,
      param2.name
    );
    console.log(result);

    return result;
  }
  //   } else if (
  //     (param1.type === HyperparamTypes.Nominal ||
  //       param1.type === HyperparamTypes.Binary) &&
  //     (param2.type === HyperparamTypes.Nominal ||
  //       param2.type === HyperparamTypes.Binary)
  //   ) {
  //     console.log("calculateCramerV");
  //     return calculateCramerV(values1, values2);
  //   } else if (
  //     param1.type === HyperparamTypes.Continuous &&
  //     (param2.type === HyperparamTypes.Nominal ||
  //       param2.type === HyperparamTypes.Binary)
  //   ) {
  //     return calculateEtaCorrelation(values1 as number[], values2);
  //   } else if (
  //     (param1.type === HyperparamTypes.Nominal ||
  //       param1.type === HyperparamTypes.Binary) &&
  //     param2.type === HyperparamTypes.Continuous
  //   ) {
  //     return calculateEtaCorrelation(values2 as number[], values1);
  //   } else if (
  //     param1.type === HyperparamTypes.Ordinal &&
  //     param2.type === HyperparamTypes.Ordinal
  //   ) {
  //     return calculateSpearmanCorrelation(
  //       values1 as number[],
  //       values2 as number[]
  //     );
  //   } else {
  //     throw new Error(
  //       "Unsupported parameter type combination for correlation calculation"
  //     );
  //   }
}

export function calculateCombinationCorrelations(
  trials: Trial[],
  param1: string,
  param2: string
) {
  // 각 조합에 대한 이진 벡터 생성
  const combinations = {
    tt: trials.map((trial) => !!trial.params[param1] && !!trial.params[param2]),
    tf: trials.map((trial) => !!trial.params[param1] && !trial.params[param2]),
    ft: trials.map((trial) => !trial.params[param1] && !!trial.params[param2]),
    ff: trials.map((trial) => !trial.params[param1] && !trial.params[param2]),
  };

  console.log(combinations);

  // 성능 메트릭 벡터
  const metrics = trials.map((trial) => trial.metric);

  // 각 조합에 대한 통계 계산
  const correlations = {
    tt: calculatePointBiserialCorrelation(combinations.tt, metrics),
    tf: calculatePointBiserialCorrelation(combinations.tf, metrics),
    ft: calculatePointBiserialCorrelation(combinations.ft, metrics),
    ff: calculatePointBiserialCorrelation(combinations.ff, metrics),
  };

  // 각 조합에 대한 추가 통계
  const statistics = {
    tt: calculateCombinationStatistics(combinations.tt, metrics),
    tf: calculateCombinationStatistics(combinations.tf, metrics),
    ft: calculateCombinationStatistics(combinations.ft, metrics),
    ff: calculateCombinationStatistics(combinations.ff, metrics),
  };

  return { correlations, statistics };
}

function calculatePointBiserialCorrelation(
  binaryVar: boolean[],
  continuousVar: number[]
): number {
  const n = binaryVar.length;

  // 이진 변수의 평균(비율)
  const p = binaryVar.filter((x) => x).length / n;
  const q = 1 - p;

  if (p === 0 || p === 1) return 0; // 모든 값이 같은 경우

  // 연속 변수의 평균과 표준편차
  const meanTotal = mean(continuousVar);
  const stdTotal = standardDeviation(continuousVar);

  if (stdTotal === 0) return 0; // 연속 변수가 모두 같은 경우

  // 이진 변수의 각 그룹에 대한 연속 변수의 평균
  const mean1 = mean(continuousVar.filter((_, i) => binaryVar[i]));
  const mean0 = mean(continuousVar.filter((_, i) => !binaryVar[i]));

  // 점이연상관계수 계산
  return ((mean1 - mean0) * Math.sqrt(p * q)) / stdTotal;
}

function calculateCombinationStatistics(
  binaryVar: boolean[],
  metrics: number[]
) {
  const trueIndices = binaryVar
    .map((v, i) => (v ? i : -1))
    .filter((i) => i !== -1);
  const falseIndices = binaryVar
    .map((v, i) => (!v ? i : -1))
    .filter((i) => i !== -1);

  const trueMetrics = trueIndices.map((i) => metrics[i]);
  const falseMetrics = falseIndices.map((i) => metrics[i]);

  return {
    count: {
      true: trueMetrics.length,
      false: falseMetrics.length,
      total: metrics.length,
    },
    mean: {
      true: mean(trueMetrics),
      false: mean(falseMetrics),
      total: mean(metrics),
    },
    std: {
      true: standardDeviation(trueMetrics),
      false: standardDeviation(falseMetrics),
      total: standardDeviation(metrics),
    },
  };
}

// 헬퍼 함수들
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function standardDeviation(arr: number[]): number {
  if (arr.length === 0) return 0;
  const avg = mean(arr);
  const squareDiffs = arr.map((value) => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

import * as jstat from "jstat";
import { HyperparamTypes } from "./hyperparam";

export interface StatTestResult {
  testType: string;
  statistic: number;
  pValue: number;
  param: any;
}

export function performStatisticalTest(
  group1: any[],
  group2: any[],
  paramType: HyperparamTypes,
  param: any
): StatTestResult {
  //   console.log(group1, group2, paramType);
  switch (paramType) {
    case HyperparamTypes.Continuous:
      return performTTest(group1, group2, param);
    case HyperparamTypes.Nominal:
    case HyperparamTypes.Ordinal:
      return performChiSquareTest(group1, group2, param);
    case HyperparamTypes.Binary:
      return performFisherExactTest(group1, group2, param);
    default:
      throw new Error("Unknown parameter type");
  }
}

function performTTest(
  group1: number[],
  group2: number[],
  param: any
): StatTestResult {
  const mean1 = jstat.mean(group1);
  const mean2 = jstat.mean(group2);
  const var1 = jstat.variance(group1);
  const var2 = jstat.variance(group2);
  const n1 = group1.length;
  const n2 = group2.length;

  const pooledSE = Math.sqrt(var1 / n1 + var2 / n2);
  const tStatistic = (mean1 - mean2) / pooledSE;

  const df = n1 + n2 - 2;
  const pValue = 2 * (1 - jstat.studentt.cdf(Math.abs(tStatistic), df));

  return {
    testType: "T-Test",
    statistic: tStatistic,
    pValue: pValue,
    param: param,
  };
}

function performChiSquareTest(
  group1: any[],
  group2: any[],
  param: any
): StatTestResult {
  // 범주형 데이터의 빈도를 계산합니다.
  const categories = Array.from(new Set([...group1, ...group2]));
  const observed = categories.map((cat) => [
    group1.filter((x) => x === cat).length,
    group2.filter((x) => x === cat).length,
  ]);

  const rowSums = observed.map((row) => row[0] + row[1]);
  const colSums = [
    observed.reduce((sum, row) => sum + row[0], 0),
    observed.reduce((sum, row) => sum + row[1], 0),
  ];
  const total = colSums[0] + colSums[1];

  let chiSquare = 0;
  for (let i = 0; i < observed.length; i++) {
    for (let j = 0; j < 2; j++) {
      const expected = (rowSums[i] * colSums[j]) / total;
      chiSquare += Math.pow(observed[i][j] - expected, 2) / expected;
    }
  }

  const degreesOfFreedom = (observed.length - 1) * (2 - 1);
  const pValue = 1 - jstat.chisquare.cdf(chiSquare, degreesOfFreedom);

  return {
    testType: "Chi-Square Test",
    statistic: chiSquare,
    pValue: pValue,
    param: param,
  };
}

function performFisherExactTest(
  group1: boolean[],
  group2: boolean[],
  param: any
): StatTestResult {
  // Fisher's Exact Test를 위한 2x2 contingency table을 만듭니다.
  const a = group1.filter((x) => x === true).length;
  const b = group2.filter((x) => x === true).length;
  const c = group1.filter((x) => x === false).length;
  const d = group2.filter((x) => x === false).length;

  const n = a + b + c + d;
  const left =
    (jstat.combination(a + b, a) * jstat.combination(c + d, c)) /
    jstat.combination(n, a + c);

  let pValue = 0;
  for (let i = 0; i <= Math.min(a + b, a + c); i++) {
    const p =
      (jstat.combination(a + b, i) * jstat.combination(c + d, a + c - i)) /
      jstat.combination(n, a + c);
    if (p <= left) {
      pValue += p;
    }
  }

  return {
    testType: "Fisher's Exact Test",
    statistic: NaN, // Fisher's Exact Test는 특정 통계량을 사용하지 않습니다
    pValue: pValue,
    param: param,
  };
}

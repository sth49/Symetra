import * as jstat from "jstat";
import { HyperparamTypes } from "./hyperparam";

export interface StatTestResult {
  testType: string;
  statistic: number;
  pValue: number;
  effectSize: number;
  effectSizeType: string;
  effectSizeInterpretation: string;
  interpretationLevel: number;
  significant: boolean;
  param: any;
}

function getStandardizedInterpretation(
  value: number,
  type: string
): { interpretation: string; level: number } {
  if (type === "Cohen's d") {
    if (value < 0.2) {
      return { interpretation: "very small", level: 0 };
    } else if (value < 0.5) {
      return { interpretation: "small", level: 1 };
    } else if (value < 0.8) {
      return { interpretation: "large", level: 2 };
    } else {
      return { interpretation: "very large", level: 3 };
    }
  } else if (type === "Cramer's V") {
    if (value < 0.1) {
      return { interpretation: "very small", level: 0 };
    } else if (value < 0.3) {
      return { interpretation: "small", level: 1 };
    } else if (value < 0.5) {
      return { interpretation: "large", level: 2 };
    } else {
      return { interpretation: "very large", level: 3 };
    }
  } else if (type === "Odds Ratio") {
    if (value < 1) {
      const inverseValue = 1 / value;
      if (inverseValue < 1.5) {
        return { interpretation: "very small", level: 0 };
      } else if (inverseValue < 3) {
        return { interpretation: "small", level: 1 };
      } else if (inverseValue < 5) {
        return { interpretation: "large", level: 2 };
      } else {
        return { interpretation: "very large", level: 3 };
      }
    } else {
      if (value < 1.5) {
        return { interpretation: "very small", level: 0 };
      } else if (value < 3) {
        return { interpretation: "small", level: 1 };
      } else if (value < 5) {
        return { interpretation: "large", level: 2 };
      } else {
        return { interpretation: "very large", level: 3 };
      }
    }
  }

  return { interpretation: "알 수 없음", level: -1 };
}

export function performStatisticalTest(
  group1: any[],
  group2: any[],
  paramType: HyperparamTypes,
  param: any
): StatTestResult {
  if (!group1 || !group2 || group1.length === 0 || group2.length === 0) {
    throw new Error("Both groups must contain data");
  }

  switch (paramType) {
    case HyperparamTypes.Continuous:
      return performTTest(group1, group2, param);
    case HyperparamTypes.Nominal:
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
  const var1 = jstat.variance(group1, true);
  const var2 = jstat.variance(group2, true);
  const n1 = group1.length;
  const n2 = group2.length;

  const pooledSE = Math.sqrt(var1 / n1 + var2 / n2);
  const tStatistic = (mean1 - mean2) / pooledSE;

  const df =
    Math.pow(var1 / n1 + var2 / n2, 2) /
    (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));

  const pValue = 2 * (1 - jstat.studentt.cdf(Math.abs(tStatistic), df));

  const pooledSD = Math.sqrt(
    ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2)
  );
  const cohensD = Math.abs(mean1 - mean2) / pooledSD;

  const effectSizeResult = getStandardizedInterpretation(cohensD, "Cohen's d");

  return {
    testType: "Welch's T-Test",
    statistic: tStatistic,
    pValue: pValue,
    effectSize: cohensD,
    effectSizeType: "Cohen's d",
    effectSizeInterpretation: effectSizeResult.interpretation,
    interpretationLevel: effectSizeResult.level,
    significant: pValue < 0.05,
    param: param,
  };
}

function performChiSquareTest(
  group1: any[],
  group2: any[],
  param: any
): StatTestResult {
  const categories = Array.from(new Set(param.values));
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

  let lowExpectedCells = 0;
  for (let i = 0; i < observed.length; i++) {
    for (let j = 0; j < 2; j++) {
      const expected = (rowSums[i] * colSums[j]) / total;
      if (expected < 5) {
        lowExpectedCells++;
      }
    }
  }

  const totalCells = observed.length * 2;
  const lowExpectedPercentage = (lowExpectedCells / totalCells) * 100;

  let chiSquare = 0;
  for (let i = 0; i < observed.length; i++) {
    for (let j = 0; j < 2; j++) {
      const expected = (rowSums[i] * colSums[j]) / total;
      if (expected > 0) {
        chiSquare += Math.pow(observed[i][j] - expected, 2) / expected;
      } else if (observed[i][j] > 0) {
        chiSquare += Math.pow(observed[i][j], 2) * 10;
      }
    }
  }

  const degreesOfFreedom = (observed.length - 1) * (2 - 1);
  const pValue = 1 - jstat.chisquare.cdf(chiSquare, degreesOfFreedom);

  const minDimension = Math.min(categories.length, 2) - 1;

  let cramersV: number;
  if (minDimension <= 0 || total <= 0 || isNaN(chiSquare)) {
    cramersV = 0;
  } else {
    cramersV = Math.sqrt(chiSquare / (total * minDimension));
    if (isNaN(cramersV)) {
      cramersV = 0;
    }
  }

  // 효과 크기 해석
  const effectSizeResult = getStandardizedInterpretation(
    cramersV,
    "Cramer's V"
  );

  return {
    testType: "Chi-Square Test",
    statistic: chiSquare,
    pValue: pValue,
    effectSize: cramersV,
    effectSizeType: "Cramer's V",
    effectSizeInterpretation: effectSizeResult.interpretation,
    interpretationLevel: effectSizeResult.level,
    significant: pValue < 0.05,
    param: param,
  };
}

function performFisherExactTest(
  group1: boolean[],
  group2: boolean[],
  param: any
): StatTestResult {
  const a = group1.filter((x) => x === true).length;
  const b = group2.filter((x) => x === true).length;
  const c = group1.filter((x) => x === false).length;
  const d = group2.filter((x) => x === false).length;

  const n = a + b + c + d;

  const observedTableProb =
    (jstat.combination(a + b, a) * jstat.combination(c + d, c)) /
    jstat.combination(n, a + c);

  let pValue = 0;

  for (let i = 0; i <= a + b; i++) {
    if (i <= a + b && a + c - i <= c + d && i >= 0 && a + c - i >= 0) {
      const currentProb =
        (jstat.combination(a + b, i) * jstat.combination(c + d, a + c - i)) /
        jstat.combination(n, a + c);

      if (currentProb <= observedTableProb) {
        pValue += currentProb;
      }
    }
  }

  const adjustedA = a + 0.5;
  const adjustedB = b + 0.5;
  const adjustedC = c + 0.5;
  const adjustedD = d + 0.5;

  const oddsRatio = (adjustedA * adjustedD) / (adjustedB * adjustedC);

  const seLogOR = Math.sqrt(
    1 / adjustedA + 1 / adjustedB + 1 / adjustedC + 1 / adjustedD
  );

  const effectSizeResult = getStandardizedInterpretation(
    oddsRatio,
    "Odds Ratio"
  );

  return {
    testType: "Fisher's Exact Test (Two-sided)",
    statistic: NaN,
    pValue: pValue,
    effectSize: oddsRatio,
    effectSizeType: "Odds Ratio",
    effectSizeInterpretation: effectSizeResult.interpretation,
    interpretationLevel: effectSizeResult.level,
    significant: pValue < 0.05,
    param: param,
  };
}

export function rankParameterDifferences(
  parameters: { name: string; type: HyperparamTypes }[],
  groupA: any[],
  groupB: any[]
): { param: string; result: StatTestResult; score: number }[] {
  const results = [];

  for (const param of parameters) {
    const valuesA = groupA.map((item) => item[param.name]);
    const valuesB = groupB.map((item) => item[param.name]);

    const testResult = performStatisticalTest(
      valuesA,
      valuesB,
      param.type,
      param.name
    );
    const significanceWeight = testResult.significant ? 1 : 0.3;

    const normalizedScore = testResult.interpretationLevel * significanceWeight;

    results.push({
      param: param.name,
      result: testResult,
      score: normalizedScore,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}
export function getDistributionSummary(
  group1: any[],
  group2: any[],
  paramType: HyperparamTypes
) {
  if (paramType === HyperparamTypes.Continuous) {
    return {
      group1: {
        mean: jstat.mean(group1),
        median: jstat.median(group1),
        stdDev: Math.sqrt(jstat.variance(group1, true)),
        min: Math.min(...group1),
        max: Math.max(...group1),
        q1: jstat.quantiles(group1, [0.25])[0],
        q3: jstat.quantiles(group1, [0.75])[0],
        size: group1.length,
      },
      group2: {
        mean: jstat.mean(group2),
        median: jstat.median(group2),
        stdDev: Math.sqrt(jstat.variance(group2, true)),
        min: Math.min(...group2),
        max: Math.max(...group2),
        q1: jstat.quantiles(group2, [0.25])[0],
        q3: jstat.quantiles(group2, [0.75])[0],
        size: group2.length,
      },
    };
  } else if (paramType === HyperparamTypes.Binary) {
    const trueCount1 = group1.filter((x) => x === true).length;
    const trueCount2 = group2.filter((x) => x === true).length;

    return {
      group1: {
        trueCount: trueCount1,
        falseCount: group1.length - trueCount1,
        truePercentage: (trueCount1 / group1.length) * 100,
        size: group1.length,
      },
      group2: {
        trueCount: trueCount2,
        falseCount: group2.length - trueCount2,
        truePercentage: (trueCount2 / group2.length) * 100,
        size: group2.length,
      },
    };
  } else {
    const categories = Array.from(new Set([...group1, ...group2]));
    const group1Summary = {};
    const group2Summary = {};

    for (const cat of categories) {
      const count1 = group1.filter((x) => x === cat).length;
      const count2 = group2.filter((x) => x === cat).length;

      group1Summary[cat] = {
        count: count1,
        percentage: (count1 / group1.length) * 100,
      };

      group2Summary[cat] = {
        count: count2,
        percentage: (count2 / group2.length) * 100,
      };
    }

    return {
      categories,
      group1: {
        categoryCounts: group1Summary,
        size: group1.length,
      },
      group2: {
        categoryCounts: group2Summary,
        size: group2.length,
      },
    };
  }
}

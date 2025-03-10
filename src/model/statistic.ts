import * as jstat from "jstat";
import { HyperparamTypes } from "./hyperparam";

export interface StatTestResult {
  testType: string;
  statistic: number;
  pValue: number;
  effectSize: number;
  effectSizeType: string;
  effectSizeInterpretation: string;
  interpretationLevel: number; // 0-3 또는 0-4 (단계에 따라)
  significant: boolean;
  param: any;
}

// 효과 크기 해석 단계를 표준화하는 함수
function getStandardizedInterpretation(
  value: number,
  type: string
): { interpretation: string; level: number } {
  // 모든 효과 크기에 대해 4단계로 표준화
  if (type === "Cohen's d") {
    if (value < 0.2) {
      return { interpretation: "매우 작은 차이", level: 0 };
    } else if (value < 0.5) {
      return { interpretation: "작은 차이", level: 1 };
    } else if (value < 0.8) {
      return { interpretation: "중간 차이", level: 2 };
    } else {
      return { interpretation: "큰 차이", level: 3 };
    }
  } else if (type === "Cramer's V") {
    if (value < 0.1) {
      return { interpretation: "매우 작은 연관성", level: 0 };
    } else if (value < 0.3) {
      return { interpretation: "작은 연관성", level: 1 };
    } else if (value < 0.5) {
      return { interpretation: "중간 연관성", level: 2 };
    } else {
      return { interpretation: "큰 연관성", level: 3 };
    }
  } else if (type === "Odds Ratio") {
    // 오즈비는 1을 기준으로 하므로 특별히 처리
    if (value < 1) {
      // 역수를 취해 1보다 큰 값으로 변환하여 해석
      const inverseValue = 1 / value;
      if (inverseValue < 1.5) {
        return { interpretation: "매우 작은 효과", level: 0 };
      } else if (inverseValue < 3) {
        return { interpretation: "작은 효과", level: 1 };
      } else if (inverseValue < 5) {
        return { interpretation: "중간 효과", level: 2 };
      } else {
        return { interpretation: "큰 효과", level: 3 };
      }
    } else {
      if (value < 1.5) {
        return { interpretation: "매우 작은 효과", level: 0 };
      } else if (value < 3) {
        return { interpretation: "작은 효과", level: 1 };
      } else if (value < 5) {
        return { interpretation: "중간 효과", level: 2 };
      } else {
        return { interpretation: "큰 효과", level: 3 };
      }
    }
  }

  // 기본 반환값
  return { interpretation: "알 수 없음", level: -1 };
}

export function performStatisticalTest(
  group1: any[],
  group2: any[],
  paramType: HyperparamTypes,
  param: any
): StatTestResult {
  // 입력 데이터 유효성 검사 추가
  if (!group1 || !group2 || group1.length === 0 || group2.length === 0) {
    throw new Error("Both groups must contain data");
  }

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

function performTTest2(
  group1: number[],
  group2: number[],
  param: any
): StatTestResult {
  const mean1 = jstat.mean(group1);
  const mean2 = jstat.mean(group2);
  const var1 = jstat.variance(group1, true); // 표본 분산 사용
  const var2 = jstat.variance(group2, true); // 표본 분산 사용
  const n1 = group1.length;
  const n2 = group2.length;

  // Welch's t-test 사용 (분산이 다를 때 더 적합)
  const pooledSE = Math.sqrt(var1 / n1 + var2 / n2); // 표준 오차 계산
  const tStatistic = (mean1 - mean2) / pooledSE; // t-통계량 계산

  // Welch's t-test에 맞는 자유도 계산
  const df =
    Math.pow(var1 / n1 + var2 / n2, 2) /
    (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));

  // p-값 계산 (양측 검정)
  const pValue = 2 * (1 - jstat.studentt.cdf(Math.abs(tStatistic), df));

  // Cohen's d 효과 크기 계산
  const pooledSD = Math.sqrt(
    ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2)
  );
  const cohensD = Math.abs(mean1 - mean2) / pooledSD;

  // 효과 크기 해석
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

function performTTest(
  group1: number[],
  group2: number[],
  param: any
): StatTestResult {
  const mean1 = jstat.mean(group1);
  const mean2 = jstat.mean(group2);
  const var1 = jstat.variance(group1, true); // 표본 분산 사용
  const var2 = jstat.variance(group2, true); // 표본 분산 사용
  const n1 = group1.length;
  const n2 = group2.length;

  // Welch's t-test 사용 (분산이 다를 때 더 적합)
  const pooledSE = Math.sqrt(var1 / n1 + var2 / n2);
  const tStatistic = (mean1 - mean2) / pooledSE;

  // Welch's t-test에 맞는 자유도 계산
  const df =
    Math.pow(var1 / n1 + var2 / n2, 2) /
    (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));

  const pValue = 2 * (1 - jstat.studentt.cdf(Math.abs(tStatistic), df));

  // Cohen's d 효과 크기 계산
  // 통합 표준편차 계산 (가중치 적용)
  const pooledSD = Math.sqrt(
    ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2)
  );
  const cohensD = Math.abs(mean1 - mean2) / pooledSD;

  // 효과 크기 해석
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
  // 범주형 데이터의 빈도를 계산합니다.

  const categories = Array.from(new Set(param.values));
  const observed = categories.map((cat) => [
    group1.filter((x) => x === cat).length,
    group2.filter((x) => x === cat).length,
  ]);

  // if (param.name === "smtlib-display-constants") {
  //   console.log("Group1: ", group1);
  //   console.log("Group2: ", group2);

  //   console.log("Categories: ", categories);
  //   console.log("Observed: ", observed);
  // }

  const rowSums = observed.map((row) => row[0] + row[1]);
  const colSums = [
    observed.reduce((sum, row) => sum + row[0], 0),
    observed.reduce((sum, row) => sum + row[1], 0),
  ];
  const total = colSums[0] + colSums[1];

  // 예상 빈도가 5 미만인 셀이 있는지 확인 (통계학적 권장사항)
  let lowExpectedCells = 0;
  for (let i = 0; i < observed.length; i++) {
    for (let j = 0; j < 2; j++) {
      const expected = (rowSums[i] * colSums[j]) / total;
      if (expected < 5) {
        lowExpectedCells++;
      }
    }
  }

  // 예상 빈도가 낮은 셀이 20% 이상이면 경고 또는 Fisher's Exact Test 사용 권장
  const totalCells = observed.length * 2;
  const lowExpectedPercentage = (lowExpectedCells / totalCells) * 100;

  let chiSquare = 0;
  for (let i = 0; i < observed.length; i++) {
    for (let j = 0; j < 2; j++) {
      const expected = (rowSums[i] * colSums[j]) / total;
      // 0으로 나누는 상황 방지
      if (expected > 0) {
        chiSquare += Math.pow(observed[i][j] - expected, 2) / expected;
      } else if (observed[i][j] > 0) {
        // 예상 빈도는 0인데 관측 빈도가 0이 아닌 경우
        // 이론적으로 불가능한 상황이므로 큰 값 추가
        chiSquare += Math.pow(observed[i][j], 2) * 10;
      }
      // 관측값과 예상값이 모두 0인 경우는 카이제곱에 기여하지 않음
    }
  }

  const degreesOfFreedom = (observed.length - 1) * (2 - 1);
  const pValue = 1 - jstat.chisquare.cdf(chiSquare, degreesOfFreedom);

  // Cramer's V 효과 크기 계산 - NaN 처리 추가
  const minDimension = Math.min(categories.length, 2) - 1;

  // NaN 방지를 위한 안전 장치 추가
  let cramersV: number;
  if (minDimension <= 0 || total <= 0 || isNaN(chiSquare)) {
    cramersV = 0; // 계산할 수 없는 경우 0으로 처리
    console.log(
      `경고: Cramer's V 계산 불가 (minDimension=${minDimension}, total=${total}, chiSquare=${chiSquare})`
    );
  } else {
    cramersV = Math.sqrt(chiSquare / (total * minDimension));
    // 계산 결과가 NaN인 경우 처리
    if (isNaN(cramersV)) {
      cramersV = 0;
      console.log(`경고: Cramer's V 계산 결과가 NaN입니다. 0으로 처리합니다.`);
    }
  }

  // 효과 크기 해석
  const effectSizeResult = getStandardizedInterpretation(
    cramersV,
    "Cramer's V"
  );

  if (param.name === "smtlib-display-constants") {
    console.log("Chi-Square: ", chiSquare);
    console.log("P-Value: ", pValue);
    console.log("Cramer's V: ", cramersV);
  }

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
  // Fisher's Exact Test를 위한 2x2 contingency table을 만듭니다.
  const a = group1.filter((x) => x === true).length;
  const b = group2.filter((x) => x === true).length;
  const c = group1.filter((x) => x === false).length;
  const d = group2.filter((x) => x === false).length;

  const n = a + b + c + d;

  // 관찰된 테이블의 확률 계산
  const observedTableProb =
    (jstat.combination(a + b, a) * jstat.combination(c + d, c)) /
    jstat.combination(n, a + c);

  // 양방향 Fisher Exact Test 구현
  let pValue = 0;

  // 가능한 모든 테이블 구성에 대해 계산
  for (let i = 0; i <= a + b; i++) {
    // i가 첫 번째 셀의 값을 나타냄
    // 나머지 셀들의 값은 행/열 합계에 의해 결정됨
    if (i <= a + b && a + c - i <= c + d && i >= 0 && a + c - i >= 0) {
      const currentProb =
        (jstat.combination(a + b, i) * jstat.combination(c + d, a + c - i)) /
        jstat.combination(n, a + c);

      // 양방향 테스트: 관찰된 테이블과 같거나 더 극단적인 경우
      if (currentProb <= observedTableProb) {
        pValue += currentProb;
      }
    }
  }

  // 오즈비(Odds Ratio) 계산 - 이진 데이터의 효과 크기 지표
  // 0으로 나누는 것을 방지하기 위해 Haldane 보정 적용
  const adjustedA = a + 0.5;
  const adjustedB = b + 0.5;
  const adjustedC = c + 0.5;
  const adjustedD = d + 0.5;

  const oddsRatio = (adjustedA * adjustedD) / (adjustedB * adjustedC);

  // ln(OR)의 표준 오차 계산
  const seLogOR = Math.sqrt(
    1 / adjustedA + 1 / adjustedB + 1 / adjustedC + 1 / adjustedD
  );

  // 95% 신뢰 구간 계산
  const ci95Low = Math.exp(Math.log(oddsRatio) - 1.96 * seLogOR);
  const ci95High = Math.exp(Math.log(oddsRatio) + 1.96 * seLogOR);

  // 효과 크기 해석
  const effectSizeResult = getStandardizedInterpretation(
    oddsRatio,
    "Odds Ratio"
  );

  return {
    testType: "Fisher's Exact Test (Two-sided)",
    statistic: NaN, // Fisher's Exact Test는 특정 통계량을 사용하지 않습니다
    pValue: pValue,
    effectSize: oddsRatio,
    effectSizeType: "Odds Ratio",
    effectSizeInterpretation: effectSizeResult.interpretation,
    interpretationLevel: effectSizeResult.level,
    significant: pValue < 0.05,
    param: param,
  };
}

// 분포 차이를 순위로 정렬하기 위한 함수
export function rankParameterDifferences(
  parameters: { name: string; type: HyperparamTypes }[],
  groupA: any[],
  groupB: any[]
): { param: string; result: StatTestResult; score: number }[] {
  const results = [];

  for (const param of parameters) {
    // 각 그룹에서 해당 파라미터의 값을 추출
    const valuesA = groupA.map((item) => item[param.name]);
    const valuesB = groupB.map((item) => item[param.name]);

    // 통계 검정 수행
    const testResult = performStatisticalTest(
      valuesA,
      valuesB,
      param.type,
      param.name
    );

    // 효과 크기와 유의성을 모두 고려한 점수
    // 통계적으로 유의미하면 효과 크기에 가중치를 더 줌
    const significanceWeight = testResult.significant ? 1 : 0.3;

    // 표준화된 점수 계산 (모든 효과 크기 타입에 대해 0-3 범위로 정규화)
    const normalizedScore = testResult.interpretationLevel * significanceWeight;

    results.push({
      param: param.name,
      result: testResult,
      score: normalizedScore,
    });
  }

  // 차이가 큰 순서대로 정렬
  return results.sort((a, b) => b.score - a.score);
}

// 두 분포의 요약 통계 생성 함수
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
    // 범주형(Nominal, Ordinal) 데이터
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

import { Hyperparam, HyperparamTypes } from "./hyperparam";
import { Trial } from "./trial";

function removeOutlierPairs(
  values1: number[],
  values2: number[]
): [number[], number[]] {
  // Sort values while keeping track of original indices
  const indexedValues1 = values1.map((value, index) => ({ value, index }));
  const indexedValues2 = values2.map((value, index) => ({ value, index }));

  // Calculate Q1, Q3, IQR for values1
  const sorted1 = [...indexedValues1].sort((a, b) => a.value - b.value);
  const q1_1 = sorted1[Math.floor(sorted1.length * 0.25)].value;
  const q3_1 = sorted1[Math.floor(sorted1.length * 0.75)].value;
  const iqr1 = q3_1 - q1_1;
  const lowerBound1 = q1_1 - 1.5 * iqr1;
  const upperBound1 = q3_1 + 1.5 * iqr1;

  // Calculate Q1, Q3, IQR for values2
  const sorted2 = [...indexedValues2].sort((a, b) => a.value - b.value);
  const q1_2 = sorted2[Math.floor(sorted2.length * 0.25)].value;
  const q3_2 = sorted2[Math.floor(sorted2.length * 0.75)].value;
  const iqr2 = q3_2 - q1_2;
  const lowerBound2 = q1_2 - 1.5 * iqr2;
  const upperBound2 = q3_2 + 1.5 * iqr2;

  // Create arrays for valid pairs
  const validValues1: number[] = [];
  const validValues2: number[] = [];

  // Only keep pairs where both values are within bounds
  for (let i = 0; i < values1.length; i++) {
    const val1 = values1[i];
    const val2 = values2[i];

    if (
      val1 >= lowerBound1 &&
      val1 <= upperBound1 &&
      val2 >= lowerBound2 &&
      val2 <= upperBound2
    ) {
      validValues1.push(val1);
      validValues2.push(val2);
    }
  }

  return [validValues1, validValues2];
}

export function calculateCorrelation(
  groupTrials: Trial[],
  param1: Hyperparam,
  param2: Hyperparam,
  removeOutliers: boolean = false
) {
  const values1 = groupTrials.map((trial) => trial.params[param1.name]);
  const values2 = groupTrials.map((trial) => trial.params[param2.name]);

  if (
    param1.type === HyperparamTypes.Continuous &&
    param2.type === HyperparamTypes.Continuous
  ) {
    let cleanValues1 = values1 as number[];
    let cleanValues2 = values2 as number[];

    if (removeOutliers) {
      [cleanValues1, cleanValues2] = removeOutlierPairs(
        cleanValues1,
        cleanValues2
      );
    }

    return calculatePearsonCorrelation(
      param1,
      param2,
      cleanValues1,
      cleanValues2
    );
  } else if (
    param1.type === HyperparamTypes.Binary &&
    param2.type === HyperparamTypes.Binary
  ) {
    return calculatePhiCoefficient(param1, param2, values1, values2);
  } else if (
    (param1.type === HyperparamTypes.Continuous &&
      param2.type === HyperparamTypes.Binary) ||
    (param1.type === HyperparamTypes.Binary &&
      param2.type === HyperparamTypes.Continuous)
  ) {
    const [contParam, binParam] =
      param1.type === HyperparamTypes.Continuous
        ? [param1, param2]
        : [param2, param1];
    const [contValues, binValues] =
      param1.type === HyperparamTypes.Continuous
        ? [values1 as number[], values2]
        : [values2 as number[], values1];

    let cleanContValues = contValues;
    let cleanBinValues = binValues;

    if (removeOutliers) {
      // Handle outlier removal for continuous values while maintaining corresponding binary values
      let validPairs = removeOutlierPairs(
        contValues,
        binValues.map(Number) // Convert binary values to numbers temporarily
      );
      cleanContValues = validPairs[0];
      cleanBinValues = validPairs[1].map((num) => Boolean(num)); // Convert back to boolean
    }

    return calculatePointBiserialCorrelation(
      contParam,
      binParam,
      cleanContValues,
      cleanBinValues
    );
  }
}
// export function calculateCorrelation(
//   groupTrials: Trial[],
//   param1: Hyperparam,
//   param2: Hyperparam
// ) {
//   const values1 = groupTrials.map((trial) => trial.params[param1.name]);
//   const values2 = groupTrials.map((trial) => trial.params[param2.name]);

//   if (
//     param1.type === HyperparamTypes.Continuous &&
//     param2.type === HyperparamTypes.Continuous
//   ) {
//     return calculatePearsonCorrelation(
//       param1,
//       param2,
//       values1 as number[],
//       values2 as number[]
//     );
//   } else if (
//     param1.type === HyperparamTypes.Binary &&
//     param2.type === HyperparamTypes.Binary
//   ) {
//     return calculatePhiCoefficient(param1, param2, values1, values2);
//   } else if (
//     (param1.type === HyperparamTypes.Continuous &&
//       param2.type === HyperparamTypes.Binary) ||
//     (param1.type === HyperparamTypes.Binary &&
//       param2.type === HyperparamTypes.Continuous)
//   ) {
//     // Point-biserial correlation을 위해 continuous와 binary 변수의 순서 확인
//     const [contParam, binParam] =
//       param1.type === HyperparamTypes.Continuous
//         ? [param1, param2]
//         : [param2, param1];
//     const [contValues, binValues] =
//       param1.type === HyperparamTypes.Continuous
//         ? [values1 as number[], values2]
//         : [values2 as number[], values1];

//     return calculatePointBiserialCorrelation(
//       contParam,
//       binParam,
//       contValues,
//       binValues
//     );
//   }
// }

function calculatePointBiserialCorrelation(
  contParam: Hyperparam,
  binParam: Hyperparam,
  contValues: number[],
  binValues: any[]
) {
  // 이진 변수의 고유값 찾기
  const uniqueBinValues = Array.from(new Set(binValues));

  // 각 이진값에 대한 연속 변수 그룹 분리
  const group1Values = contValues.filter(
    (_, i) => binValues[i] === uniqueBinValues[0]
  );
  const group2Values = contValues.filter(
    (_, i) => binValues[i] === uniqueBinValues[1]
  );

  // 전체 연속 변수 평균 및 표준편차 계산
  const mean =
    contValues.reduce((sum, val) => sum + val, 0) / contValues.length;

  const variance =
    contValues.reduce((sum, val) => {
      const diff = val - mean;
      return sum + diff * diff;
    }, 0) / contValues.length;

  const stdDev = Math.sqrt(variance);

  // 각 그룹의 평균 계산
  const mean1 =
    group1Values.reduce((sum, val) => sum + val, 0) / group1Values.length;
  const mean2 =
    group2Values.reduce((sum, val) => sum + val, 0) / group2Values.length;

  // 각 그룹의 비율 계산
  const p = group1Values.length / contValues.length;
  const q = 1 - p;

  // Point-biserial correlation 계산
  const rpb = ((mean1 - mean2) / stdDev) * Math.sqrt(p * q);

  return {
    correlation: Math.max(-1, Math.min(1, Math.round(rpb * 1000) / 1000)),
    type: "point-biserial",
    hp: {
      hp1: binParam,
      hp2: contParam,
      // continuous: contParam,
      // binary: binParam,
    },
    value: {
      val1: binValues,
      val2: contValues,
    },
  };
}

function calculatePearsonCorrelation(
  param1: Hyperparam,
  param2: Hyperparam,
  values1: number[],
  values2: number[]
) {
  if (values1.length !== values2.length) {
    throw new Error("Arrays must have the same length");
  }

  const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
  const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;

  let covariance = 0;
  let variance1 = 0;
  let variance2 = 0;

  for (let i = 0; i < values1.length; i++) {
    const diff1 = values1[i] - mean1;
    const diff2 = values2[i] - mean2;

    covariance += diff1 * diff2;
    variance1 += diff1 * diff1;
    variance2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(variance1 * variance2);

  if (denominator === 0) {
    return variance1 === 0 && variance2 === 0 ? 1 : 0;
  }

  const correlation = covariance / denominator;

  return {
    correlation: Math.max(
      -1,
      Math.min(1, Math.round(correlation * 1000) / 1000)
    ),
    type: "pearson",
    hp: {
      hp1: param1,
      hp2: param2,
    },
    value: {
      val1: values1,
      val2: values2,
    },
  };
}

function calculatePhiCoefficient(
  param1: Hyperparam,
  param2: Hyperparam,
  values1: any[],
  values2: any[]
) {
  const uniqueValues1 = Array.from(new Set(values1));
  const uniqueValues2 = Array.from(new Set(values2));

  let n11 = 0;
  let n12 = 0;
  let n21 = 0;
  let n22 = 0;

  for (let i = 0; i < values1.length; i++) {
    if (values1[i] === uniqueValues1[0] && values2[i] === uniqueValues2[0]) {
      n11++;
    } else if (
      values1[i] === uniqueValues1[0] &&
      values2[i] === uniqueValues2[1]
    ) {
      n12++;
    } else if (
      values1[i] === uniqueValues1[1] &&
      values2[i] === uniqueValues2[0]
    ) {
      n21++;
    } else {
      n22++;
    }
  }

  const r1 = n11 + n12;
  const r2 = n21 + n22;
  const c1 = n11 + n21;
  const c2 = n12 + n22;
  const n = values1.length;

  const phi = (n11 * n22 - n12 * n21) / Math.sqrt(r1 * r2 * c1 * c2);

  const bins = ["T", "F"].map((bin1) => {
    return {
      bin: bin1,
      bins: ["T", "F"].map((bin2) => {
        return {
          bin: bin2,
          count: eval(`n${bin1 === "T" ? 1 : 2}${bin2 === "T" ? 1 : 2}`),
          name: `${param1.name}=${bin1}, ${param2.name}=${bin2}`,
        };
      }),
    };
  });

  return {
    correlation: phi,
    type: "phi",
    hp: {
      hp1: param1,
      hp2: param2,
    },
    value: {
      bins,
    },
  };
}

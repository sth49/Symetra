import { Hyperparam, HyperparamTypes } from "./hyperparam";
import { Trial } from "./trial";

export function calculateCorrelation(
  groupTrials: Trial[],
  param1: Hyperparam,
  param2: Hyperparam
): number {
  const values1 = groupTrials.map((trial) => trial.params[param1.name]);
  const values2 = groupTrials.map((trial) => trial.params[param2.name]);

  console.log(param1, param2);
  console.log(values1, values2);

  if (
    param1.type === HyperparamTypes.Continuous &&
    param2.type === HyperparamTypes.Continuous
  ) {
    return calculatePearsonCorrelation(
      values1 as number[],
      values2 as number[]
    );
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

function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  return numerator / denominator;
}

function calculateCramerV(x: any[], y: any[]): number {
  const contingencyTable = createContingencyTable(x, y);
  const chi2 = calculateChi2(contingencyTable);
  const n = x.length;
  const minDim = Math.min(new Set(x).size, new Set(y).size) - 1;

  return Math.sqrt(chi2 / (n * minDim));
}

function calculateEtaCorrelation(
  numerical: number[],
  categorical: any[]
): number {
  const categories = Array.from(new Set(categorical));
  const totalMean =
    numerical.reduce((sum, val) => sum + val, 0) / numerical.length;

  let ssb = 0; // Sum of squares between groups
  let sst = 0; // Total sum of squares

  categories.forEach((category) => {
    const groupValues = numerical.filter((_, i) => categorical[i] === category);
    const groupMean =
      groupValues.reduce((sum, val) => sum + val, 0) / groupValues.length;
    ssb += groupValues.length * Math.pow(groupMean - totalMean, 2);
  });

  numerical.forEach((val) => {
    sst += Math.pow(val - totalMean, 2);
  });

  return Math.sqrt(ssb / sst);
}

function calculateSpearmanCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const xRanks = rankData(x);
  const yRanks = rankData(y);

  return calculatePearsonCorrelation(xRanks, yRanks);
}

function rankData(data: number[]): number[] {
  const sorted = data.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    ranks[sorted[i].i] = i + 1;
  }
  return ranks;
}

function createContingencyTable(x: any[], y: any[]): number[][] {
  const xCategories = Array.from(new Set(x));
  const yCategories = Array.from(new Set(y));
  const table = Array(xCategories.length)
    .fill(0)
    .map(() => Array(yCategories.length).fill(0));

  for (let i = 0; i < x.length; i++) {
    const xIndex = xCategories.indexOf(x[i]);
    const yIndex = yCategories.indexOf(y[i]);
    table[xIndex][yIndex]++;
  }

  return table;
}

function calculateChi2(table: number[][]): number {
  const rowSums = table.map((row) => row.reduce((sum, cell) => sum + cell, 0));
  const colSums = table[0].map((_, i) =>
    table.reduce((sum, row) => sum + row[i], 0)
  );
  const total = rowSums.reduce((sum, val) => sum + val, 0);

  let chi2 = 0;
  for (let i = 0; i < table.length; i++) {
    for (let j = 0; j < table[i].length; j++) {
      const expected = (rowSums[i] * colSums[j]) / total;
      chi2 += Math.pow(table[i][j] - expected, 2) / expected;
    }
  }

  return chi2;
}

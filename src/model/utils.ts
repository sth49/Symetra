import * as d3 from "d3";

export interface BinData {
  value: number;
  count: number;
}

export const generateBinnedData = (
  points: number[],
  width: number,
  height: number,
  axis: string
) => {
  points.sort((a, b) => a - b);
  const sampleSize = points.length;
  const firstQuartile = points[Math.floor(sampleSize / 4)];
  const thirdQuartile = points[Math.floor((sampleSize * 3) / 4)];
  const IQR = thirdQuartile - firstQuartile;
  let min = Math.min(...points);
  let max = Math.max(...points);
  console.log("min", min);
  console.log("max", max);

  const outliers = points.filter((p) => p < min || p > max);
  if (outliers.length === 0) {
    min = Math.min(...points);
    max = Math.max(...points);
  }
  const binWidth = 2 * IQR * (sampleSize - outliers.length) ** (-1 / 3) || 1;
  const binNum = Math.round((max - min) / binWidth);
  console.log("binNum", binNum);
  const actualBinWidth = (max - min) / binNum;
  const bins: number[] = new Array(binNum + 2).fill(0);
  const values: number[] = new Array(binNum + 2).fill(min);
  for (let ii = 1; ii <= binNum; ii += 1) {
    values[ii] += actualBinWidth * (ii - 0.5);
  }
  values[values.length - 1] = max;

  points
    .filter((p) => p >= min && p <= max)
    .forEach((p) => {
      bins[Math.floor((p - min) / actualBinWidth) + 1] += 1;
    });

  const binData: BinData[] = values.map((v: number, index) => ({
    value: v,
    count: bins[index],
  }));

  if (axis === "x") {
    const xScale = d3.scaleLinear().range([0, width]).domain([min, max]);
    return { binData, xScale };
  } else {
    const yScale = d3.scaleLinear().range([height, 0]).domain([min, max]);
    return { binData, yScale };
  }
};

// export const formatting = (value: number, isInt: boolean) => {
//   return isInt ? Math.round(value) : value.toFixed(2);
// };

export const formatting = (
  value: number,
  valueType: string,
  digit: number = 1
) => {
  const formatter = new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digit,
  });

  if (valueType === "int") {
    return formatter.format(Math.round(value));
  } else {
    return formatter.format(value);
  }
};

export function decimalToBinary(decimal: bigint, bitLength: number): string {
  const binary = decimal.toString(2);
  return binary.padStart(bitLength, "0");
}

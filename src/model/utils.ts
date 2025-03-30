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
  if (points.length === 0) {
    return { binData: [], xScale: null };
  }
  points.sort((a, b) => a - b);
  const sampleSize = points.length;
  const firstQuartile = points[Math.floor(sampleSize / 4)];
  const thirdQuartile = points[Math.floor((sampleSize * 3) / 4)];
  const IQR = thirdQuartile - firstQuartile;
  let min = Math.min(...points);
  let max = Math.max(...points);

  const outliers = points.filter((p) => p < min || p > max);
  if (outliers.length === 0) {
    min = Math.min(...points);
    max = Math.max(...points);
  }
  const binWidth = 2 * IQR * (sampleSize - outliers.length) ** (-1 / 3) || 1;
  const binNum = Math.round((max - min) / binWidth);
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

export const formatting = (
  value: number,
  valueType: string,
  digit: number = 1
) => {
  const formatter = new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: valueType === "int" ? 0 : digit,
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

export function rgbaFromHex(hex: string, opacity: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
export function hexToRgb(hex: string): number[] {
  const cleanHex = hex.replace("#", "");

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return [r, g, b];
}

export const getLuminance = (color) => {
  let r, g, b;

  if (color.startsWith("rgb")) {
    [r, g, b] = color.match(/\d+/g).map(Number);
  } else {
    const rgb = d3.color(color).rgb();
    r = rgb.r;
    g = rgb.g;
    b = rgb.b;
  }

  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

export const getTextColor = (backgroundColor) => {
  const luminance = getLuminance(backgroundColor);
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

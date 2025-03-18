import { useMemo } from "react";
import * as d3 from "d3";
import { useConstDataStore } from "../components/store/constDataStore";

const numThresholds = 5;

export const useMetricScale = () => {
  const exp = useConstDataStore((state) => state.exp);

  const metricValues = useMemo(
    () => exp.trials.map((trial) => trial.metric),
    [exp]
  );

  const metricScale = useMemo(
    () =>
      d3
        .scaleQuantize<number, number>()
        .domain([Math.min(...metricValues), Math.max(...metricValues)])
        .nice()
        .range(d3.range(numThresholds)),
    [metricValues]
  );

  const colorScale = (value: number) => {
    if (value === 0) return "#98171A";
    const color = d3
      .scaleSequential(d3.interpolateGreens)
      .domain([1, Math.max(...metricValues)]);
    return color(value);
  };

  return { metricScale, colorScale };
};

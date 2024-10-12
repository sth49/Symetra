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

  const colorScale = d3
    .scaleSequential(d3.interpolateViridis)
    .domain([0, numThresholds]);

  return { metricScale, colorScale };
};

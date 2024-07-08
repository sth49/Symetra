import React, { useMemo } from "react";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { Box } from "@chakra-ui/react";
import * as d3 from "d3";

import { useCustomStore } from "../store";

const ScatterContourPlot = (props: { data: Experiment | null }) => {
  const exp = props.data;
  const data = useMemo(
    () =>
      exp?.trials.map((trial) => ({
        x: trial.x,
        y: trial.y,
        metric: trial.metric,
      })) || [],
    [exp]
  );
  const { clickedHparam } = useCustomStore();

  console.log(clickedHparam);
  const width = 700;
  const height = 800;
  const margin = { top: 20, right: 30, bottom: 40, left: 40 };

  const legendWidth = 20;
  const legendHeight = 100;
  const legendMargin = { top: 20, right: 20 };

  const xValues = data.map((d) => d.x);
  const yValues = data.map((d) => d.y);
  const metricValues = data.map((d) => d.metric);

  const xScale = useMemo(
    () =>
      scaleLinear({
        domain: [Math.min(...xValues), Math.max(...xValues)],
        range: [margin.left, width - margin.right],
      }),
    [xValues, width, margin.left, margin.right]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        domain: [Math.min(...yValues), Math.max(...yValues)],
        range: [height - margin.bottom, margin.top],
      }),
    [yValues, height, margin.top, margin.bottom]
  );

  const numThresholds = 5;

  const metricScale = useMemo(
    () =>
      d3
        .scaleQuantize()
        .domain([Math.min(...metricValues), Math.max(...metricValues)])
        .nice()
        .range(d3.range(numThresholds)),
    [metricValues]
  );

  const thresholdRanges = useMemo(() => {
    const scale = metricScale.copy().range(metricScale.domain());
    const ticks = scale.ticks(numThresholds);
    return ticks.map((tick, i) => [
      tick,
      i < ticks.length - 1 ? ticks[i + 1] : scale.domain()[1],
    ]);
  }, [metricScale]);

  const colorScale = d3
    .scaleSequential(d3.interpolateTurbo)
    .domain([0, numThresholds]);

  const densityData = useMemo(() => {
    const densityGenerator = d3
      .contourDensity()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .weight((d) => metricScale(d.metric))
      .size([width, height])
      .bandwidth(10)
      .thresholds(numThresholds);

    return densityGenerator(data);
  }, [data, xScale, yScale, width, height, metricScale]);

  console.log("densityData", densityData);
  return (
    <Box bg={"white"} width="100%" height="100%">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Contour plot */}
        <g transform={`translate(0, 0)`}>
          <g>
            {densityData.map((density, i) => (
              <path
                key={`contour-${i}`}
                d={d3.geoPath()(density)}
                fill={colorScale(i)}
                opacity={0.3}
                stroke="black"
              />
            ))}
          </g>

          {data.map((d, i) => (
            <circle
              key={`circle-${i}`}
              cx={xScale(d.x)}
              cy={yScale(d.y)}
              r={3}
              fill={
                clickedHparam
                  ? exp?.hyperparams
                      .find((hp) => hp.displayName === clickedHparam)
                      ?.getColor(i)
                  : "gray"
              }
              stroke="black"
              opacity={0.5}
            />
          ))}
        </g>
        {/* 레전드 */}
        <g>
          {thresholdRanges.map((range, i) => (
            <React.Fragment key={`legend-${i}`}>
              <rect
                x={10}
                y={i * (legendHeight / numThresholds) + legendMargin.top}
                width={legendWidth}
                height={legendHeight / numThresholds}
                fill={colorScale(i)}
                opacity={0.3}
              />
              <text
                x={legendWidth + 15}
                y={
                  (i + 0.5) * (legendHeight / numThresholds) + legendMargin.top
                }
                fontSize="12"
                textAnchor="start"
                dominantBaseline="middle"
              >
                {`${d3.format(".2f")(range[0])} - ${d3.format(".2f")(
                  range[1]
                )}`}
              </text>
            </React.Fragment>
          ))}
          <text
            x={10}
            y={10}
            fontSize="14"
            textAnchor="start"
            fontWeight="bold"
          >
            Metric Range
          </text>
        </g>

        {/* Axes */}
        {/* <Group left={margin.left}>
          <AxisLeft scale={yScale} />
        </Group>
        <Group top={height - margin.bottom}>
          <AxisBottom scale={xScale} />
        </Group> */}
      </svg>
    </Box>
  );
};

export default ScatterContourPlot;

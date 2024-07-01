import React, { useMemo } from "react";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { Box } from "@chakra-ui/react";
import * as d3 from "d3";

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

  const width = 1000;
  const height = 800;
  const margin = { top: 20, right: 30, bottom: 40, left: 40 };

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

  const metricScale = useMemo(
    () =>
      d3
        .scaleQuantize()
        .domain([Math.min(...metricValues), Math.max(...metricValues)])
        .nice()
        .range(d3.range(15)),
    [metricValues]
  );

  const colorScale = d3.scaleSequential(d3.interpolateTurbo).domain([0, 14]);

  const densityData = useMemo(() => {
    const densityGenerator = d3
      .contourDensity()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .weight((d) => metricScale(d.metric))
      .size([width, height])
      .bandwidth(15)
      .thresholds(15);

    return densityGenerator(data);
  }, [data, xScale, yScale, width, height, metricScale]);

  return (
    <Box bg={"white"} width="100%" height="100%">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Contour plot */}
        <g>
          {densityData.map((density, i) => (
            <path
              key={`contour-${i}`}
              d={d3.geoPath()(density)}
              fill={colorScale(i)}
              opacity={0.3}
            />
          ))}
        </g>

        {/* Scatter plot */}
        {data.map((d, i) => (
          <circle
            key={`circle-${i}`}
            cx={xScale(d.x)}
            cy={yScale(d.y)}
            r={3}
            fill="gray"
            stroke="black"
            opacity={0.5}
          />
        ))}

        {/* Axes */}
        <Group left={margin.left}>
          <AxisLeft scale={yScale} />
        </Group>
        <Group top={height - margin.bottom}>
          <AxisBottom scale={xScale} />
        </Group>
      </svg>
    </Box>
  );
};

export default ScatterContourPlot;

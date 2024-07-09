import React, { useMemo, useState } from "react";
import { scaleLinear } from "@visx/scale";
import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Switch,
  Text,
} from "@chakra-ui/react";
import * as d3 from "d3";

const ScatterContourPlot = (props: { data: Experiment | null }) => {
  const exp = props.data;
  const [minDist, setMinDist] = useState(0.9);
  const [nNeighbors, setNNeighbors] = useState(15);
  const data = useMemo(
    () =>
      exp?.trials.map((trial) => ({
        id: trial.id,
        x: trial.umapPositions.filter(
          (pos) => pos.n_neighbors === nNeighbors && pos.min_dist === minDist
        )[0].x,
        y: trial.umapPositions.filter(
          (pos) => pos.n_neighbors === nNeighbors && pos.min_dist === minDist
        )[0].y,

        metric: trial.metric,
      })) || [],
    [exp, nNeighbors, minDist]
  );

  console.log("data", data);

  // const { clickedHparam } = useCustomStore();

  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState("");

  // console.log(clickedHparam);
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
    <Box height={"100%"}>
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={4}>
          Branch Coverage
        </Heading>
        <Box display={"flex"} alignContent={"center"} alignItems={"center"}>
          <Select
            placeholder=""
            onChange={(e) => setSelected(e.target.value)}
            value={selected}
          >
            <option key={"none"} value={""}>
              None
            </option>
            <option key={"metric"} value={"metric"}>
              METRIC
            </option>
            {exp.hyperparams.map((hp) => (
              <option key={hp.name} value={hp.name}>
                {hp.displayName}
              </option>
            ))}
          </Select>
          <FormControl display="flex" alignItems="center" p={4}>
            <FormLabel mb={0}>
              <Text fontSize={"sm"}>Metric</Text>
            </FormLabel>
            <Switch onChange={() => setVisible(!visible)} checked={visible} />
          </FormControl>
        </Box>
      </Box>
      <Box display={"flex"} p={2} justifyContent={"space-around"}>
        <Box display={"flex"}>
          <Text fontSize={"small"}>N Neighbors:</Text>
          <Select
            onChange={(e) => setNNeighbors(Number(e.target.value))}
            value={nNeighbors}
          >
            {[
              ...new Set(
                exp.trials[0].umapPositions.map((pos) => pos.n_neighbors)
              ),
            ]
              .sort((a, b) => a - b)
              .map((n_neighbor) => (
                <option key={n_neighbor} value={n_neighbor}>
                  {n_neighbor}
                </option>
              ))}
          </Select>
        </Box>
        <Box display={"flex"}>
          <Text fontSize={"small"}>Min Dist:</Text>
          <Select
            onChange={(e) => setMinDist(Number(e.target.value))}
            value={minDist}
          >
            {[
              ...new Set(
                exp.trials[0].umapPositions.map((pos) => pos.min_dist)
              ),
            ]
              .sort((a, b) => a - b)
              .map((min_dist) => (
                <option key={min_dist} value={min_dist}>
                  {min_dist}
                </option>
              ))}
          </Select>
        </Box>
      </Box>
      <Box bg={"white"} p={2} height="calc(100% - 68px)">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(0, 0)`}>
            {visible && (
              <g>
                {densityData.map((density, i) => (
                  <path
                    key={`contour-${i}`}
                    d={d3.geoPath()(density)}
                    fill={colorScale(i)}
                    opacity={0.2}
                    stroke="black"
                  />
                ))}
              </g>
            )}

            {data.map((d, i) => (
              <circle
                key={`circle-${i}`}
                cx={xScale(d.x)}
                cy={yScale(d.y)}
                r={3}
                fill={
                  selected === "metric"
                    ? colorScale(metricScale(d.metric))
                    : selected !== "" && exp?.hyperparams
                    ? exp?.hyperparams
                        .find((hp) => hp.name === selected)
                        ?.getColor(i)
                    : "gray"
                }
                stroke="black"
                opacity={0.5}
              />
            ))}
          </g>
          {/* 레전드 */}
          {visible && (
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
                      (i + 0.5) * (legendHeight / numThresholds) +
                      legendMargin.top
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
          )}
        </svg>
      </Box>
    </Box>
  );
};

export default ScatterContourPlot;

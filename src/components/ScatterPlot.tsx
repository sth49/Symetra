import React, { useCallback, useMemo, useRef, useState } from "react";
import { scaleLinear } from "@visx/scale";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Switch,
  Text,
} from "@chakra-ui/react";
import * as d3 from "d3";
import { useCustomStore } from "../store";
import { Group } from "../model/group";
import { v4 as uuidv4 } from "uuid";

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

  const { groups, setGroups, hoveredGroup } = useCustomStore();

  const [isLassoActive, setIsLassoActive] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState(new Set());
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempLassoPoints, setTempLassoPoints] = useState([]);

  const svgRef = useRef(null);

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

  const handleMouseDown = useCallback(
    (event) => {
      if (!isLassoActive) return;
      const svg = svgRef.current;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
      setTempLassoPoints([{ x: svgPoint.x, y: svgPoint.y }]);
      setSelectedPoints(new Set()); // 선택된 점들 초기화
      setIsDrawing(true);
    },
    [isLassoActive]
  );
  const handleMouseMove = useCallback(
    (event) => {
      if (!isLassoActive || !isDrawing) return;
      const svg = svgRef.current;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
      const newTempLassoPoints = [
        ...tempLassoPoints,
        { x: svgPoint.x, y: svgPoint.y },
      ];
      setTempLassoPoints(newTempLassoPoints);
      updateSelectedPoints(newTempLassoPoints);
    },
    [isLassoActive, isDrawing, tempLassoPoints]
  );
  const updateSelectedPoints = useCallback(
    (lassoPoints) => {
      if (lassoPoints.length < 3) return; // 최소 3개의 점이 필요합니다

      const polygon = lassoPoints.map((p) => [p.x, p.y]);
      const selected = new Set(
        data
          .filter((d) =>
            d3.polygonContains(polygon, [xScale(d.x), yScale(d.y)])
          )
          .map((d) => d.id)
      );
      setSelectedPoints(selected);
    },
    [data, xScale, yScale]
  );

  const handleMouseUp = useCallback(() => {
    if (!isLassoActive || !isDrawing) return;
    setIsDrawing(false);
  }, [isLassoActive, isDrawing]);

  const confirmLasso = useCallback(() => {
    setGroups([
      ...groups,
      new Group(
        uuidv4(),
        exp.trials.filter((trial) => selectedPoints.has(trial.id))
      ),
    ]);
    setIsLassoActive(false);
    setIsDrawing(false);
    setSelectedPoints(new Set());
    setTempLassoPoints([]);
  }, [tempLassoPoints]);

  const cancelLasso = useCallback(() => {
    setTempLassoPoints([]);
    setSelectedPoints(new Set());
    setIsLassoActive(false);
    setIsDrawing(false);
  }, []);
  // console.log("densityData", densityData);
  return (
    <Box height={"100%"}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Heading as="h5" size="sm" color="gray.600" p={4}>
          Branch Coverage
        </Heading>

        <Box display="flex" alignItems="center">
          <Box mr={2}>
            {/* 고정 너비를 사용하여 안정성 확보 */}
            {isLassoActive ? (
              <Box display="flex" alignItems={"center"}>
                <Text fontSize={"sm"} mr={2}>
                  Selected:{" "}
                  {selectedPoints.size +
                    (!isLassoActive ? hoveredGroup.size : 0)}{" "}
                  / {data.length}
                </Text>
                <Button
                  onClick={confirmLasso}
                  size="sm"
                  colorScheme="blue"
                  flex={1}
                  mr={1}
                  isDisabled={tempLassoPoints.length < 3}
                >
                  + Group
                </Button>
                <Button
                  onClick={cancelLasso}
                  size="sm"
                  colorScheme="red"
                  flex={1}
                  ml={1}
                >
                  Cancel
                </Button>
              </Box>
            ) : (
              <Button
                onClick={() => {
                  setIsLassoActive(true);
                  setSelectedPoints(new Set());
                }}
                size="sm"
                colorScheme="blue"
                variant={"outline"}
                width="100%"
              >
                Lasso
              </Button>
            )}
          </Box>

          <Select
            placeholder=""
            onChange={(e) => setSelected(e.target.value)}
            value={selected}
            size="sm"
            width="100px"
          >
            <option value="">None</option>
            <option value="metric">METRIC</option>
            {exp.hyperparams.map((hp) => (
              <option key={hp.name} value={hp.name}>
                {hp.displayName}
              </option>
            ))}
          </Select>

          <FormControl display="flex" alignItems="center" ml={4} width="100px">
            <FormLabel htmlFor="metric-switch" mb={0} mr={2}>
              <Text fontSize="sm">Metric</Text>
            </FormLabel>
            <Switch
              id="metric-switch"
              onChange={() => setVisible(!visible)}
              isChecked={visible}
            />
          </FormControl>
        </Box>
      </Box>
      <Box display={"flex"} p={2} justifyContent={"space-around"}>
        <Box display={"flex"} width={"50%"} p={1} alignItems={"center"}>
          <Text fontSize={"small"} width={"50%"} align={"center"}>
            N Neighbors:
          </Text>
          <Select
            onChange={(e) => setNNeighbors(Number(e.target.value))}
            value={nNeighbors}
            size={"sm"}
            width={"40%"}
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
        <Box display={"flex"} width={"50%"} p={1} alignItems={"center"}>
          <Text fontSize={"small"} width={"50%"} align={"center"}>
            Min Dist:
          </Text>
          <Select
            onChange={(e) => setMinDist(Number(e.target.value))}
            value={minDist}
            size={"sm"}
            width={"40%"}
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
          // width="100%"
          // height="100%"
          // viewBox={`0 0 ${width} ${height}`}
          // preserveAspectRatio="xMidYMid meet"
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
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
                  selectedPoints.has(d.id)
                    ? "#FC8181"
                    : !isLassoActive && hoveredGroup.has(d.id)
                    ? "#F6E05E"
                    : !isLassoActive && hoveredGroup.size > 0
                    ? "#CBD5E0"
                    : selected === "metric"
                    ? colorScale(metricScale(d.metric))
                    : selected !== "" && exp?.hyperparams
                    ? exp?.hyperparams
                        .find((hp) => hp.name === selected)
                        ?.getColor(i)
                    : "#718096"
                }
                stroke={
                  selectedPoints.has(d.id)
                    ? "#E53E3E"
                    : !isLassoActive && hoveredGroup.has(d.id)
                    ? "#D69E2E"
                    : !isLassoActive && hoveredGroup.size > 0
                    ? "#718096"
                    : // : selected === "metric"
                      // ? colorScale(metricScale(d.metric))
                      // : selected !== "" && exp?.hyperparams
                      // ? exp?.hyperparams
                      //     .find((hp) => hp.name === selected)
                      //     ?.getColor(i)
                      "#2D3748"
                }
                opacity={
                  selectedPoints.has(d.id) ||
                  (!isLassoActive && hoveredGroup.has(d.id))
                    ? 1
                    : 0.5
                }
              />
            ))}

            {/* {isLassoActive && lassoPoints.length > 0 && (
              <path
                d={`M ${lassoPoints.map((p) => `${p.x},${p.y}`).join(" L ")} Z`}
                fill="none"
                stroke="blue"
                strokeWidth="2"
                pointerEvents="none"
              />
            )}
             */}
            {isLassoActive && tempLassoPoints.length > 0 && (
              <path
                d={`M ${tempLassoPoints
                  .map((p) => `${p.x},${p.y}`)
                  .join(" L ")} Z`}
                fill="none"
                stroke="#2B6CB0"
                strokeWidth="2"
                pointerEvents="none"
              />
            )}
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
                    {`${range[0]} - ${range[1]}`}
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

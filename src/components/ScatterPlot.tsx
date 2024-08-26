import React, { useCallback, useMemo, useRef, useState } from "react";
import { scaleLinear } from "@visx/scale";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Select,
  Switch,
  Text,
} from "@chakra-ui/react";

import * as d3 from "d3";
import { useCustomStore } from "../store";
import {
  BinaryHyperparam,
  ContinuousHyperparam,
  DiscreteHyperparam,
  NominalHyperparam,
} from "../model/hyperparam";
import { format } from "@visx/vendor/d3-format";
import { TbLasso } from "react-icons/tb";
import { TbLassoOff } from "react-icons/tb";
import { PiLassoBold } from "react-icons/pi";
const ScatterContourPlot = () => {
  const { exp, hyperparams, groups, setGroups, hoveredGroup } =
    useCustomStore();
  const [minDist, setMinDist] = useState(0.9);
  const [nNeighbors, setNNeighbors] = useState(15);
  const oneDecimalFormat = format(".1f");
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

  const legendWidth = 100;
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
    // setGroups([
    //   ...groups,
    //   new Group(
    //     uuidv4(),
    //     exp.trials.filter((trial) => selectedPoints.has(trial.id))
    //   ),
    // ]);
    console.log("groups", groups);
    groups.addGroup(exp.trials.filter((trial) => selectedPoints.has(trial.id)));

    // console.log("newGroups", newGroups);

    setGroups(groups);
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
        <Heading as="h5" size="sm" color="gray.400" p={2}>
          Branch Coverage
        </Heading>

        <Box display="flex" alignItems="center">
          <FormControl
            display="flex"
            justifyContent="center"
            alignItems="center"
            mr={2}
            width="150px"
          >
            <FormLabel htmlFor="metric-switch" mb={0} mr={1} width={"80%"}>
              <Text fontSize="xs">Colored by</Text>
            </FormLabel>

            <Select
              placeholder=""
              onChange={(e) => setSelected(e.target.value)}
              value={selected}
              size="xs"
            >
              <option value="">None</option>
              <option value="metric">METRIC</option>
              {exp.hyperparams.map((hp) => (
                <option key={hp.name} value={hp.name}>
                  {hp.displayName}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl
            display="flex"
            justifyContent="center"
            alignItems="center"
            mr={2}
            width="170px"
          >
            <FormLabel htmlFor="metric-switch" mb={0} mr={1}>
              <Text fontSize="xs">Contoured by Metric</Text>
            </FormLabel>
            <Switch
              id="metric-switch"
              onChange={() => setVisible(!visible)}
              isChecked={visible}
              size={"sm"}
            />
          </FormControl>

          <Box display={"flex"}>
            <IconButton
              aria-label="Lasso"
              icon={isLassoActive ? <TbLassoOff /> : <TbLasso />}
              onClick={() => {
                if (isLassoActive) {
                  cancelLasso();
                } else {
                  setIsLassoActive(true);
                  setSelectedPoints(new Set());
                }
              }}
              size="xs"
              colorScheme={isLassoActive ? "red" : "blue"}
              // variant={""}
              mr={1}
            />
            <Button
              onClick={confirmLasso}
              size="xs"
              colorScheme="blue"
              flex={1}
              mr={1}
              isDisabled={tempLassoPoints.length < 3}
            >
              Add Group
            </Button>
          </Box>
        </Box>
      </Box>
      <Box display={"flex"} justifyContent={"end"} width={"100%"}>
        <Box display={"flex"} width={"25%"} p={1} alignItems={"center"}>
          <Text fontSize={"small"} width={"50%"} align={"center"}>
            N Neighbors:
          </Text>
          <Select
            onChange={(e) => setNNeighbors(Number(e.target.value))}
            value={nNeighbors}
            size={"xs"}
            width={"50%"}
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
        <Box display={"flex"} width={"25%"} p={1} alignItems={"center"}>
          <Text fontSize={"small"} width={"50%"} align={"center"}>
            Min Dist:
          </Text>
          <Select
            onChange={(e) => setMinDist(Number(e.target.value))}
            value={minDist}
            size={"xs"}
            width={"50%"}
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

      <Box bg={"white"} p={2} height="calc(100% - 108px)">
        <svg
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
          {visible ||
            (selected === "metric" && (
              <g>
                {thresholdRanges.map((range, i) => (
                  <React.Fragment key={`legend-${i}`}>
                    <rect
                      x={10}
                      y={i * (legendHeight / numThresholds) + legendMargin.top}
                      width={legendWidth / 5}
                      height={legendHeight / numThresholds}
                      fill={colorScale(i)}
                      opacity={0.3}
                    />
                    <text
                      x={legendWidth / 5 + 15}
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
            ))}

          {selected !== "metric" && selected !== "" && (
            <g>
              {hyperparams
                .find((hp) => hp.name === selected)
                ?.scale.domain()
                .map((val, i) => (
                  <React.Fragment key={`legend-${i}`}>
                    {hyperparams.find((hp) => hp.name === selected) instanceof
                      NominalHyperparam ||
                    hyperparams.find((hp) => hp.name === selected) instanceof
                      BinaryHyperparam ? (
                      <>
                        <rect
                          x={10}
                          y={
                            i *
                              (legendHeight /
                                hyperparams
                                  .find((hp) => hp.name === selected)
                                  ?.scale.domain().length) +
                            legendMargin.top
                          }
                          width={legendWidth / 5}
                          stroke={
                            hyperparams.find(
                              (hp) => hp.name === selected
                            ) instanceof BinaryHyperparam && "gray"
                          }
                          height={
                            legendHeight /
                            hyperparams
                              .find((hp) => hp.name === selected)
                              ?.scale.domain().length
                          }
                          fill={hyperparams
                            .find((hp) => hp.name === selected)
                            ?.scale(val)}
                          opacity={0.3}
                        />
                        <text
                          x={legendWidth / 5 + 15}
                          y={
                            (i + 0.5) *
                              (legendHeight /
                                hyperparams
                                  .find((hp) => hp.name === selected)
                                  ?.scale.domain().length) +
                            legendMargin.top
                          }
                          fontSize="12"
                          textAnchor="start"
                          dominantBaseline="middle"
                        >
                          {val === true
                            ? "True"
                            : val === false
                            ? "False"
                            : val}
                        </text>
                      </>
                    ) : hyperparams.find(
                        (hp) => hp.name === selected
                      ) instanceof ContinuousHyperparam ||
                      hyperparams.find((hp) => hp.name === selected) instanceof
                        DiscreteHyperparam ? (
                      <g>
                        {(() => {
                          const hp = hyperparams.find(
                            (hp) => hp.name === selected
                          ) as ContinuousHyperparam | DiscreteHyperparam;
                          const domain = hp.scale.domain();
                          const linearScale = d3
                            .scaleLinear()
                            .domain(domain)
                            .range([0, 1]);

                          return (
                            <>
                              <defs>
                                <linearGradient
                                  id="numerical-gradient"
                                  x1="0%"
                                  y1="0%"
                                  x2="100%"
                                  y2="0%"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor={hp.scale(domain[0])}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor={hp.scale(domain[1])}
                                  />
                                </linearGradient>
                              </defs>
                              <rect
                                x={10}
                                y={legendMargin.top}
                                width={legendWidth}
                                height={20}
                                fill="url(#numerical-gradient)"
                              />
                              {[0, 0.5, 1].map((t, i) => {
                                const value = linearScale.invert(t);
                                return (
                                  <g key={`legend-numerical-${i}`}>
                                    <line
                                      x1={10 + t * legendWidth}
                                      y1={legendMargin.top + 20}
                                      x2={10 + t * legendWidth}
                                      y2={legendMargin.top + 25}
                                      stroke="black"
                                    />
                                    <text
                                      x={10 + t * legendWidth}
                                      y={legendMargin.top + 40}
                                      fontSize="12"
                                      textAnchor="middle"
                                    >
                                      {oneDecimalFormat(value)}
                                    </text>
                                  </g>
                                );
                              })}
                            </>
                          );
                        })()}
                      </g>
                    ) : (
                      <>"asdf"</>
                    )}
                  </React.Fragment>
                ))}
              <text
                x={10}
                y={10}
                fontSize="14"
                textAnchor="start"
                fontWeight="bold"
              >
                {selected}
              </text>
              <g />
            </g>
          )}
        </svg>
      </Box>
    </Box>
  );
};

export default ScatterContourPlot;

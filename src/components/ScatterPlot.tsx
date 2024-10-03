import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  memo,
} from "react";
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
  NominalHyperparam,
} from "../model/hyperparam";
import { format } from "@visx/vendor/d3-format";
import { TbLasso } from "react-icons/tb";
import { TbLassoOff } from "react-icons/tb";
import { useConstDataStore } from "./store/constDataStore";
// interface ScatterPlotProps {
//   selectedTrials: number[];
//   selectedRowPositions: any[];
//   lastViewIndex: number;
// }
const ScatterContourPlot: React.FC = () => {
  // const {
  //   groups,
  //   setGroups,
  //   hoveredGroup,
  //   selectedTrials,
  //   selectedRowPositions,
  //   lastViewIndex,
  // } = useCustomStore();

  const groups = useCustomStore((state) => state.groups);
  const setGroups = useCustomStore((state) => state.setGroups);
  const hoveredGroup = useCustomStore((state) => state.hoveredGroup);
  const selectedTrials = useCustomStore((state) => state.selectedTrials);
  const selectedRowPositions = useCustomStore(
    (state) => state.selectedRowPositions
  );
  const lastViewIndex = useCustomStore((state) => state.lastViewIndex);
  const { exp, hyperparams } = useConstDataStore();
  const [minDist, setMinDist] = useState(0.9);
  const [nNeighbors, setNNeighbors] = useState(15);
  const [isPreference, setIsPreference] = useState(false);
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

  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({
    width: 1000,
    height: 800,
  });

  const [isLassoActive, setIsLassoActive] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState(new Set());
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempLassoPoints, setTempLassoPoints] = useState([]);

  const svgRef = useRef(null);
  const [svgRect, setSvgRect] = useState(null);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState("");

  // console.log(clickedHparam);
  const margin = { top: 15, right: 10, bottom: 110, left: 20 };

  const legendWidth = 100;
  const legendHeight = 100;
  const legendMargin = { top: 20, right: 20 };

  const xValues = data.map((d) => d.x);
  const yValues = data.map((d) => d.y);
  const metricValues = data.map((d) => d.metric);
  const [svgPosition, setSvgPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updateSvgPosition = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setSvgPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
        });
      }
    };

    updateSvgPosition();
    window.addEventListener("scroll", updateSvgPosition);
    window.addEventListener("resize", updateSvgPosition);

    return () => {
      window.removeEventListener("scroll", updateSvgPosition);
      window.removeEventListener("resize", updateSvgPosition);
    };
  }, []);

  const xScale = useMemo(
    () =>
      scaleLinear({
        domain: [Math.min(...xValues), Math.max(...xValues)],
        range: [margin.left, containerSize.width - margin.right],
      }),
    [xValues, containerSize.width, margin.left, margin.right]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        domain: [Math.min(...yValues), Math.max(...yValues)],
        range: [containerSize.height - margin.bottom, margin.top],
      }),
    [yValues, containerSize.height, margin.top, margin.bottom]
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
    .scaleSequential(d3.interpolateViridis)
    .domain([0, numThresholds]);

  const densityData = useMemo(() => {
    const densityGenerator = d3
      .contourDensity()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .weight((d) => metricScale(d.metric))
      .size([
        containerSize.width - margin.left - margin.right,
        containerSize.height - margin.top - margin.bottom,
      ])
      .bandwidth(10)
      .thresholds(numThresholds);

    return densityGenerator(data);
  }, [data, xScale, yScale, metricScale, containerSize]);

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
    groups.addGroup(exp.trials.filter((trial) => selectedPoints.has(trial.id)));
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

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const updateSvgRect = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setSvgRect(rect);
      }
    };

    updateSvgRect();
    window.addEventListener("resize", updateSvgRect);
    return () => window.removeEventListener("resize", updateSvgRect);
  }, [margin.left]);

  const drawConnectionLine = useCallback(() => {
    // console.log("is controlling?", isTableScrolling);

    if (
      !selectedTrials ||
      !selectedRowPositions.length ||
      !svgRef.current ||
      lastViewIndex === -1
    ) {
      return null;
    }
    let flag =
      selectedRowPositions.length &&
      selectedRowPositions[0].order < lastViewIndex
        ? "start"
        : "end";

    // console.log("start flag", flag);
    // console.log("lastViewIndex", lastViewIndex);
    // 테이블 컨테이너의 위치를 가져옵니다.
    const tableContainer = document.querySelector(".virtual-table");
    const tableContainer2 = document.querySelector(".scroll-container");

    const tableRect = tableContainer.getBoundingClientRect();
    const tableRect2 = tableContainer2.getBoundingClientRect();

    // console.log("selectedTrial", selectedTrials);
    return selectedRowPositions
      .sort((a, b) => a.order - b.order)
      .map((selectedRowPosition, i) => {
        const selectedTrial = selectedRowPosition.trialId;
        if (flag === "start" && selectedRowPosition.top !== null) {
          flag = "middle";
        } else if (
          (flag === "middle" && selectedRowPosition.top === null) ||
          selectedRowPosition.order >= lastViewIndex
        ) {
          flag = "end";
        }

        const selectedPoint = data.find((d) => d.id === selectedTrial);
        if (!selectedPoint) {
          return null;
        }
        const svgRect = svgRef.current.getBoundingClientRect();
        const viewBox = svgRef.current.viewBox.baseVal;
        const svgMidX1 = xScale(selectedPoint.x);
        const svgMidY1 = yScale(selectedPoint.y) - 2;

        const svgMidX2 = xScale(selectedPoint.x);
        const svgMidY2 = yScale(selectedPoint.y) + 2;

        const scaleY = viewBox.height / svgRect.height;

        const svgStartX = -margin.left;

        const top =
          flag === "start"
            ? tableRect.top - 15
            : flag === "middle"
            ? selectedRowPosition.top
            : flag === "end"
            ? tableRect2.bottom
            : selectedRowPosition.top;
        const svgStartY =
          (top - svgRect.top + tableContainer.scrollTop) * scaleY +
          viewBox.y -
          15;
        const svgEndX = -margin.left;
        const svgEndY =
          (top - svgRect.top + tableContainer.scrollTop) * scaleY + viewBox.y;

        // const curveStrength = svgStartY - svgMidX1 > 0 ? -30 : 30;
        // Calculate the slope
        const slope = (svgMidY1 - svgStartY) / (svgMidX1 - svgStartX);

        const baseCurveStrength = 200;
        const slopeFactor = Math.min(Math.abs(slope), 1); // Limit the slope factor to 1
        const curveStrength =
          baseCurveStrength + (1 - slopeFactor) * baseCurveStrength;

        // Determine the direction of the curve
        const curveDirection = svgStartY - svgMidY1 > 0 ? -1 : 1;

        const pathData = `
        M ${svgStartX} ${svgStartY}
        C ${
          (svgStartX +
            curveStrength * curveDirection +
            10 * Math.min(0.4, Math.abs(slope))) *
          curveDirection
        } ${svgStartY}, 
          ${svgMidX1} ${svgMidY1}, 
          ${svgMidX1} ${svgMidY1}
        L ${svgMidX2} ${svgMidY2}
        C ${svgMidX2} ${svgMidY2}, 
          ${
            -(
              svgEndX -
              curveStrength * curveDirection +
              10 * Math.min(0.4, Math.abs(slope))
            ) * curveDirection
          } ${svgEndY}, 
          ${svgEndX} ${svgEndY}
        Z
      `;

        return (
          <>
            <path d={pathData} fill="#d0e0fc" opacity={0.8} strokeWidth={1} />
          </>
        );
      });
  }, [
    selectedTrials,
    selectedRowPositions,
    lastViewIndex,
    data,
    xScale,
    yScale,
    margin.left,
  ]);

  // const drawConnectionLine2 = useCallback(() => {
  //   if (!hoveredRowPosition || !svgRef.current) return null;

  //   const tableContainer = document.querySelector(".virtual-table");

  //   const hoveredTrial = hoveredRowPosition.trialId;

  //   const hoveredPoint = data.find((d) => d.id === hoveredTrial);
  //   if (!hoveredPoint) {
  //     return null;
  //   }
  //   const svgRect = svgRef.current.getBoundingClientRect();
  //   const viewBox = svgRef.current.viewBox.baseVal;
  //   const svgMidX1 = xScale(hoveredPoint.x);
  //   const svgMidY1 = yScale(hoveredPoint.y) - 2;

  //   const svgMidX2 = xScale(hoveredPoint.x);
  //   const svgMidY2 = yScale(hoveredPoint.y) + 2;

  //   const scaleY = viewBox.height / svgRect.height;

  //   const svgStartX = -margin.left;

  //   const top = hoveredRowPosition.top;
  //   const svgStartY =
  //     (top - svgRect.top + tableContainer.scrollTop) * scaleY + viewBox.y - 15;
  //   const svgEndX = -margin.left;
  //   const svgEndY =
  //     (top - svgRect.top + tableContainer.scrollTop) * scaleY + viewBox.y;

  //   const slope = (svgMidY1 - svgStartY) / (svgMidX1 - svgStartX);

  //   const baseCurveStrength = 200;
  //   const slopeFactor = Math.min(Math.abs(slope), 1); // Limit the slope factor to 1
  //   const curveStrength =
  //     baseCurveStrength + (1 - slopeFactor) * baseCurveStrength;

  //   // Determine the direction of the curve
  //   const curveDirection = svgStartY - svgMidY1 > 0 ? -1 : 1;

  //   const pathData = `
  //       M ${svgStartX} ${svgStartY}
  //       C ${
  //         (svgStartX +
  //           curveStrength * curveDirection +
  //           10 * Math.min(0.4, Math.abs(slope))) *
  //         curveDirection
  //       } ${svgStartY},
  //         ${svgMidX1} ${svgMidY1},
  //         ${svgMidX1} ${svgMidY1}
  //       L ${svgMidX2} ${svgMidY2}
  //       C ${svgMidX2} ${svgMidY2},
  //         ${
  //           -(
  //             svgEndX -
  //             curveStrength * curveDirection +
  //             10 * Math.min(0.4, Math.abs(slope))
  //           ) * curveDirection
  //         } ${svgEndY},
  //         ${svgEndX} ${svgEndY}
  //       Z
  //     `;

  //   return (
  //     <>
  //       <path d={pathData} fill="#f0f0f0" opacity={0.8} strokeWidth={1} />
  //       <circle cx={svgMidX1} cy={svgMidY1} r={3} fill={"red"} />
  //     </>
  //   );
  // }, [hoveredRowPosition, data, xScale, yScale, svgPosition, isTableScrolling]);

  return (
    <Box height={"100%"} position={"relative"} ref={containerRef}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Coverage View
        </Heading>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <FormControl
            display="flex"
            justifyContent="right"
            alignItems="center"
            mr={2}
            width="150px"
          >
            <FormLabel htmlFor="metric-switch" mb={0} mr={1} width={"80%"}>
              <Text fontSize="xs" color="gray.600">
                Colored by
              </Text>
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
            justifyContent="right"
            alignItems="center"
            mr={2}
            width="170px"
          >
            <FormLabel htmlFor="metric-switch" mb={0} mr={1}>
              <Text fontSize="xs" color="gray.600">
                Show contour
              </Text>
            </FormLabel>
            <Switch
              id="metric-switch"
              onChange={() => setVisible(!visible)}
              isChecked={visible}
              size={"sm"}
            />
          </FormControl>
          <FormControl
            display="flex"
            justifyContent="right"
            alignItems="center"
            width="150px"
            pr={2}
          >
            <FormLabel htmlFor="perference-switch" mb={0} mr={1}>
              <Text fontSize="xs" color="gray.600">
                Preference
              </Text>
            </FormLabel>
            <Switch
              id="perference-switch"
              onChange={() => setIsPreference(!isPreference)}
              isChecked={isPreference}
              size={"sm"}
            />
          </FormControl>
        </Box>
      </Box>
      <Box
        display={"flex"}
        flexDirection={"column"}
        overflowY={"hidden"}
        height="calc(100% - 40px)"
      >
        {isPreference && (
          <Box
            // visibility={isPreference ? "visible" : "hidden"}
            display={"flex"}
            width={"100%"}
            justifyContent={"right"}
            alignItems={"center"}
          >
            <FormControl
              display="flex"
              justifyContent="right"
              alignItems="center"
              width={"200px"}
            >
              <FormLabel mb={0} mr={1}>
                <Text fontSize="xs" color="gray.600">
                  N Neighbors
                </Text>
              </FormLabel>
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
                  .sort((a, b) => (a as number) - (b as number))
                  .map((n_neighbor) => (
                    <option
                      key={n_neighbor as number}
                      value={n_neighbor as number}
                    >
                      {n_neighbor as number}
                    </option>
                  ))}
              </Select>
            </FormControl>
            <FormControl
              display="flex"
              justifyContent="center"
              alignItems="center"
              width={"200px"}
            >
              <FormLabel mb={0} mr={1}>
                <Text fontSize="xs" color="gray.600">
                  Min Dist
                </Text>
              </FormLabel>
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
                  .sort((a, b) => (a as number) - (b as number))
                  .map((min_dist) => (
                    <option key={min_dist as number} value={min_dist as number}>
                      {min_dist as number}
                    </option>
                  ))}
              </Select>
            </FormControl>
          </Box>
        )}

        <Box bg={"white"} width={"100%"} position={"relative"}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
            preserveAspectRatio="xMidYMid meet"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
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
                    : // : selectedTrials.includes(d.id)
                      // ? "#2B6CB0"
                      "#CBD5E0"
                }
                stroke={
                  selectedPoints.has(d.id)
                    ? "#E53E3E"
                    : !isLassoActive && hoveredGroup.has(d.id)
                    ? "#D69E2E"
                    : !isLassoActive && hoveredGroup.size > 0
                    ? "#718096"
                    : "#718096"
                }
              />
            ))}
            {/* {selectedTrials && selectedRowPositions && drawConnectionLine()} */}

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
            {visible ||
              (selected === "metric" && (
                <g>
                  {thresholdRanges.map((range, i) => (
                    <React.Fragment key={`legend-${i}`}>
                      <rect
                        x={10}
                        y={
                          i * (legendHeight / numThresholds) + legendMargin.top
                        }
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
                        ) instanceof ContinuousHyperparam ? (
                        <g>
                          {(() => {
                            const hp = hyperparams.find(
                              (hp) => hp.name === selected
                            ) as ContinuousHyperparam;
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
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          >
            {selectedTrials && selectedRowPositions && drawConnectionLine()}
            {selectedTrials &&
              selectedTrials.map((trialId, i) => {
                const selectedPoint = data.find((d) => d.id === trialId);

                return (
                  <circle
                    key={`circle-${i}`}
                    cx={xScale(selectedPoint.x)}
                    cy={yScale(selectedPoint.y)}
                    r={3}
                    fill="#2B6CB0"
                  />
                );
              })}
          </svg>
        </Box>
      </Box>
      <Box
        position="absolute"
        bg="white"
        boxShadow="lg"
        borderRadius="md"
        bottom={"0px"}
        left="50%"
        width={"60%"}
        transform="translate(-50%, -50%)" // Center the box
        p={1}
        zIndex={10}
        display={"flex"}
        justifyContent={"space-between"}
        alignItems="center"
      >
        <Text fontSize={"xs"} color="gray.600" p={2}>
          Choose trials to create a trial group ({selectedPoints.size} trial
          {selectedPoints.size > 1 ? "s " : ""}
          selected)
        </Text>
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
            mr={1}
          />
          <Button
            onClick={confirmLasso}
            size="xs"
            colorScheme="blue"
            isDisabled={tempLassoPoints.length < 3}
            mr={1}
          >
            Create Trial Group
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default memo(ScatterContourPlot);

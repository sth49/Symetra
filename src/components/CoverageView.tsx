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
  Icon,
  IconButton,
  Select,
  Switch,
  Text,
} from "@chakra-ui/react";
import { MdAdd } from "react-icons/md";
import * as d3 from "d3";
import { useCustomStore } from "../store";
import {
  BinaryHyperparam,
  ContinuousHyperparam,
  NominalHyperparam,
} from "../model/hyperparam";
import { TbLasso } from "react-icons/tb";
import { TbLassoOff } from "react-icons/tb";
import { useConstDataStore } from "./store/constDataStore";
import { formatting } from "../model/utils";
import { useMetricScale } from "../model/colorScale";
const throttle = (func: Function) => {
  let rafId: number | null = null;
  return function (...args: any[]) {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      func.apply(this, args);
      rafId = null;
    });
  };
};

const CoverageView: React.FC = () => {
  const groups = useCustomStore((state) => state.groups);
  const setGroups = useCustomStore((state) => state.setGroups);
  const hoveredGroup = useCustomStore((state) => state.hoveredGroup);
  const selectedTrials = useCustomStore((state) => state.selectedTrials);
  const selectedRowPositions = useCustomStore(
    (state) => state.selectedRowPositions
  );
  const setSelectOneTrial = useCustomStore((state) => state.setSelectOneTrial);
  const hparamSort = useConstDataStore((state) => state.hparamSort);
  const { exp, hyperparams } = useConstDataStore();
  const [drType, setDrType] = useState("umap");
  const [distanceMetric, setDistanceMetric] = useState("J");
  const [isPreference, setIsPreference] = useState(false);
  const [hoveredTrial, setHoveredTrial] = useState(null);
  const data = useMemo(
    () =>
      exp?.trials.map((trial) => ({
        id: trial.id,
        x:
          drType === "umap"
            ? trial.umap.filter((pos) => pos.metric === distanceMetric)[0]?.x
            : drType === "tsne"
            ? trial.tsne.filter((pos) => pos.metric === distanceMetric)[0]?.x
            : trial.pca.filter((pos) => pos.metric === distanceMetric)[0]?.x,
        y:
          drType === "umap"
            ? trial.umap.filter((pos) => pos.metric === distanceMetric)[0]?.y
            : drType === "tsne"
            ? trial.tsne.filter((pos) => pos.metric === distanceMetric)[0]?.y
            : trial.pca.filter((pos) => pos.metric === distanceMetric)[0]?.y,
        metric: trial.metric,
      })) || [],
    [exp?.trials, drType, distanceMetric]
  );

  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({
    width: 800,
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

  const margin = { top: 80, right: 40, bottom: 50, left: 40 };

  const legendWidth = 130;
  const legendMargin = { top: 15, right: 20, left: 20, bottom: 20 };

  const xValues = data.map((d) => d.x);
  const yValues = data.map((d) => d.y);

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

  const { metricScale, colorScale } = useMetricScale();

  const gridResolution = 25;
  const marginFactor = 0;
  const xExtent = useMemo(() => {
    const extent = d3.extent(data, (d) => d.x);
    const margin = (extent[1] - extent[0]) * marginFactor;
    return [extent[0] - margin, extent[1] + margin];
  }, [data]);

  const yExtent = useMemo(() => {
    const extent = d3.extent(data, (d) => d.y);
    const margin = (extent[1] - extent[0]) * marginFactor;
    return [extent[0] - margin, extent[1] + margin];
  }, [data]);
  const metricGrid = useMemo(() => {
    const validData = data.filter(
      (d) => d.x !== undefined && d.y !== undefined
    );

    const xExtent = d3.extent(validData, (d) => d.x);
    const yExtent = d3.extent(validData, (d) => d.y);

    const xGrid = d3.scaleLinear().domain(xExtent).range([0, gridResolution]);
    const yGrid = d3.scaleLinear().domain(yExtent).range([0, gridResolution]);

    const grid = Array.from({ length: gridResolution }, () =>
      Array(gridResolution).fill([])
    );

    validData.forEach((d) => {
      const xIdx = Math.floor(xGrid(d.x));
      const yIdx = Math.floor(yGrid(d.y));
      if (
        xIdx >= 0 &&
        xIdx < gridResolution &&
        yIdx >= 0 &&
        yIdx < gridResolution
      ) {
        grid[yIdx][xIdx] = [...grid[yIdx][xIdx], d.metric];
      }
    });

    return grid.map((row) =>
      row.map((cell) => (cell.length > 0 ? d3.mean(cell) : 0))
    );
  }, [data, gridResolution]);

  const metricContours = useMemo(() => {
    const maxMetric = d3.max(metricGrid.flat()) || 1;

    const contourGenerator = d3
      .contours()
      .size([gridResolution, gridResolution])
      .thresholds(d3.range(0, maxMetric, maxMetric / numThresholds));

    return contourGenerator(metricGrid.flat());
  }, [metricGrid]);

  const metricColorScale = useMemo(() => {
    return d3
      .scaleSequential(d3.interpolateGreens)
      .domain([0, d3.max(metricGrid.flat())]);
  }, [metricGrid]);

  const handleMouseDown = useCallback(
    (event) => {
      if (!isLassoActive) return;
      const svg = svgRef.current;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
      setTempLassoPoints([{ x: svgPoint.x, y: svgPoint.y }]);
      setSelectedPoints(new Set());
      setIsDrawing(true);
    },
    [isLassoActive]
  );

  const updateSelectedPoints = useCallback(
    throttle((lassoPoints) => {
      if (lassoPoints.length < 3) return;

      const polygon = lassoPoints.map((p) => [p.x, p.y]);
      const selected = new Set(
        data
          .filter((d) =>
            d3.polygonContains(polygon, [xScale(d.x), yScale(d.y)])
          )
          .map((d) => d.id)
      );
      setSelectedPoints(selected);
    }),
    [data, xScale, yScale]
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
    [isLassoActive, isDrawing, tempLassoPoints, updateSelectedPoints]
  );

  const handleMouseUp = useCallback(() => {
    if (!isLassoActive || !isDrawing) return;
    setIsDrawing(false);
  }, [isLassoActive, isDrawing]);

  const confirmLasso = useCallback(() => {
    const updatedGroups = groups.clone();

    // // txt file ********************
    // const selectedIds = Array.from(selectedPoints);

    // const blob = new Blob([JSON.stringify(selectedIds)], {
    //   type: "text/plain",
    // });
    // const url = window.URL.createObjectURL(blob);
    // const link = document.createElement("a");
    // link.href = url;
    // link.download = "selected_points.txt";
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
    // window.URL.revokeObjectURL(url);
    // // **********************************

    updatedGroups.addGroup(
      exp.trials.filter((trial) => selectedPoints.has(trial.id))
    );
    setGroups(updatedGroups);
    setIsLassoActive(false);
    setIsDrawing(false);
    setSelectedPoints(new Set());
    setTempLassoPoints([]);
  }, [exp.trials, groups, selectedPoints, setGroups]);

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
    if (!selectedTrials || !selectedRowPositions.length || !svgRef.current) {
      return null;
    }
    const tableContainer = document.querySelector(".virtual-table");
    const tableHeaderContainer = document.querySelector(
      ".virtual-table-sticky-header"
    );
    const tableHeaderRect = tableHeaderContainer.getBoundingClientRect();
    const tableBottomContainer = document.querySelector(
      ".virtual-table-bottom"
    );
    const tableBottomRect = tableBottomContainer.getBoundingClientRect();

    return selectedRowPositions
      .sort((a, b) => a.order - b.order)
      .map((selectedRowPosition, i) => {
        const selectedTrial = selectedRowPosition.trialId;

        const selectedPoint = data.find((d) => d.id === selectedTrial);

        if (!selectedPoint) {
          return null;
        }
        const svgRect = svgRef.current.getBoundingClientRect();
        const viewBox = svgRef.current.viewBox.baseVal;

        const scaleY = viewBox.height / svgRect.height;

        const svgStartX = svgRect.width;
        const svgEndX = svgRect.width;

        const top =
          selectedRowPosition.top > tableHeaderRect.bottom &&
          selectedRowPosition.top < tableBottomRect.top + 5
            ? selectedRowPosition.top
            : selectedRowPosition.top < tableHeaderRect.bottom
            ? tableHeaderRect.bottom
            : tableBottomRect.top + 5;

        const svgStartY =
          (top - svgRect.top + tableContainer.scrollTop) * scaleY +
          viewBox.y -
          14;
        const svgEndY =
          (top - svgRect.top + tableContainer.scrollTop) * scaleY +
          viewBox.y -
          6;
        const svgMidX = xScale(selectedPoint.x);
        const svgMidY = yScale(selectedPoint.y);
        const slope = (svgMidY - svgStartY) / (svgMidX - svgStartX);
        const slopeDir = slope > 0 ? 1 : -1;
        const svgMidX1 = xScale(selectedPoint.x) + slopeDir * 2;
        const svgMidY1 = yScale(selectedPoint.y);

        const svgMidX2 = xScale(selectedPoint.x) - slopeDir * 2;
        const svgMidY2 = yScale(selectedPoint.y);

        const baseCurveStrength = 100;
        const slopeFactor = Math.min(Math.abs(slope), 1);
        const curveStrength =
          baseCurveStrength + (1 - slopeFactor) * baseCurveStrength;

        const pathData = `
        M ${svgStartX} ${svgStartY}
        C ${svgStartX - curveStrength} ${svgStartY}, 
          ${svgMidX1} ${svgMidY1}, 
          ${svgMidX1} ${svgMidY1}
        L ${svgMidX2} ${svgMidY2}
        C ${svgMidX2} ${svgMidY2}, 
          ${svgEndX - curveStrength} ${svgEndY}, 
          ${svgEndX} ${svgEndY}
        Z
      `;

        return (
          <>
            <path
              key={`path-${i}`}
              d={pathData}
              fill="#d0e0fc"
              opacity={0.8}
              strokeWidth={1}
            />
          </>
        );
      });
  }, [selectedTrials, selectedRowPositions, data, xScale, yScale]);

  const metricValues = useMemo(
    () => exp.trials.map((trial) => trial.metric),
    [exp]
  );

  const minValue = 1;
  const maxValue = Math.max(...metricValues);

  const gradientStops = useMemo(() => {
    return d3.range(0, 1.01, 0.1).map((t) => {
      const value = minValue + t * (maxValue - minValue);
      const color = d3
        .scaleSequential(d3.interpolateGreens)
        .domain([minValue, maxValue])(value);
      return { offset: `${t * 100}%`, color };
    });
  }, [minValue, maxValue]);

  return (
    <Box height={"100%"} position={"relative"}>
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
              cursor={"pointer"}
              placeholder=""
              onChange={(e) => setSelected(e.target.value)}
              value={selected}
              size="xs"
            >
              <option value="">None</option>
              <option value="metric">CVRG</option>
              {hyperparams
                .sort((a, b) => {
                  if (hparamSort !== null && hparamSort !== undefined) {
                    if (hparamSort.id === "name") {
                      if (hparamSort.desc) {
                        return b.name.localeCompare(a.name);
                      }
                      return a.name.localeCompare(b.name);
                    } else if (hparamSort.id === "effect") {
                      if (hparamSort.desc) {
                        return b.getAbsoluteEffect() - a.getAbsoluteEffect();
                      }
                      return a.getAbsoluteEffect() - b.getAbsoluteEffect();
                    }
                  }
                  return a.name.localeCompare(b.name);
                })
                .filter((hp) => hp.visible)
                .map((hp) => (
                  <option key={hp.name} value={hp.name}>
                    <Icon as={hp.icon} mr={1} />
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
            width="130px"
          >
            <FormLabel htmlFor="metric-switch" mb={0} mr={1}>
              <Text fontSize="xs" color="gray.600">
                Contour by CVRG
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
            width="120px"
            pr={2}
          >
            <FormLabel htmlFor="perference-switch" mb={0} mr={1}>
              <Text fontSize="xs" color="gray.600">
                Show controls
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
        height="calc(100% - 35px - 40px)"
      >
        {isPreference && (
          <Box
            display={"flex"}
            width={"100%"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <FormControl
              display="flex"
              justifyContent="left"
              alignItems="center"
              width={"50%"}
              pl={2}
            >
              <FormLabel mb={0} mr={2}>
                <Text fontSize="xs" color="gray.600">
                  Dimensionality Reduction
                </Text>
              </FormLabel>
              <Select
                onChange={(e) => setDrType(e.target.value)}
                value={drType}
                size={"xs"}
                width={"100px"}
              >
                <option value="umap">UMAP</option>
                <option value="tsne">t-SNE</option>
                <option value="pca">PCA</option>
              </Select>
            </FormControl>
            <FormControl
              pr={2}
              display="flex"
              justifyContent="right"
              alignItems="center"
              width={"50%"}
            >
              <FormLabel mb={0} mr={2}>
                <Text fontSize="xs" color="gray.600">
                  Distance Measure
                </Text>
              </FormLabel>
              <Select
                onChange={(e) => setDistanceMetric(e.target.value)}
                value={distanceMetric}
                size={"xs"}
                width={"100px"}
              >
                <option value="C">Cosine</option>
                <option value="E">Euclidean</option>
                <option value="J">Jaccard</option>
              </Select>
            </FormControl>
          </Box>
        )}

        <Box
          bg={"white"}
          width={"100%"}
          height={"100%"}
          position={"relative"}
          ref={containerRef}
        >
          <svg
            key={"connection-line"}
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
                    stroke={
                      selectedPoints.has(trialId)
                        ? "#E53E3E"
                        : !isLassoActive && hoveredGroup.has(trialId)
                        ? "#D69E2E"
                        : !isLassoActive && hoveredGroup.size > 0
                        ? "#718096"
                        : "#718096"
                    }
                    fill={
                      hoveredTrial === trialId
                        ? "#FC8181"
                        : !isLassoActive && hoveredGroup.has(trialId)
                        ? "#F6E05E"
                        : selectedPoints.has(trialId)
                        ? "#FC8181"
                        : !isLassoActive && hoveredGroup.size > 0
                        ? "#CBD5E0"
                        : selected !== "" && exp?.hyperparams
                        ? exp?.hyperparams
                            .find((hp) => hp.name === selected)
                            ?.getColor(i)
                        : "#2B6CB0"
                    }
                  />
                );
              })}
          </svg>
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
                {metricContours.map((contour, i) => (
                  <path
                    key={`contour-${i}`}
                    d={d3.geoPath().projection(
                      d3.geoTransform({
                        point: function (x, y) {
                          const xMapped =
                            xExtent[0] +
                            (x / gridResolution) * (xExtent[1] - xExtent[0]);
                          const yMapped =
                            yExtent[0] +
                            (y / gridResolution) * (yExtent[1] - yExtent[0]);
                          this.stream.point(xScale(xMapped), yScale(yMapped));
                        },
                      })
                    )(contour)}
                    fill={
                      contour.value < 100
                        ? "white"
                        : metricColorScale(contour.value)
                    }
                    opacity={0.4}
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
                  hoveredTrial === d.id
                    ? "#FC8181"
                    : !isLassoActive && hoveredGroup.has(d.id)
                    ? "#F6E05E"
                    : selectedPoints.has(d.id)
                    ? "#FC8181"
                    : !isLassoActive && hoveredGroup.size > 0
                    ? "#CBD5E0"
                    : selected === "metric"
                    ? colorScale(d.metric)
                    : selected !== "" && exp?.hyperparams
                    ? exp?.hyperparams
                        .find((hp) => hp.name === selected)
                        ?.getColor(i)
                    : "#CBD5E0"
                }
                onClick={() => {
                  setSelectOneTrial(d.id);
                }}
                stroke={
                  selectedPoints.has(d.id)
                    ? "#E53E3E"
                    : !isLassoActive && hoveredGroup.has(d.id)
                    ? "#D69E2E"
                    : !isLassoActive && hoveredGroup.size > 0
                    ? "#718096"
                    : "#718096"
                }
                onMouseOver={() => setHoveredTrial(d.id)}
                onMouseLeave={() => setHoveredTrial(null)}
              />
            ))}
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
            {selected === "metric" && (
              <g
                transform={`translate(${10}, ${legendMargin.top})`}
                style={{
                  userSelect: "none",
                }}
              >
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    {gradientStops.map((stop, i) => (
                      <stop
                        key={i}
                        offset={stop.offset}
                        stopColor={stop.color}
                      />
                    ))}
                  </linearGradient>
                </defs>
                <rect x={130} y={-5} width="16" height="16" fill="#98171A" />
                <text
                  x={134}
                  y={7}
                  fontSize="12"
                  textAnchor="start"
                  fill="white"
                >
                  {0}
                </text>
                <text
                  x={170}
                  y={7}
                  fontSize="12"
                  textAnchor="start"
                  fill="#4A5568"
                >
                  {formatting(minValue, "int")}
                </text>
                <rect
                  x={190}
                  y={-5}
                  width="200"
                  height="16"
                  fill="url(#gradient)"
                />
                <text
                  x={395}
                  y={7}
                  fontSize="12"
                  textAnchor="start"
                  fill="#4A5568"
                >
                  {formatting(maxValue, "int")}
                </text>
                <text
                  x={0}
                  y={7}
                  fontSize="14"
                  textAnchor="start"
                  fontWeight="bold"
                  fill="#4A5568"
                  style={{
                    userSelect: "none",
                  }}
                >
                  Coverage value
                </text>
              </g>
            )}

            {selected !== "metric" && selected !== "" && (
              <g transform={`translate(${10}, ${legendMargin.top})`}>
                {hyperparams
                  .find((hp) => hp.name === selected)
                  ?.scale.domain()
                  .map((val, i) => {
                    if (val === true || val === false) return null;

                    const row = Math.floor(i / 5);
                    const col = i % 5;
                    const itemWidth = 100;
                    const itemHeight = 30;
                    return (
                      <React.Fragment key={`legend-${i}`}>
                        {hyperparams.find(
                          (hp) => hp.name === selected
                        ) instanceof NominalHyperparam ||
                        hyperparams.find(
                          (hp) => hp.name === selected
                        ) instanceof BinaryHyperparam ? (
                          <>
                            <rect
                              x={col * itemWidth}
                              y={row * itemHeight + legendMargin.top}
                              width={20}
                              height={15}
                              fill={hyperparams
                                .find((hp) => hp.name === selected)
                                ?.getColorByValue(val)}
                            />
                            <text
                              x={col * itemWidth + 25}
                              y={row * itemHeight + legendMargin.top + 7.5}
                              style={{
                                userSelect: "none",
                              }}
                              fontSize="12px"
                              textAnchor="start"
                              dominantBaseline="middle"
                              fill="#4A5568"
                            >
                              {val}
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
                                        offset={"50%"}
                                        stopColor={hp.scale(
                                          (domain[0] + domain[1]) / 2
                                        )}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor={hp.scale(domain[1])}
                                      />
                                    </linearGradient>
                                  </defs>
                                  <rect
                                    x={0}
                                    y={legendMargin.top}
                                    width={legendWidth - legendMargin.right}
                                    height={20}
                                    fill="url(#numerical-gradient)"
                                  />
                                  {[0, 0.5, 1].map((t, i) => {
                                    const value = linearScale.invert(t);
                                    return (
                                      <g key={`legend-numerical-${i}`}>
                                        <line
                                          x1={
                                            t *
                                            (legendWidth - legendMargin.right)
                                          }
                                          y1={legendMargin.top + 20}
                                          x2={
                                            t *
                                            (legendWidth - legendMargin.right)
                                          }
                                          y2={legendMargin.top + 25}
                                          stroke="black"
                                        />
                                        <text
                                          x={
                                            t *
                                            (legendWidth - legendMargin.right)
                                          }
                                          y={legendMargin.top + 40}
                                          fontSize="12"
                                          textAnchor="middle"
                                          fill="#4A5568"
                                          style={{
                                            userSelect: "none",
                                          }}
                                        >
                                          {formatting(value, hp.valueType)}
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
                    );
                  })}
                <text
                  x={0}
                  y={5}
                  fontSize="14"
                  textAnchor="start"
                  fontWeight="bold"
                  fill="#4A5568"
                >
                  {selected}
                </text>
                <g />
              </g>
            )}
          </svg>
        </Box>
      </Box>
      <Box
        height={"40px"}
        p={1}
        zIndex={10}
        display={"flex"}
        justifyContent={"space-between"}
        alignItems="center"
      >
        <Text fontSize={"xs"} color="gray.600" p={2} userSelect={"none"}>
          Use a lasso to select a group of trials (
          {formatting(selectedPoints.size, "int")} {" / "}
          {formatting(data.length, "int")}
          {" Selected"})
        </Text>
        <Box display={"flex"}>
          <IconButton
            aria-label="Lasso"
            variant={"outline"}
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
            isDisabled={selectedPoints.size < 3}
          >
            <Icon as={MdAdd} mr={1} />
            Create trial group
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default memo(CoverageView);

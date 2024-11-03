import { Box, Button, Heading, Text, useDisclosure } from "@chakra-ui/react";
import { useCustomStore } from "../store";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { memo } from "react";
import { Graph } from "@visx/network";
import { performStatisticalTest } from "../model/statistic";
import * as d3 from "d3";
import { formatting } from "../model/utils";

import { useTooltip, useTooltipInPortal } from "@visx/tooltip";
import { useConstDataStore } from "./store/constDataStore";
import { useMetricScale } from "../model/colorScale";
import React from "react";
type TooltipData = {
  key: string;
  type: string;
  value: any;
  count: number;
  stats: { avg: number; max: number; min: number };
};

export type NetworkProps = {
  width: number;
  height: number;
};

interface CustomNode {
  id: number;
  x: number;
  y: number;
  color?: string;
}

interface CustomLink {
  source: string;
  target: string;
  weight: number;
}

function createArcPath(
  source: CustomNode,
  target: CustomNode,
  height: number
): string {
  const flag =
    Math.abs(Number(source.id) - Number(target.id)) % 2 === 0 ? -1 : 1;
  const sourceX = source.x * 2;
  const sourceY = source.y * 2;
  const targetX = target.x * 2;
  const targetY = target.y * 2;
  const midX = (sourceX + targetX) / 2;
  const midY = targetY - height * 2 * flag;
  return `M${sourceX},${sourceY} Q${midX},${midY} ${targetX},${targetY}`;
}

const TrialGroupView = () => {
  const { hyperparams, exp } = useConstDataStore();
  const groups = useCustomStore((state) => state.groups);
  const setGroups = useCustomStore((state) => state.setGroups);
  const setHoveredGroup = useCustomStore((state) => state.setHoveredGroup);

  const setCurrnetSelectedGroup = useCustomStore(
    (state) => state.setCurrentSelectedGroup
  );
  const currnetSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );
  // const boxRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxHeight, setBoxHeight] = useState(0);
  const { metricScale, colorScale } = useMetricScale();
  const legendWidth = 100;
  const legendHeight = 100;
  const legendMargin = { top: 25, right: 20 };

  const numThresholds = 5;
  const thresholdRanges = useMemo(() => {
    const scale = metricScale.copy().range(metricScale.domain());
    const ticks = scale.ticks(numThresholds);
    return ticks.map((tick, i) => [
      tick,
      i < ticks.length - 1 ? ticks[i + 1] : scale.domain()[1],
    ]);
  }, [metricScale]);

  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<TooltipData>();
  const { TooltipInPortal } = useTooltipInPortal({
    scroll: true,
  });

  useEffect(() => {
    console.log("TrialGroupView initialized");
    const updatedGroups = groups.clone();
    updatedGroups.addGroup(
      exp?.trials
        .sort((a, b) => b.metric - a.metric)
        .slice(0, exp?.trials.length * 0.1) ?? [],
      "Top 10%"
    );
    updatedGroups.addGroup(
      exp?.trials
        .sort((a, b) => a.metric - b.metric)
        .slice(0, exp?.trials.length * 0.1) ?? [],
      "Bottom 10%"
    );
    setGroups(updatedGroups);

    setCurrnetSelectedGroup(updatedGroups.groups[0]);
  }, []);
  const [isInitialRender, setIsInitialRender] = useState(true);
  useEffect(() => {
    const updateSize = () => {
      if (boxRef.current) {
        const newHeight = boxRef.current.clientHeight;
        setBoxHeight(newHeight);
        if (isInitialRender && newHeight > 0) {
          setIsInitialRender(false);
        }
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, [isInitialRender]);

  const [hoveredLink, setHoveredLink] = useState<CustomLink | null>(null);
  const [localSelectedGroup, setLocalSelectedGroup] = useState<Set<number>>(
    new Set()
  );

  const { nodes, links } = useMemo(() => {
    console.log("GroupView rendering, boxHeight:", boxHeight);
    if (boxHeight === 0) return { nodes: [], links: [] };
    console.log("GroupView rendering");

    const nodes = groups.groups.map(
      (group, i) => ({
        id: group.id,
        name: group.name,
        x: (((i % 3) + 0.25) * boxRef.current?.clientWidth) / 5,
        y: (Math.floor(i / 3) * boxHeight) / 4 + boxHeight / 8,
        length: group.getLength(),
        stats: group.getStats(),
      }),
      [
        groups,
        groups.getLength(),
        hyperparams,
        boxRef.current?.clientHeight,
        boxRef.current?.clientWidth,
      ]
    );

    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const hparamResult = hyperparams.map((param) => {
          const group1 = groups.groups[i].getHyperparam(param.name);
          const group2 = groups.groups[j].getHyperparam(param.name);
          return performStatisticalTest(group1, group2, param.type, param);
        });
        const weight = hparamResult.filter((r) => r.pValue <= 0.05).length;

        links.push({
          source: nodes[i].id,
          target: nodes[j].id,
          weight,
        });
      }
    }

    return { nodes, links };
  }, [groups, hyperparams, boxHeight]);

  const graphMemo = useMemo(() => ({ nodes, links }), [nodes, links]);

  const weightScale = useMemo(() => {
    return d3.scaleLinear().domain([0, 61]).range([10, 1]);
  }, []);

  const handleNodeHover = useCallback(
    (node) => {
      if (node) {
        const group = groups.getGroup(Number(node.id));
        const hovered = new Set(group.trials.map((trial) => trial.id));
        setHoveredGroup(hovered);
      } else {
        setHoveredGroup(new Set());
      }
    },
    [groups, setHoveredGroup]
  );

  const handleNodeClick = useCallback(
    (id) => {
      if (currnetSelectedGroup && currnetSelectedGroup.id === id) {
        return;
      } else {
        setCurrnetSelectedGroup(groups.getGroup(id));
      }
    },
    [currnetSelectedGroup, groups, setCurrnetSelectedGroup]
  );

  const NodeComponent = useCallback(
    ({ node }) => (
      <g
        key={node.id}
        className={`node-group ${
          localSelectedGroup.has(node.id) ? "selected" : ""
        }`}
        onMouseEnter={() => handleNodeHover(node)}
        onMouseOut={() => {
          handleNodeHover(null);
          hideTooltip();
        }}
        onMouseMove={(event) => {
          showTooltip({
            tooltipData: {
              key: "",
              type: "node",
              value: node.name,
              count: node.length,
              stats: node.stats,
            },
            tooltipLeft: event.clientX,
            tooltipTop: event.clientY,
          });
        }}
        onMouseLeave={() => {
          handleNodeHover(null);
          hideTooltip();
        }}
        onClick={() => handleNodeClick(node.id)}
      >
        <circle r={30} cx={node.x} cy={node.y} fill={"white"} />

        <circle
          className={`node ${
            localSelectedGroup.has(node.id) ? "selected" : ""
          }`}
          r={30}
          cx={node.x}
          cy={node.y}
          fill={colorScale(metricScale(Number(node.stats.avg)))}
          stroke={
            currnetSelectedGroup && currnetSelectedGroup.id === node.id
              ? "black"
              : "none"
          }
          strokeDasharray={
            currnetSelectedGroup && currnetSelectedGroup.id === node.id
              ? "5,5"
              : "none"
          }
        />
        <text
          style={{ userSelect: "none" }}
          className="node-text"
          x={node.x}
          y={node.y - 3}
          textAnchor="middle"
          fontSize={10}
          fontWeight={"bold"}
        >
          {node.name}
        </text>

        <text
          className="node-text"
          x={node.x}
          y={node.y + 13}
          textAnchor="middle"
          fontSize={8}
        >
          {formatting(node.length, "int") + " trials"}
        </text>
      </g>
    ),
    [
      localSelectedGroup,
      handleNodeHover,
      showTooltip,
      hideTooltip,
      handleNodeClick,
    ]
  );

  const LinkComponent = useCallback(
    ({ link }) => {
      const source = nodes.find((n) => n.id === link.source)!;
      const target = nodes.find((n) => n.id === link.target)!;
      const arcHeight = Math.abs(source.x - target.x) * 0.22;

      return (
        <g>
          <path
            className="link"
            d={createArcPath(source, target, arcHeight)}
            strokeWidth={weightScale(link.weight)}
            fill="gray"
          />
          <path
            className="link2"
            d={createArcPath(source, target, arcHeight)}
            strokeWidth={10}
            stroke="transparent"
            fill="none"
            onMouseMove={(event) => {
              showTooltip({
                tooltipData: {
                  key: "Similarity between ",
                  type: "link",
                  value: `${source.name} and ${target.name}`,
                  count: link.weight,
                  stats: {
                    avg: 0,
                    max: 0,
                    min: 0,
                  },
                },
                tooltipLeft: event.clientX,
                tooltipTop: event.clientY,
              });
            }}
            onMouseLeave={() => {
              hideTooltip();
            }}
          />
        </g>
      );
    },
    [nodes, weightScale]
  );

  if (isInitialRender) {
    return (
      <Box ref={boxRef} width="100%" height="100%">
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Trial Group View
        </Heading>

        <Box
          display={"flex"}
          justifyContent={"right"}
          alignItems="center"
          pr={2}
        ></Box>
      </Box>

      {groups?.getLength() > 0 ? (
        <Box
          width={"100%"}
          overflowX={"auto"}
          height="85%"
          p={2}
          display="flex"
        >
          <Box
            width={"100%"}
            ref={boxRef}
            height={"100%"}
            display={"flex"}
            justifyContent={"center"}
            overflow={"auto"}
          >
            <svg
              width={"100%"}
              height={
                groups.getLength() > 6
                  ? (Math.floor(groups.getLength() / 3) * boxHeight) / 4 +
                    boxHeight / 8 +
                    150
                  : "100%"
              }
              onMouseEnter={() => {
                handleNodeHover(null);
                hideTooltip();
                setHoveredLink(null);
              }}
              onMouseLeave={() => {
                handleNodeHover(null);
                hideTooltip();
                setHoveredLink(null);
              }}
            >
              <Graph<CustomLink, CustomNode>
                graph={graphMemo}
                nodeComponent={NodeComponent}
                linkComponent={LinkComponent}
              />
            </svg>
          </Box>

          <Box>
            <svg width={legendWidth} height={legendHeight + legendMargin.top}>
              {thresholdRanges.map((range, i) => (
                <React.Fragment key={`legend-${i}`}>
                  <rect
                    x={0}
                    y={i * (legendHeight / numThresholds) + legendMargin.top}
                    width={legendWidth / 5}
                    height={legendHeight / numThresholds}
                    fill={colorScale(i)}
                    opacity={0.7}
                  />
                  <text
                    x={5 + legendWidth / 5}
                    y={
                      (i + 0.6) * (legendHeight / numThresholds) +
                      legendMargin.top
                    }
                    fontSize="12"
                    textAnchor="start"
                    dominantBaseline="middle"
                    fill="#4A5568"
                  >
                    {`${formatting(range[0], "int")} - ${formatting(
                      range[1],
                      "int"
                    )}`}
                  </text>
                </React.Fragment>
              ))}
              <text
                x={0}
                y={legendMargin.top - 8}
                fontSize="14"
                textAnchor="start"
                fontWeight="bold"
                fill="#4A5568"
              >
                Coverage
              </text>
            </svg>
          </Box>
        </Box>
      ) : (
        <Box
          p={4}
          bg="gray.100"
          m={2}
          height={
            "calc(75%)" // 뷰포트 높이에서 적절한 값을 뺀 높이
          }
        >
          There are no groups to display. Please create a group by clicking the
          "Add Group" button.
        </Box>
      )}
      {tooltipOpen && tooltipData && (
        <TooltipInPortal top={tooltipTop} left={tooltipLeft}>
          <Box>
            <Text fontWeight={"bold"} align={"left"} mb={2}>
              {tooltipData.key} {tooltipData.value}
            </Text>
            {tooltipData.type === "node" ? (
              <>
                <Text align={"left"} mb={1} fontSize={"12px"}>
                  {formatting(tooltipData.count, "int")} trials
                </Text>
                <Text align={"left"} mb={1} fontSize={"12px"}>
                  Max: {formatting(tooltipData.stats.max, "float")}
                </Text>
                <Text align={"left"} mb={1} fontSize={"12px"}>
                  Avg: {formatting(tooltipData.stats.avg, "float")}
                </Text>
                <Text align={"left"} mb={1} fontSize={"12px"}>
                  Min: {formatting(tooltipData.stats.min, "float")}
                </Text>
              </>
            ) : (
              <>
                <Text
                  align={"left"}
                  mb={1}
                  fontSize={"12px"}
                  wordBreak="break-word"
                  overflowWrap="break-word"
                  whiteSpace="normal"
                >
                  # of statistically different hyperparameters:{" "}
                  {formatting(tooltipData.count, "int")} / {hyperparams.length}
                </Text>
              </>
            )}
          </Box>
        </TooltipInPortal>
      )}
    </div>
  );
};

export default TrialGroupView;

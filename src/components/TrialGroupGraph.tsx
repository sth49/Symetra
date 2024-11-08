import { Box, Text } from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Graph } from "@visx/network";
import { performStatisticalTest } from "../model/statistic";
import * as d3 from "d3";
import { formatting, getTextColor } from "../model/utils";
import { useTooltip, useTooltipInPortal } from "@visx/tooltip";
import { useConstDataStore } from "./store/constDataStore";
import { useMetricScale } from "../model/colorScale";
import { ParentSize } from "@visx/responsive";

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

const TrialGroupGraph = () => {
  const { hyperparams } = useConstDataStore();
  const groups = useCustomStore((state) => state.groups);
  const setHoveredGroup = useCustomStore((state) => state.setHoveredGroup);
  const setCurrentSelectedGroup = useCustomStore(
    (state) => state.setCurrentSelectedGroup
  );
  const currnetSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxHeight, setBoxHeight] = useState(0);
  const { metricScale, colorScale } = useMetricScale();

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

  const { nodes, links } = useMemo(() => {
    console.log("GroupView rendering, boxHeight:", boxHeight);
    if (boxHeight === 0) return { nodes: [], links: [] };
    console.log("GroupView rendering");

    const nodes = groups.groups.map(
      (group, i) => ({
        id: group.id,
        name: group.name,
        // x: (((i % 3) + 0.25) * boxRef.current?.clientWidth) / 5,
        // y: (Math.floor(i / 3) * boxHeight) / 4 + boxHeight / 8,
        x: (((i % 4) + 0.25) * boxRef.current?.clientWidth) / 7,
        y: (Math.floor(i / 4) * boxHeight) / 4.5 + boxHeight / 6,
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
        setCurrentSelectedGroup(groups.getGroup(id));
      }
    },
    [currnetSelectedGroup, groups, setCurrentSelectedGroup]
  );

  const NodeComponent = useCallback(
    ({ node }) => (
      <g
        key={node.id}
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
        <circle
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
          fill={getTextColor(colorScale(metricScale(Number(node.stats.avg))))}
        >
          {node.name}
        </text>
        <text
          className="node-text"
          x={node.x}
          y={node.y + 13}
          textAnchor="middle"
          fontSize={8}
          fill={getTextColor(colorScale(metricScale(Number(node.stats.avg))))}
        >
          {formatting(node.length, "int") + " trials"}
        </text>
      </g>
    ),
    [handleNodeHover, showTooltip, hideTooltip, handleNodeClick]
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
      {groups?.getLength() > 0 ? (
        <Box
          width={"100%"}
          overflowX={"auto"}
          height="100%"
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
            <ParentSize>
              {({ width, height }) => (
                <svg
                  width={width}
                  height={
                    groups.getLength() > 6
                      ? (Math.floor(groups.getLength() / 3) * boxHeight) / 4 +
                        boxHeight / 8 +
                        150
                      : height
                  }
                  onMouseEnter={() => {
                    handleNodeHover(null);
                    hideTooltip();
                  }}
                  onMouseLeave={() => {
                    handleNodeHover(null);
                    hideTooltip();
                  }}
                >
                  <Graph<CustomLink, CustomNode>
                    graph={graphMemo}
                    nodeComponent={NodeComponent}
                    linkComponent={LinkComponent}
                  />
                </svg>
              )}
            </ParentSize>
          </Box>
        </Box>
      ) : (
        <Box p={4} bg="gray.100" m={2} height={"100%"}>
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
                  # of statistically different parameters:{" "}
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

export default TrialGroupGraph;

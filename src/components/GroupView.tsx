import { Box, Button, Heading, Text, useDisclosure } from "@chakra-ui/react";
import { useCustomStore } from "../store";

import StatTest from "./StatTest";
import { useCallback, useMemo, useRef, useState } from "react";
import { memo } from "react";
import { Graph } from "@visx/network";
import { performStatisticalTest } from "../model/statistic";
import * as d3 from "d3";
import { formatting } from "../model/utils";

import { useTooltip, useTooltipInPortal } from "@visx/tooltip";
type TooltipData = {
  key: string; // hparam name
  value: any; // hparam value
  count: number; // trial count
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

const GroupView = () => {
  const {
    groups,
    setHoveredGroup,
    selectedGroup,
    hyperparams,
    setSelectedGroup,
  } = useCustomStore();

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

  const [hoveredGroupId, setHoveredGroupId] = useState<number | null>(null);
  const [hoveredLink, setHoveredLink] = useState<CustomLink | null>(null);
  const [localSelectedGroup, setLocalSelectedGroup] = useState<Set<number>>(
    new Set()
  );

  const width = groups.groups.length * 120;

  const { nodes, links } = useMemo(() => {
    console.log("GroupView rendering");
    const nodes = groups.groups.map(
      (group, i) => ({
        id: group.id,
        x: 20 + i * 65,
        y: 45,
        length: group.getLength(),
        stats: group.getStats(),
      }),
      [groups.getLength(), hyperparams]
    );

    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const hparamResult = hyperparams.map((param) => {
          const group1 = groups.groups[i].getHyperparam(param.name);
          const group2 = groups.groups[j].getHyperparam(param.name);
          return performStatisticalTest(group1, group2, param.type, param);
        });
        const weight = hparamResult.filter((r) => r.pValue <= 0.01).length;

        links.push({
          source: nodes[i].id,
          target: nodes[j].id,
          weight,
        });
      }
    }

    return { nodes, links };
  }, [groups.getLength(), hyperparams]);

  const graphMemo = useMemo(() => ({ nodes, links }), [nodes, links]);

  const setHoverGroup = (group) => {
    if (!group) {
      setHoveredGroup(new Set());
      setHoveredGroupId(null);
      return;
    }
    const selected = new Set(group.trials.map((trial) => trial.id));
    setHoveredGroup(selected);
    setHoveredGroupId(group.id);
  };
  const weightScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([0, d3.max(links.map((link) => link.weight))])
      .range([1, 10]);
  }, [links]);

  const handleNodeHover = useCallback(
    (node) => {
      if (node) {
        const group = groups.getGroup(Number(node.id));
        const selected = new Set(group.trials.map((trial) => trial.id));
        setHoveredGroup(selected);
      } else {
        setHoveredGroup(new Set());
      }
    },
    [groups, setHoveredGroup]
  );

  const handleNodeClick = useCallback(
    (id) => {
      const newSelectedGroup = new Set(selectedGroup);
      console.log("Clicked group", id);
      console.log(selectedGroup);
      if (newSelectedGroup.has(id)) {
        newSelectedGroup.delete(id);
      } else {
        newSelectedGroup.add(id);
      }
      setSelectedGroup(newSelectedGroup);
    },
    [selectedGroup, setSelectedGroup]
  );

  const NodeComponent = useCallback(
    ({ node }) => (
      <g
        key={node.id}
        className={`node-group ${selectedGroup.has(node.id) ? "selected" : ""}`}
        onMouseEnter={() => handleNodeHover(node)}
        onMouseMove={(event) => {
          showTooltip({
            tooltipData: {
              key: "Group",
              value: node.id,
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
          className={`node ${selectedGroup.has(node.id) ? "selected" : ""}`}
          r={30}
          cx={node.x}
          cy={node.y}
        />
        <text
          style={{ userSelect: "none" }}
          className="node-text"
          x={node.x}
          y={node.y - 3}
          textAnchor="middle"
          fontSize={12}
          fontWeight={"bold"}
        >
          Group {node.id}
        </text>

        <text
          className="node-text"
          x={node.x}
          y={node.y + 13}
          textAnchor="middle"
          fontSize={10}
        >
          {formatting(node.length, "int")}
        </text>
      </g>
    ),
    [selectedGroup, handleNodeHover, showTooltip, hideTooltip, handleNodeClick]
  );

  const LinkComponent = useCallback(
    ({ link }) => {
      const source = nodes.find((n) => n.id === link.source)!;
      const target = nodes.find((n) => n.id === link.target)!;
      const arcHeight = Math.abs(source.x - target.x) * 0.22;

      return (
        <path
          className="link"
          d={createArcPath(source, target, arcHeight)}
          strokeWidth={link.weight === 0 ? 1 : weightScale(link.weight)}
        />
      );
    },
    [nodes, weightScale]
  );

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Group View
        </Heading>
        <Box
          display={"flex"}
          justifyContent={"right"}
          alignItems="center"
          pr={2}
        >
          <Button
            size={"xs"}
            isDisabled={selectedGroup.size === 0}
            colorScheme="blue"
            onClick={() => {
              if (selectedGroup.size === 0) {
                return;
              } else if (selectedGroup.size === 1) {
                console.log("Single group selected");
              } else if (selectedGroup.size === 2) {
                console.log("Two groups selected");
              }
            }}
          >
            Analysis
          </Button>
        </Box>
      </Box>
      {/* <Modal
        isOpen={isOpen}
        onClose={() => {
          setSelectedGroup(new Set());
          onClose();
        }}
        size={"full"}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text fontSize="lg">Analysis</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box>
              <Text fontWeight={"bold"}>
                {selectedGroup.size === 1
                  ? "Group " + Array.from(selectedGroup)[0] + " vs Others"
                  : "Group " +
                    Array.from(selectedGroup)[0] +
                    " vs Group" +
                    Array.from(selectedGroup)[1]}
              </Text>
              <Text></Text>
              <Text></Text>
              <Text></Text>
            </Box>
            <StatTest
              isOpen={isOpen}
              selectedGroup={selectedGroup}
              groups={groups}
              hyperparams={hyperparams}
              exp={exp}
            />
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => {
                setSelectedGroup(new Set());
                onClose();
              }}
            >
              Close
            </Button>
            <Button variant="ghost">Secondary Action</Button>
          </ModalFooter>
        </ModalContent>
      </Modal> */}

      {groups?.getLength() > 0 ? (
        <Box
          width={"100%"}
          overflowX={"auto"}
          height="80%" // 뷰포트 높이에서 적절한 값을 뺀 높이
          p={2}
          display="flex"
        >
          <Box
            width={width} // 뷰포트 높이에서 적절한 값을 뺀 높이
            height={"100%"}
          >
            <svg
              width={width}
              height={"100%"}
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
              {/* <rect width={width} height={"100%"} fill={"white"} /> */}
              <Graph<CustomLink, CustomNode>
                graph={graphMemo}
                nodeComponent={NodeComponent}
                linkComponent={LinkComponent}
              />
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
          </Box>
        </TooltipInPortal>
      )}
    </div>
  );
};

export default GroupView;

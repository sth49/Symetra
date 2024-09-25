import { Box, Button, Heading, Text, useDisclosure } from "@chakra-ui/react";
import { useCustomStore } from "../store";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import StatTest from "./StatTest";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { memo } from "react";
import { DefaultNode, Graph } from "@visx/network";
import { performStatisticalTest } from "../model/statistic";
import * as d3 from "d3";
import { formatting } from "../model/utils";
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    groups,
    setHoveredGroup,
    selectedGroup,
    hyperparams,
    exp,
    setSelectedGroup,
  } = useCustomStore();

  const [hoveredGroupId, setHoveredGroupId] = useState<number | null>(null);
  const [hoveredLink, setHoveredLink] = useState<CustomLink | null>(null);

  // const [nodes, setNodes] = useState<CustomNode[]>([]);
  // const [links, setLinks] = useState<CustomLink[]>([]);
  // const [graph, setGraph] = useState({});

  // useEffect(() => {
  //   const nodes = groups.groups.map((group, i) => ({
  //     id: group.id.toString(),
  //     x: 10 + i * 30,
  //     y: 30,
  //   }));
  //   for (let i = 0; i < nodes.length; i++) {
  //     for (let j = i + 1; j < nodes.length; j++) {
  //       let hparamResult = hyperparams.map((param) => {
  //         let group1 = groups.groups[i].getHyperparam(param.name);
  //         let group2 = groups.groups[j].getHyperparam(param.name);
  //         return performStatisticalTest(group1, group2, param.type, param);
  //       });
  //       const weight = hparamResult
  //         .map((r) => {
  //           return r.pValue > 0.01 ? 0 : 1;
  //         })
  //         .reduce((a, b) => a + b, 0);

  //       links.push({
  //         source: nodes[i].id,
  //         target: nodes[j].id,
  //         weight: weight,
  //       });
  //     }
  //   }

  //   setNodes(nodes);
  //   setLinks(links);
  //   setGraph({ nodes, links });
  //   console.log("node and link", nodes, links);
  // }, [groups.getLength()]);

  const boxRef = useRef(null);
  const width = groups.groups.length * 120;

  // useEffect(() => {
  //   const handleResize = () => {
  //     if (boxRef.current) {
  //       const newWidth = boxRef.current.offsetWidth;
  //       setWidth(newWidth);
  //     }
  //     setHeight(window.innerHeight * 0.8); // 80vh에 해당
  //   };

  //   const resizeObserver = new ResizeObserver(handleResize);
  //   if (boxRef.current) {
  //     resizeObserver.observe(boxRef.current);
  //   }

  //   handleResize(); // 초기 로드 시 실행

  //   return () => {
  //     if (boxRef.current) {
  //       resizeObserver.unobserve(boxRef.current);
  //     }
  //   };
  // }, []);

  const { nodes, links } = useMemo(() => {
    const nodes = groups.groups.map(
      (group, i) => ({
        id: group.id,
        x: 20 + i * 65,
        y: 45,
        length: group.getLength(),
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
    (nodeId) => {
      setSelectedGroup((prevSelected) => {
        const newSelected = new Set(prevSelected);
        if (newSelected.has(nodeId)) {
          newSelected.delete(nodeId);
        } else {
          if (newSelected.size === 2) {
            newSelected.delete(newSelected.values().next().value);
          }
          newSelected.add(nodeId);
        }
        return newSelected;
      });
    },
    [setSelectedGroup]
  );

  // const NodeComponent = ({ node, onHover, onClick, isSelected, isHovered }) => (
  //   <g>
  //     <circle
  //       onMouseEnter={() => onHover(node)}
  //       onClick={() => onClick(node)}
  //       r={30}
  //       fill={isSelected ? "#3182CE" : isHovered ? "#ECC94B" : "#FAF089"}
  //       cx={node.x}
  //       cy={node.y}
  //     />
  //     <text
  //       style={{ cursor: "pointer" }}
  //       x={node.x}
  //       y={node.y + 5}
  //       textAnchor="middle"
  //       fill={isSelected ? "white" : isHovered ? "white" : "black"}
  //       fontSize={12}
  //     >
  //       {node.id}
  //     </text>
  //   </g>
  // );

  // const LinkComponent = ({
  //   link,
  //   nodes,
  //   weightScale,
  //   isHovered,
  //   isLinkHovered,
  // }) => {
  //   const source = nodes.find((n) => n.id === link.source)!;
  //   const target = nodes.find((n) => n.id === link.target)!;
  //   const arcHeight = Math.abs(source.x - target.x) * 0.22;

  //   return (
  //     <path
  //       d={createArcPath(source, target, arcHeight)}
  //       fill="none"
  //       onMouseEnter={() => isLinkHovered(link)}
  //       stroke={isHovered ? "#ECC94B" : isHovered ? "#FAF089" : "#FAF089"}
  //       strokeWidth={link.weight === 0 ? 1 : weightScale(link.weight)}
  //     />
  //   );
  // };

  const NodeComponent = useCallback(
    ({ node }) => (
      <g>
        <circle
          className={`node ${selectedGroup.has(node.id) ? "selected" : ""}`}
          onMouseEnter={() => handleNodeHover(node)}
          onMouseLeave={() => handleNodeHover(null)}
          onClick={() => handleNodeClick(node.id)}
          r={30}
          cx={node.x}
          cy={node.y}
        />
        <text
          className="node-text"
          x={node.x}
          y={node.y + 5}
          textAnchor="middle"
          fontSize={12}
        >
          {formatting(node.length)}
        </text>
      </g>
    ),
    [selectedGroup, handleNodeHover, handleNodeClick]
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
                onOpen();
              } else if (selectedGroup.size === 2) {
                onOpen();
              }
            }}
          >
            Analysis
          </Button>
        </Box>
      </Box>
      <Modal
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
      </Modal>

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
            <svg width={width} height={"100%"}>
              <rect
                width={width}
                height={"100%"}
                // rx={14}
                fill={"white"}
                onMouseEnter={() => {
                  setHoverGroup(null);
                  setHoveredLink(null);
                }}
                onMouseLeave={() => {
                  setHoverGroup(null);
                  setHoveredLink(null);
                }}
              />
              <Graph<CustomLink, CustomNode>
                graph={graphMemo}
                nodeComponent={NodeComponent}
                linkComponent={LinkComponent}
                // nodeComponent={({ node }) => (
                //   <g>
                //     <circle
                //       className={`node ${
                //         selectedGroup.has(node.id) ? "selected" : ""
                //       }`}
                //       onMouseEnter={() => {
                //         setHoveredLink(null);
                //         setHoverGroup(groups.getGroup(Number(node.id)));
                //       }}
                //       onMouseLeave={() => {
                //         setHoverGroup(null);
                //       }}
                //       r={30}
                //       cx={node.x}
                //       cy={node.y}
                //     />
                //     <text
                //       onClick={() => {
                //         console.log("click", node.id);
                //         if (selectedGroup.has(node.id)) {
                //           selectedGroup.delete(node.id);
                //         } else {
                //           if (selectedGroup.size === 2) {
                //             selectedGroup.delete(
                //               selectedGroup.values().next().value
                //             );
                //           }
                //           selectedGroup.add(node.id);
                //         }
                //         setSelectedGroup(selectedGroup);
                //         console.log(selectedGroup);
                //       }}
                //       style={{ cursor: "pointer" }}
                //       x={node.x}
                //       y={node.y + 5}
                //       textAnchor="middle"
                //       fill={
                //         selectedGroup.has(node.id)
                //           ? "white"
                //           : hoveredGroupId === Number(node.id)
                //           ? "white"
                //           : "black"
                //       }
                //       fontSize={12}
                //     >
                //       {node.id}
                //     </text>
                //   </g>
                // )}
                // linkComponent={({ link }) => {
                //   const source = nodes.find((n) => n.id === link.source)!;
                //   const target = nodes.find((n) => n.id === link.target)!;
                //   const arcHeight = Math.abs(source.x - target.x) * 0.22;
                //   // console.log(createArcPath(source, target, arcHeight));
                //   return (
                //     <path
                //       d={createArcPath(source, target, arcHeight)}
                //       fill="none"
                //       onMouseEnter={() => {
                //         setHoverGroup(null);

                //         setHoveredLink(link);
                //       }}
                //       onClick={() => {
                //         console.log("click", link);
                //       }}
                //       stroke={
                //         hoveredLink !== null &&
                //         hoveredLink.source === link.source &&
                //         hoveredLink.target === link.target
                //           ? "#ECC94B"
                //           : hoveredGroupId !== null &&
                //             (hoveredGroupId === Number(link.source) ||
                //               hoveredGroupId === Number(link.target))
                //           ? "#ECC94B"
                //           : "#FAF089"
                //         // hoveredGroupId !== null &&
                //         // (hoveredGroupId === Number(link.source) ||
                //         //   hoveredGroupId === Number(link.target))
                //         //   ? "#ECC94B"
                //         //   : "#FAF089"
                //       }
                //       strokeWidth={
                //         link.weight === 0 ? 1 : weightScale(link.weight)
                //       }
                //       // strokeOpacity={0.5}
                //       // strokeOpacity={
                //       //   hoveredGroupId !== null &&
                //       //   (hoveredGroupId === Number(link.source) ||
                //       //     hoveredGroupId === Number(link.target))
                //       //     ? 0.6
                //       //     : 0.1
                //       // }
                //     />
                //   );
                // }}
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
          {/* <svg width={width} height={height}>
            <rect width={width} height={height} rx={14} fill={"white"} />
            <Graph<CustomLink, CustomNode>
              graph={graph}
              nodeComponent={({ node }) => (
                <g>
                  <circle
                    r={15}
                    fill={node.color || "#999"}
                    cx={node.x}
                    cy={node.y}
                  />
                  <text
                    x={node.x}
                    y={node.y + 25}
                    textAnchor="middle"
                    fill="#black"
                    fontSize={12}
                  >
                    {node.id}
                  </text>
                </g>
              )}
              linkComponent={({ link }) => {
                const source = nodes.find((n) => n.id === link.source)!;
                const target = nodes.find((n) => n.id === link.target)!;
                const arcHeight = Math.abs(source.x - target.x) * 0.2;
                console.log(createArcPath(source, target, arcHeight));
                return (
                  <path
                    d={createArcPath(source, target, arcHeight)}
                    fill="none"
                    stroke="red"
                    strokeWidth={link.weight}
                    strokeOpacity={0.6}
                    strokeDasharray={link.dashed ? "8,4" : undefined}
                  />
                );
              }}
            />
          </svg> */}
        </Box>
      )}
    </div>
  );
};

export default memo(GroupView);

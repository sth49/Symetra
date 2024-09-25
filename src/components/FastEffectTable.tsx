import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useCustomStore } from "../store";
import AutoSizer from "react-virtualized-auto-sizer";
import { Box, Button, Heading, Icon, IconButton, Text } from "@chakra-ui/react";
import { FaEye } from "react-icons/fa6";
import { FaEyeSlash } from "react-icons/fa6";
import * as d3 from "d3";
import BarChart from "./BarChart";
import { FaAngleLeft } from "react-icons/fa6";
import { FaAngleUp } from "react-icons/fa6";
import { FaAngleDown } from "react-icons/fa6";
import { FaSort } from "react-icons/fa6";
import { FaSortUp } from "react-icons/fa6";
import { FaSortDown } from "react-icons/fa6";
import { ViolinPlot, BoxPlot } from "@visx/stats";
type TooltipData = {
  key: string;
  value: number;
};
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";
import { formatting, generateBinnedData } from "../model/utils";
const FastEffectTable = () => {
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
  });
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<TooltipData>();

  const { exp, hyperparams, setHyperparams } = useCustomStore();

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "none", // ascending or descending
  });
  const [sortedData, setSortedData] = useState([]);

  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const scrollContainerRef = useRef(null);
  const headerRef = useRef(null);

  const [expandedRows, setExpandedRows] = useState(new Set());

  const data = useMemo(
    () =>
      exp?.hyperparams
        .sort((a, b) => Math.abs(b.getEffect()) - Math.abs(a.getEffect()))
        .map((hp, index) => ({
          id: index,
          name: hp.displayName,
          fullName: hp.name,
          displayName: hp.displayName,
          effect: hp.getEffect(),
          effctsByValue: hp.getEffectsByValue(),
          dist: hp.name,
        })),

    [exp]
  );

  const requestSort = useCallback((key) => {
    setSortConfig((prevConfig) => ({
      key:
        prevConfig.key === key && prevConfig.direction === "descending"
          ? null
          : key,
      direction:
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }, []);

  useEffect(() => {
    let sortedItems = [...data];
    if (sortConfig.key !== null) {
      sortedItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    setSortedData(sortedItems);
  }, [data, sortConfig]);

  const columns = useMemo(
    () => [
      {
        key: "visible",
        label: "",
        width: 40,
        align: "left",
      },
      { key: "name", label: "Name", width: 65, align: "left" },

      { key: "effect", label: "Effect", width: 45, align: "right" },
      {
        key: "dist",
        label: "Distribution",
        width: 100,
        align: "center",
      },
      {
        key: "expander",
        label: "",
        width: 56,
        align: "left",
      },
    ],
    [exp]
  );

  const totalWidth = useMemo(
    () => columns.reduce((sum, col) => sum + col.width, 0),
    [columns]
  );

  const toggleRowSelection = (index, shiftKey) => {
    if (shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSelectedRows = new Set(selectedRows);
      for (let i = start; i <= end; i++) {
        newSelectedRows.add(i);
      }
      setSelectedRows(newSelectedRows);
      setIsMultiSelect(true);
    } else if (isMultiSelect) {
      setSelectedRows(new Set());
      setIsMultiSelect(false);
    } else {
      const newSelectedRows = new Set(selectedRows);
      if (newSelectedRows.has(index)) {
        newSelectedRows.delete(index);
      } else {
        newSelectedRows.add(index);
      }
      setSelectedRows(newSelectedRows);
    }
    setLastSelectedIndex(index);
  };

  const Row = useCallback(
    ({ item, index }) => {
      // const isHovered = hoveredRow === item.id;
      const isSelected = selectedRows.has(item.id);
      const isExpanded = expandedRows.has(item.id);
      const isLastSelected =
        selectedRows.size > 0 &&
        Array.from(selectedRows).sort((a, b) => data[a].id - data[b].id)[
          selectedRows.size - 1
        ] === index;
      const hp = hyperparams.find((hp) => hp.displayName === item.name);
      const hparamIcon = hp?.icon;

      return (
        <>
          <div
            className={`virtual-table-row ${isSelected ? "selected" : ""}`}
            style={{
              display: "flex",
              width: totalWidth,
              alignItems: "center",
            }}
            onClick={(e) => toggleRowSelection(index, e.shiftKey)}
          >
            {columns.map((column) => (
              <div
                key={column.key}
                style={{
                  width: `${column.width}px`,
                  padding: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  display: "flex",
                  justifyContent: column.align,
                }}
              >
                {column.key === "checked" ? (
                  <input
                    style={{ marginLeft: "8px" }}
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) =>
                      toggleRowSelection(index, e.nativeEvent.shiftKey)
                    }
                  />
                ) : column.key === "visible" ? (
                  <Text fontSize={"xs"}>
                    <IconButton
                      size={"xs"}
                      icon={
                        hyperparams.find((hp) => hp.displayName === item.name)
                          ?.visible ? (
                          <Icon as={FaEye} color={"gray.500"} />
                        ) : (
                          <Icon as={FaEyeSlash} color={"gray.500"} />
                        )
                      }
                      // colorScheme="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newHyperparams = hyperparams.map((hp, i) => {
                          if (i === index) {
                            hp.visible = !hp.visible;
                          }
                          return hp;
                        });
                        setHyperparams([...newHyperparams]);
                      }}
                      aria-label={""}
                    />
                  </Text>
                ) : column.key === "dist" ? (
                  <BarChart dist={item.dist} width={70} height={30} />
                ) : column.key === "name" ? (
                  <Box
                    display={"flex"}
                    alignItems={"center"}
                    onMouseEnter={(e) => {
                      showTooltip({
                        tooltipLeft: e.clientX,
                        tooltipTop: e.clientY,
                        tooltipData: { key: item.fullName, value: item.name },
                      });
                    }}
                    onMouseLeave={hideTooltip}
                  >
                    <Text
                      userSelect={"none"}
                      fontSize={"xs"}
                      display={"flex"}
                      alignItems={"center"}
                    >
                      <Icon as={hparamIcon} mr={1} color={"gray.600"} />
                      {item[column.key]}
                    </Text>
                  </Box>
                ) : column.key === "effect" ? (
                  <Text userSelect={"none"} fontSize={"xs"}>
                    {item[column.key].toFixed(1)}
                  </Text>
                ) : column.key === "expander" ? (
                  <IconButton
                    size={"xs"}
                    icon={
                      !isExpanded ? (
                        <Icon as={FaAngleDown} color={"gray.500"} />
                      ) : (
                        <Icon as={FaAngleUp} color={"gray.500"} />
                      )
                    }
                    // colorScheme="blue"
                    onClick={(e) => toggleRowExpansion(item.id, e)}
                    aria-label={""}
                  />
                ) : (
                  <div>asdf</div>
                )}
              </div>
            ))}
          </div>

          {isExpanded && (
            <div style={{ padding: "10px", backgroundColor: "#f9f9f9" }}>
              <Box
                display={"flex"}
                flexDir={"column"}
                alignItems={"center"}
                justifyContent={"space-between"}
                whiteSpace={"nowrap"}
                overflowX={"auto"}
                textOverflow={"ellipsis"}
                userSelect={"none"}
                w={"100%"}
              >
                <Box
                  width={"100%"}
                  display={"flex"}
                  alignItems={"center"}
                  borderBottom={"1px solid #ddd"}
                >
                  <Box width={"20%"}>
                    <Text fontSize={"xs"} fontWeight={"bold"} align="center">
                      {item.name}
                    </Text>
                  </Box>
                  <Box width={"15%"}>
                    <Text fontSize={"xs"} fontWeight={"bold"} align="center">
                      Count
                    </Text>
                  </Box>
                  <Box width={"15%"}>
                    <Text fontSize={"xs"} fontWeight={"bold"} align="center">
                      Effect
                    </Text>
                  </Box>
                  <Box width={"40%"}>
                    <Text fontSize={"xs"} fontWeight={"bold"} align="center">
                      {/* Distribution */}
                    </Text>
                  </Box>
                </Box>
                {Object.keys(item.effctsByValue).map((key) => {
                  console.log(key);
                  const { binData, xScale } = generateBinnedData(
                    item.effctsByValue[key],
                    100,
                    30,
                    "x"
                  );
                  return (
                    <Box display={"flex"} width={"100%"} alignItems={"center"}>
                      <Box width={"20%"}>
                        <Text fontSize={"xs"} align="center">
                          {key}
                        </Text>
                      </Box>
                      <Box width={"15%"}>
                        <Text fontSize={"xs"} align="right">
                          {formatting(item.effctsByValue[key].length, "int")}
                        </Text>
                      </Box>
                      <Box width={"15%"}>
                        <Text fontSize={"xs"} align="right">
                          {formatting(
                            item.effctsByValue[key].reduce((a, b) => a + b, 0) /
                              item.effctsByValue[key].length,
                            "float"
                          )}
                        </Text>
                      </Box>
                      <Box
                        width={"50%"}
                        display={"flex"}
                        justifyContent={"center"}
                      >
                        <svg width={100} height={36}>
                          <ViolinPlot
                            data={binData}
                            valueScale={xScale}
                            width={25}
                            height={100}
                            horizontal={true}
                            left={0}
                            top={4}
                            // stroke={"black"}
                            fill="grey"
                            // strokeWidth={1}
                          ></ViolinPlot>
                        </svg>
                      </Box>
                    </Box>
                  );
                })}
                {/* {Object.keys(item.shapValues).map((key) => {
                  const hp = hyperparams.find(
                    (hp) => hp.displayName === item.name
                  );

                  let filterFunction;
                  if (hp.type === HyperparamTypes.Continuous) {
                    // console.log("continuous", key);
                    const [min, max] = key.split("~").map(Number);
                    console.log("min, max:", min, max);
                    filterFunction = (trial) => {
                      const value = trial.params[item.fullName];
                      return value >= min && value <= max;
                    };
                  } else {
                    const keyString = key.toString();
                    filterFunction = (trial) =>
                      trial.params[item.fullName].toString() === keyString;
                    console.log(hp?.getEffectsByValue());
                  }

                  const trials = exp?.trials.filter(filterFunction);
                  // console.log("trials:", trials);
                  return (
                    <Box
                      key={key}
                      width={"100%"}
                      display={"flex"}
                      alignItems={"center"}
                    >
                      <Box width={"40%"}>
                        <Text fontSize={"xs"} align="center">
                          {key}
                        </Text>
                        <Text fontSize={"xs"} align="center">
                          ({formatting(trials?.length, "int")})
                        </Text>
                      </Box>
                      <Box
                        width={"20%"}
                        height={"100%"}
                        // border={"1px solid #ffffff"}
                        bg={shapleyColorScale(item.shapValues[key])}
                        color={
                          Math.abs(item.shapValues[key]) < 0.5
                            ? "black"
                            : "white"
                        }
                      >
                        <Text fontSize={"xs"} align="right">
                          {item.shapValues[key].toFixed(3)}
                        </Text>
                      </Box>
                    </Box>
                  );
                })} */}
              </Box>
              {/* Add more expanded content here */}
            </div>
          )}
          {isSelected && isLastSelected && (
            <Box
              display={"flex"}
              width={"100%"}
              justifyContent={"space-between"}
              p={"10px 0"}
              bgColor={"#f9f9f9"}
            >
              <Button
                size={"xs"}
                width={"48%"}
                height={"40px"}
                isDisabled={selectedRows.size === 0}
                onClick={() => toggleVisibilityForSelected(true)}
                colorScheme="blue"
                whiteSpace="normal"
                display={"flex"}
                wordBreak="break-word"
                ml={0.5}
                fontSize={"10px"}
              >
                <Icon as={FaEye} />
                Show selected hyperparameters ({selectedRows.size})
              </Button>
              <Button
                size={"xs"}
                width={"48%"}
                height={"40px"}
                isDisabled={selectedRows.size === 0}
                onClick={() => toggleVisibilityForSelected(false)}
                colorScheme="blue"
                display={"flex"}
                whiteSpace="normal"
                wordBreak="break-word"
                mr={0.5}
                fontSize={"10px"}
              >
                <Icon as={FaEyeSlash} />
                Hide selected hyperparameters ({selectedRows.size})
              </Button>
            </Box>
          )}
        </>
      );
    },
    [columns, totalWidth, selectedRows, expandedRows]
  );

  const shapleyColorScale = useMemo(
    () => d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]),
    []
  );

  const toggleRowExpansion = useCallback((id, e) => {
    e.stopPropagation();
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleVisibilityForSelected = (visible) => {
    // console.log("clicked, visible:", visible);
    // console.log("selectedRows:", selectedRows);

    const newHyperparams = hyperparams.map((hp, index) => {
      if (selectedRows.has(index)) {
        hp.visible = visible;
      }
      return hp;
    });
    setHyperparams([...newHyperparams]);
    setSelectedRows(new Set());
  };

  const handleScroll = () => {
    if (scrollContainerRef.current && headerRef.current) {
      headerRef.current.scrollLeft = scrollContainerRef.current.scrollLeft;
    }
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      {/* <style>{tableStyles}</style> */}
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Hyperparameter View ({hyperparams.filter((hp) => hp.visible).length} /{" "}
          {hyperparams.length} Visible)
        </Heading>
      </Box>

      {/* <Box
        display={"flex"}
        width={"100%"}
        justifyContent={"space-around"}
        p={"2px"}
        visibility={selectedRows.size === 0 ? "hidden" : "visible"}
      >
        <Button
          size={"xs"}
          isDisabled={selectedRows.size === 0}
          onClick={() => toggleVisibilityForSelected(true)}
          colorScheme="blue"
        >
          Show {selectedRows.size} Hyperparameters
        </Button>
        <Button
          size={"xs"}
          isDisabled={selectedRows.size === 0}
          onClick={() => toggleVisibilityForSelected(false)}
          colorScheme="blue"
          variant={"outline"}
        >
          Hide {selectedRows.size} Hyperparameters
        </Button>
      </Box> */}

      <AutoSizer>
        {({ height, width }) => (
          <div
            style={{
              height: height - 35,
              width,
              overflowX: "auto",
              overflowY: "hidden",
              padding: "0 4px",
            }}
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            <div style={{ width: totalWidth }}>
              <div
                ref={headerRef}
                style={{
                  display: "flex",
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                  backgroundColor: "white",
                }}
              >
                {columns.map((column) => (
                  <div
                    key={column.key}
                    style={{
                      display: "flex",
                      width: `${column.width}px`,
                      padding: "2px",
                      borderBottom: "1px solid #ddd",
                      cursor: "pointer",
                      flexShrink: 0,
                      justifyContent: column.align,
                      alignItems: "center",
                      height: "35px",
                    }}
                    onClick={() => {
                      if (column.key === "name" || column.key === "effect") {
                        requestSort(column.key);
                      }
                    }}
                  >
                    <Text fontSize={"xs"} fontWeight={"bold"}>
                      {column.label}
                    </Text>
                    {(column.key === "name" || column.key === "effect") && (
                      // <IconButton
                      //   size={"xs"}
                      //   icon={
                      //     sortConfig.key === column.key ? (
                      //       sortConfig.direction === "ascending" ? (
                      //         <Icon as={FaSortUp} color={"gray.500"} />
                      //       ) : (
                      //         <Icon as={FaSortDown} color={"gray.500"} />
                      //       )
                      //     ) : (
                      //       <Icon as={FaSort} color={"gray.500"} />
                      //     )
                      //   }
                      //   onClick={() => {
                      //     if (
                      //       column.key === "name" ||
                      //       column.key === "effect"
                      //     ) {
                      //       requestSort(column.key);
                      //     }
                      //   }}
                      //   aria-label={""}
                      // />
                      <Icon
                        color={"gray"}
                        width={2}
                        ml={1}
                        as={
                          sortConfig.key === column.key
                            ? sortConfig.direction === "ascending"
                              ? FaSortUp
                              : FaSortDown
                            : FaSort
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div
              className={`virtual-table`}
              style={{
                height: height - 75,
                overflowY: "scroll",
                overflowX: "hidden",
                position: "relative",
              }}
            >
              {sortedData.map((item, index) => (
                <Row key={item.id} item={item} index={index} />
              ))}
            </div>
          </div>
        )}
      </AutoSizer>
      {tooltipOpen && tooltipData && (
        <TooltipInPortal top={tooltipTop} left={tooltipLeft}>
          <div>
            <strong>{tooltipData.key}</strong>
          </div>
          <div></div>
        </TooltipInPortal>
      )}
    </div>
  );
};

export default FastEffectTable;

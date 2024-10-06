import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { Box, Button, Heading, Icon, IconButton, Text } from "@chakra-ui/react";
import { FaEye } from "react-icons/fa6";
import { FaEyeSlash } from "react-icons/fa6";
import BarChart from "./BarChart";
import { FaAngleUp } from "react-icons/fa6";
import { FaAngleDown } from "react-icons/fa6";
import { FaSort } from "react-icons/fa6";
import { FaSortUp } from "react-icons/fa6";
import { FaSortDown } from "react-icons/fa6";
import { ViolinPlot, BoxPlot } from "@visx/stats";
import { Axis, Orientation, SharedAxisProps, AxisScale } from "@visx/axis";
type TooltipData = {
  key: string;
  value: number;
};
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";
import { formatting, generateBinnedData } from "../model/utils";
import { HyperparamTypes } from "../model/hyperparam";
import { useConstDataStore } from "./store/constDataStore";
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

  const { exp, hyperparams, setHyperparams } = useConstDataStore();

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
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
          type: hp.type,
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
    const newHyperparams = hyperparams.map((hp, index) => {
      if (selectedRows.has(index)) {
        hp.visible = visible;
      }
      return hp;
    });
    setHyperparams([...newHyperparams]);
    setSelectedRows(new Set());
  };

  const Row = useCallback(
    ({ item, index }) => {
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
            className={`hyperparameter-table-row ${
              isSelected ? "selected" : ""
            }`}
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
                {column.key === "visible" ? (
                  <Text fontSize={"smaller"}>
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
                      display={"flex"}
                      alignItems={"center"}
                    >
                      <Icon as={hparamIcon} mr={1} color={"gray.600"} />
                      {item[column.key]}
                    </Text>
                  </Box>
                ) : column.key === "effect" ? (
                  <Text userSelect={"none"}>{item[column.key].toFixed(1)}</Text>
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
                {Object.keys(item.effctsByValue)
                  .sort((a, b) => {
                    const aSum = item.effctsByValue[a].reduce(
                      (a, b) => a + b,
                      0
                    );
                    const bSum = item.effctsByValue[b].reduce(
                      (a, b) => a + b,
                      0
                    );
                    return bSum - aSum;
                  })

                  .map((key) => {
                    console.log(item.effctsByValue[key]);
                    // scale from all data
                    const allEffectByValue = Object.values(
                      item.effctsByValue
                    ).flat() as number[];
                    const { a, xScale } = generateBinnedData(
                      allEffectByValue,
                      100,
                      30,
                      "x"
                    );
                    const { binData, b } = generateBinnedData(
                      item.effctsByValue[key],
                      100,
                      30,
                      "x"
                    );
                    return (
                      <Box
                        display={"flex"}
                        width={"100%"}
                        alignItems={"center"}
                        mb={1.5}
                      >
                        <Box width={"20%"}>
                          <Text
                            fontSize={"xs"}
                            align="center"
                            whiteSpace="pre-line"
                          >
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
                              item.effctsByValue[key].reduce(
                                (a, b) => a + b,
                                0
                              ),
                              "float"
                            )}
                          </Text>
                        </Box>
                        <Box
                          width={"50%"}
                          display={"flex"}
                          justifyContent={"center"}
                        >
                          <svg width={120} height={36}>
                            <g transform="translate(10, 0)">
                              {" "}
                              <ViolinPlot
                                data={binData}
                                valueScale={xScale}
                                width={26}
                                height={100}
                                horizontal={true}
                                top={5}
                                fill="grey"
                              />
                              <Axis
                                scale={xScale}
                                orientation={Orientation.bottom}
                                top={18}
                                numTicks={2}
                                tickValues={[
                                  xScale.domain()[0],
                                  xScale.domain()[1],
                                ]}
                              />
                              {(() => {
                                const medianValue = allEffectByValue.sort(
                                  (a, b) => a - b
                                )[Math.floor(allEffectByValue.length / 2)];
                                const medianX = xScale(medianValue);
                                return (
                                  <line
                                    x1={medianX}
                                    y1={4} // ViolinPlot의 top 값
                                    x2={medianX}
                                    y2={32} // Axis의 top 값
                                    stroke="red"
                                    strokeWidth={1}
                                    strokeDasharray="2,2"
                                  />
                                );
                              })()}
                            </g>
                          </svg>
                        </Box>
                      </Box>
                    );
                  })}
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
    [
      selectedRows,
      expandedRows,
      hyperparams,
      totalWidth,
      columns,
      data,
      toggleRowSelection,
      hideTooltip,
      setHyperparams,
      showTooltip,
      toggleRowExpansion,
      toggleVisibilityForSelected,
    ]
  );

  const handleScroll = () => {
    if (scrollContainerRef.current && headerRef.current) {
      headerRef.current.scrollLeft = scrollContainerRef.current.scrollLeft;
    }
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
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
                      fontSize: "smaller",
                    }}
                    onClick={() => {
                      if (column.key === "name" || column.key === "effect") {
                        requestSort(column.key);
                      }
                    }}
                  >
                    <Text fontWeight={"bold"}>{column.label}</Text>
                    {(column.key === "name" || column.key === "effect") && (
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
              className={`hyperparameter-table`}
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

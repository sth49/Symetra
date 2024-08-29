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
import { FaAngleDown } from "react-icons/fa6";
import { FaSort } from "react-icons/fa6";
import { FaSortUp } from "react-icons/fa6";
import { FaSortDown } from "react-icons/fa6";

const FastEffectTable = () => {
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
          displayName: hp.displayName,
          effect: hp.getEffect(),
          shapValues: hp.getEffectByValue(),
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
        key: "checked",
        label: (
          <input
            type="checkbox"
            style={{ marginLeft: "8px" }}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedRows(new Set(data.map((item) => item.id)));
              } else {
                setSelectedRows(new Set());
              }
            }}
          />
        ),
        width: 36,
        align: "left",
      },
      { key: "name", label: "Name", width: 65, align: "left" },

      { key: "effect", label: "Effect", width: 45, align: "right" },
      {
        key: "dist",
        label: "Distribution",
        width: 110,
        align: "center",
      },
      // { key: "shapValues", label: "SHAP", width: 100 },
      {
        key: "visible",
        label: "Visible",
        width: 40,
        align: "left",
      },
      {
        key: "expander",
        label: "",
        width: 40,
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
                          <Icon as={FaEye} />
                        ) : (
                          <Icon as={FaEyeSlash} />
                        )
                      }
                      colorScheme="blue"
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
                  <Box display={"flex"} alignItems={"center"}>
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
                ) : column.key === "shapValues" ? (
                  (() => {
                    let value = item[column.key];
                    return (
                      <Box
                        display={"flex"}
                        alignItems={"center"}
                        justifyContent={"space-between"}
                        whiteSpace={"nowrap"}
                        overflowX={"auto"}
                        textOverflow={"ellipsis"}
                        maxWidth={"130px"}
                        userSelect={"none"}
                      >
                        {Object.keys(value).map((key) => (
                          <Box
                            key={key}
                            p={0.5}
                            background={shapleyColorScale(value[key])}
                            color={
                              Math.abs(value[key]) < 0.5 ? "black" : "white"
                            }
                            display={"flex"}
                            flexDir={"column"}
                            alignItems={"center"}
                            border={"1px solid #ffffff"}
                          >
                            <Text fontSize={"xs"} fontWeight={"bold"}>
                              {key}
                            </Text>
                            <Text fontSize={"xs"}>{value[key].toFixed(2)}</Text>
                          </Box>
                        ))}
                      </Box>
                    );
                  })()
                ) : column.key === "expander" ? (
                  <Icon
                    as={isExpanded ? FaAngleDown : FaAngleLeft}
                    onClick={(e) => toggleRowExpansion(item.id, e)}
                    color="gray"
                  />
                ) : (
                  <div>asdf</div>
                )}
              </div>
            ))}
          </div>
          {isSelected && isLastSelected && (
            <Box
              display={"flex"}
              width={"100%"}
              justifyContent={"space-around"}
              p={"10px 0"}
            >
              <Button
                size={"xs"}
                isDisabled={selectedRows.size === 0}
                onClick={() => toggleVisibilityForSelected(true)}
                colorScheme="blue"
              >
                Show {selectedRows.size} Hparams.
              </Button>
              <Button
                size={"xs"}
                isDisabled={selectedRows.size === 0}
                onClick={() => toggleVisibilityForSelected(false)}
                colorScheme="blue"
                variant={"outline"}
              >
                Hide {selectedRows.size} Hparams.
              </Button>
            </Box>
          )}

          {isExpanded && (
            <div style={{ padding: "10px", backgroundColor: "#f9f9f9" }}>
              <Text fontSize="sm">Shap values of {item.name}</Text>
              <Box
                display={"flex"}
                alignItems={"center"}
                justifyContent={"space-between"}
                whiteSpace={"nowrap"}
                overflowX={"auto"}
                textOverflow={"ellipsis"}
                userSelect={"none"}
              >
                {Object.keys(item.shapValues).map((key) => (
                  <Box
                    key={key}
                    p={0.5}
                    background={shapleyColorScale(item.shapValues[key])}
                    color={
                      Math.abs(item.shapValues[key]) < 0.5 ? "black" : "white"
                    }
                    display={"flex"}
                    flexDir={"column"}
                    alignItems={"center"}
                    border={"1px solid #ffffff"}
                  >
                    <Text fontSize={"xs"} fontWeight={"bold"}>
                      {key}
                    </Text>
                    <Text fontSize={"xs"}>
                      {item.shapValues[key].toFixed(3)}
                    </Text>
                  </Box>
                ))}
              </Box>
              {/* Add more expanded content here */}
            </div>
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
          {hyperparams.filter((hp) => hp.visible).length} Visible)
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
                      ></Icon>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div
              className={`virtual-table`}
              style={{
                height: height - 65,
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
    </div>
  );
};

export default FastEffectTable;

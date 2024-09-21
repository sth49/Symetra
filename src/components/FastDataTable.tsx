import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useCustomStore } from "../store";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  IconButton,
  Switch,
  Text,
} from "@chakra-ui/react";
import { HyperparamTypes } from "../model/hyperparam";
import { FaSort } from "react-icons/fa6";
import { FaSortUp } from "react-icons/fa6";
import { FaSortDown } from "react-icons/fa6";
import { formatting } from "../model/utils";

interface FastDataTableProps {
  onSelectTrial: any;
}

const FastDataTable: React.FC<FastDataTableProps> = ({ onSelectTrial }) => {
  const { exp, hyperparams, setGroups, groups } = useCustomStore();
  const [sortedData, setSortedData] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "metric",
    direction: "descending", // ascending or descending
  });
  const rowRefs = useRef({});
  const [isScrolling, setIsScrolling] = useState(false);
  let scrollTimer = null;
  const [lastSelectedTrialId, setLastSelectedTrialId] = useState(null);

  // const handleRowClick = useCallback(
  //   (trialId, index) => {
  //     const rowElement = rowRefs.current[index];
  //     if (rowElement) {
  //       const rect = rowElement.getBoundingClientRect();
  //       const tableContainer = rowElement.closest(".virtual-table");
  //       const tableRect = tableContainer
  //         ? tableContainer.getBoundingClientRect()
  //         : { top: 0, left: 0 };

  //       console.log("Row position:", rect); // 디버깅: 행 위치 로깅
  //       console.log("Table position:", tableRect); // 디버깅: 테이블 위치 로깅
  //       onSelectTrial(
  //         trialId,
  //         {
  //           top: rect.bottom,
  //           left: rect.left,
  //           height: rect.height,
  //           width: rect.width,
  //         },
  //         isScrolling
  //       );
  //     } else {
  //       console.warn("Row element not found for index:", index); // 디버깅: 행 요소를 찾지 못한 경우
  //     }
  //   },
  //   [onSelectTrial, isScrolling]
  // );

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [isMultiSelect, setIsMultiSelect] = useState(false);

  const [visible, setVisible] = useState(false);
  const [columnGroup, setColumnGroup] = useState(null);
  const scrollContainerRef = useRef(null);
  const headerRef = useRef(null);

  const data = useMemo(
    () =>
      exp?.trials.map((trial) => ({
        id: trial.id,
        metric: trial.metric,
        ...trial.params,
      })) || [],
    [exp]
  );

  const columns = useMemo(
    () => [
      {
        key: "checked",
        label: (
          <input
            type="checkbox"
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedRows(new Set(data.map((item) => item.id)));
              } else {
                setSelectedRows(new Set());
              }
            }}
          />
        ),
        width: 40,
        visibility: true,
        type: "checkbox",
        hp: null,
        canGroup: false,
        isGroup: false,
      },
      {
        key: "id",
        label: "ID",
        width: 30,
        visibility: true,
        type: "string",
        hp: null,
        canGroup: false,
        isGroup: false,
      },
      {
        key: "metric",
        label: "Coverage",
        width: 60,
        visibility: true,
        type: "numerical",
        hp: null,
        canGroup: true,
        isGroup: false,
      },
      ...(exp?.hyperparams.map((hp) => ({
        key: hp.name,
        label: hp.displayName,
        width: 55,
        visibility: hp.visible,
        type: hp.type,
        hp: hp,
        canGroup: true,
        isGroup: false,
      })) || []),
    ],
    [exp, hyperparams]
  );

  const totalWidth = useMemo(
    () => columns.reduce((sum, col) => sum + col.width, 0),
    [columns]
  );

  useEffect(() => {
    const sortedItems = [...data];
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

  // const groupByColumn = (columnKey) => {
  //   if (columnGroup && columnGroup.key === columnKey) {
  //     setColumnGroup(null);
  //     return;
  //   }

  //   if (columnKey === "metric") {
  //     return;
  //   }

  //   const hp = hyperparams.find((hp) => hp.name === columnKey);

  //   if (hp.type === HyperparamTypes.Numerical) {
  //     return;
  //   } else if (
  //     hp.type === HyperparamTypes.Categorical ||
  //     hp.type === HyperparamTypes.Boolean
  //   ) {
  //     const unqiueValues = hp.value;
  //     console.log("unqiueValues", unqiueValues);

  //     setColumnGroup({
  //       key: columnKey,
  //       values: unqiueValues,
  //       groups: unqiueValues.map((value) => ({
  //         key: value,
  //         trials: data.filter((trial) => trial[columnKey] === value),
  //       })),
  //     });
  //   }
  // };

  const handleRowClick = useCallback(
    (trialId, index) => {
      setLastSelectedTrialId(trialId);
      const rowElement = rowRefs.current[index];
      if (rowElement) {
        const rect = rowElement.getBoundingClientRect();
        onSelectTrial(
          trialId,
          {
            top: rect.bottom,
            left: rect.left,
            height: rect.height,
            width: rect.width,
          },
          isScrolling
        );
      } else {
        console.warn("Row element not found for index:", index);
      }
    },
    [onSelectTrial, isScrolling]
  );
  const updateSelectedTrials = useCallback(
    (newSelectedRows: Set<string>) => {
      const selectedTrialArray = Array.from(newSelectedRows);
      const positions = selectedTrialArray
        .map((trialId) => {
          const index = sortedData.findIndex((item) => item.id === trialId);
          const rowElement = rowRefs.current[index];
          if (rowElement) {
            const rect = rowElement.getBoundingClientRect();
            return {
              top: rect.bottom,
              left: rect.left,
              height: rect.height,
              width: rect.width,
            };
          }
          return null;
        })
        .filter((position) => position !== null);

      onSelectTrial(selectedTrialArray, positions);
    },
    [sortedData, onSelectTrial]
  );

  const toggleRowSelection = useCallback(
    (index: number, shiftKey: boolean) => {
      setSelectedRows((prevSelectedRows) => {
        const newSelectedRows = new Set(prevSelectedRows);
        const trialId = sortedData[index].id;

        if (shiftKey && lastSelectedIndex !== null) {
          console.log("shiftKey");
          const start = Math.min(lastSelectedIndex, index);
          const end = Math.max(lastSelectedIndex, index);
          for (let i = start; i <= end; i++) {
            newSelectedRows.add(sortedData[i].id);
          }
          setIsMultiSelect(true);
        } else if (isMultiSelect) {
          console.log("isMultiSelect");
          newSelectedRows.clear();
          setIsMultiSelect(false);
        } else {
          console.log("else");
          if (newSelectedRows.has(trialId)) {
            newSelectedRows.delete(trialId);
          } else {
            newSelectedRows.add(trialId);
          }
        }

        setLastSelectedIndex(index);
        updateSelectedTrials(newSelectedRows);
        return newSelectedRows;
      });
    },
    [sortedData, lastSelectedIndex, updateSelectedTrials, isMultiSelect]
  );

  // const toggleRowSelection = (index, shiftKey) => {
  //   if (shiftKey && lastSelectedIndex !== null) {
  //     const start = Math.min(lastSelectedIndex, index);
  //     const end = Math.max(lastSelectedIndex, index);
  //     const newSelectedRows = new Set(selectedRows);
  //     for (let i = start; i <= end; i++) {
  //       newSelectedRows.add(
  //         sortedData[i].id // Use the actual trial ID
  //       );
  //     }
  //     setSelectedRows(newSelectedRows);
  //     setIsMultiSelect(true);
  //   } else if (isMultiSelect) {
  //     setSelectedRows(new Set());
  //     setIsMultiSelect(false);
  //   } else {
  //     const newSelectedRows = new Set(selectedRows);
  //     if (
  //       newSelectedRows.has(
  //         sortedData[index].id // Use the actual trial ID
  //       )
  //     ) {
  //       newSelectedRows.delete(
  //         sortedData[index].id // Use the actual trial ID
  //       );
  //     } else {
  //       newSelectedRows.add(
  //         sortedData[index].id // Use the actual trial ID
  //       );
  //     }
  //     setSelectedRows(newSelectedRows);
  //   }
  //   setLastSelectedIndex(index);
  //   const positions = [];
  //   selectedRows.forEach((id) => {
  //     const index = sortedData.findIndex((item) => item.id === id);
  //     if (index !== -1) {
  //       const rowElement = rowRefs.current[index];
  //       if (rowElement) {
  //         const rect = rowElement.getBoundingClientRect();
  //         positions.push({
  //           top: rect.bottom,
  //           left: rect.left,
  //           height: rect.height,
  //           width: rect.width,
  //         });
  //       }
  //     }
  //   });
  //   onSelectTrial(selectedRows, positions, isScrolling);
  // };

  const Row = useCallback(
    ({ index, style }) => {
      const item = sortedData[index];
      const isSelected = selectedRows.has(item.id);

      return (
        <div
          className={`virtual-table-row ${isSelected ? "selected" : ""}`}
          style={{
            ...style,
            display: "flex",
            // backgroundColor: isSelected
            //   ? "#d0e0fc"
            //   : // : isHovered
            //     // ? "#f0f0f0"
            //     "white",
            width: totalWidth,
          }}
          // onMouseEnter={() => setHoveredRow(item.id)}
          // onMouseLeave={() => setHoveredRow(null)}
          ref={(el) => (rowRefs.current[index] = el)}
          onClick={(e) => {
            // handleRowClick(item.id, index);
            toggleRowSelection(index, e.shiftKey);
          }}
        >
          {columns.map((column) => {
            if (column.visibility === false) {
              return null;
            }
            return (
              <div
                key={column.key}
                style={{
                  width: `${column.width}px`,
                  padding: "8px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  display: "flex",
                  justifyContent:
                    column.key === "metric" ||
                    column.type === HyperparamTypes.Continuous ||
                    column.type === HyperparamTypes.Ordinal
                      ? "right"
                      : "center",
                  alignItems: "center",
                }}
              >
                {column.key === "checked" ? (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      // handleRowClick(item.id, index);
                      toggleRowSelection(index, e.nativeEvent.shiftKey);
                    }}
                  />
                ) : // column.type === HyperparamTypes.Binary ? (
                //   <div
                //     style={{
                //       width: "10px",
                //       height: "10px",
                //       backgroundColor: item[column.key] ? "gray" : "white",
                //       border: "1px solid gray",
                //       display: "inline-block",
                //       userSelect: "none",
                //     }}
                //   />
                // ) : column.type === HyperparamTypes.Nominal ||
                //   column.type === HyperparamTypes.Ordinal ? (
                //   <div
                //     style={{
                //       width: "10px",
                //       height: "10px",
                //       backgroundColor: column.hp.getColor(index),
                //       display: "inline-block",
                //       userSelect: "none",
                //     }}
                //   />
                // ) :
                column.key === "metric" || column.key === "id" ? (
                  <Text fontSize={"xs"} userSelect="none">
                    {formatting(item[column.key], "int")}
                  </Text>
                ) : column.type === HyperparamTypes.Continuous ? (
                  <Text fontSize={"xs"} userSelect="none">
                    {column.hp.formatting(item[column.key])}
                  </Text>
                ) : (
                  <Text fontSize={"xs"} userSelect="none">
                    {item[column.key] === true
                      ? "T"
                      : item[column.key] === false
                      ? "F"
                      : item[column.key]}
                  </Text>
                )}
              </div>
            );
          })}
        </div>
      );
    },
    [sortedData, columns, totalWidth, selectedRows]
  );

  const GroupRow = useCallback(
    ({ index, style }) => {
      const item = columnGroup?.groups[index];
      // const isHovered = hoveredRow === item.key.toString();
      const isSelected = selectedRows.has(item.key.toString());

      return (
        <div
          style={{
            ...style,
            display: "flex",
            backgroundColor: isSelected
              ? "#d0e0fc"
              : // : isHovered
                // ? "#f0f0f0"
                "white",
            transition: "background-color 0.3s",
            width: totalWidth,
          }}
          // onMouseEnter={() => setHoveredRow(item.key.toString())}
          // onMouseLeave={() => setHoveredRow(null)}
          onClick={(e) => toggleRowSelection(index, e.shiftKey)}
        >
          {columns.map((column) => {
            if (column.visibility === false) {
              return null;
            } else if (column.key === "id") {
              return (
                <div
                  style={{
                    width: `${column.width}px`,
                    padding: "8px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  -
                </div>
              );
            } else if (column.key === columnGroup.key) {
              return (
                <div
                  key={column.key}
                  style={{
                    width: `${column.width}px`,
                    padding: "8px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {column.key === "checked" ? (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) =>
                        toggleRowSelection(index, e.nativeEvent.shiftKey)
                      }
                    />
                  ) : column.type === HyperparamTypes.Boolean ? (
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        backgroundColor: columnGroup?.values[index]
                          ? "gray"
                          : "white",
                        border: "1px solid gray",
                        display: "inline-block",
                        userSelect: "none",
                      }}
                    />
                  ) : column.type === HyperparamTypes.Categorical ? (
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        backgroundColor: column.hp.getColor(index),
                        display: "inline-block",
                        userSelect: "none",
                      }}
                    />
                  ) : column.type === HyperparamTypes.Numerical ? (
                    <div style={{ userSelect: "none" }}>"numerical"</div>
                  ) : (
                    <div style={{ userSelect: "none" }}>{"columns"}</div>
                  )}
                </div>
              );
            }
            return (
              <div
                key={column.key}
                style={{
                  width: `${column.width}px`,
                  padding: "8px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {column.key === "checked" ? (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) =>
                      toggleRowSelection(index, e.nativeEvent.shiftKey)
                    }
                  />
                ) : column.type === HyperparamTypes.Boolean ? (
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      backgroundColor: item[column.key] ? "gray" : "white",
                      border: "1px solid gray",
                      display: "inline-block",
                      userSelect: "none",
                    }}
                  />
                ) : column.type === HyperparamTypes.Categorical ? (
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      backgroundColor: column.hp.getColor(index),
                      display: "inline-block",
                      userSelect: "none",
                    }}
                  />
                ) : column.type === HyperparamTypes.Numerical ? (
                  <div style={{ userSelect: "none" }}>"numerical"</div>
                ) : (
                  <div style={{ userSelect: "none" }}>{"columns"}</div>
                )}
              </div>
            );
          })}
        </div>
      );
    },
    [columnGroup, columns, totalWidth, selectedRows]
  );
  const handleScroll = (scrollOffset) => {
    setIsScrolling(true);
    onSelectTrial(lastSelectedTrialId, null, true);

    cancelAnimationFrame(scrollTimer);
    scrollTimer = requestAnimationFrame(() => {
      setIsScrolling(false);
      if (lastSelectedTrialId !== null) {
        const index = sortedData.findIndex(
          (item) => item.id === lastSelectedTrialId
        );
        if (index !== -1) {
          // handleRowClick(lastSelectedTrialId, index);
          updateSelectedTrials(selectedRows);
        }
      }
    });
  };
  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Trial View ({formatting(sortedData.length, "int")} Trials)
        </Heading>
        <FormControl
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="140px"
        >
          <FormLabel htmlFor="metric-switch" mb={0}>
            <Text fontSize="xs" color="gray.600">
              Show controls
            </Text>
          </FormLabel>
          <Switch
            id="metric-switch"
            onChange={() => setVisible(!visible)}
            isChecked={visible}
            size={"sm"}
          />
        </FormControl>
      </Box>

      <AutoSizer>
        {({ height, width }) => (
          <div
            style={{
              height: height - 35, // Subtracting header height
              width,
              overflowX: "auto",
              overflowY: "hidden",
              padding: "0 4px",
            }}
            ref={scrollContainerRef}
            // onScroll={handleScroll}
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
                {columns.map((column) => {
                  if (column.visibility === false) {
                    return null;
                  }
                  return (
                    <div
                      key={column.key}
                      style={{
                        width: `${column.width}px`,
                        padding: "2px",
                        borderBottom: "1px solid #ddd",
                        cursor: "pointer",
                        flexShrink: 0,
                        justifyContent: "center",
                        height: visible ? "45px" : "",
                        paddingBottom: "5px",
                      }}
                    >
                      <Box
                        display={"flex"}
                        justifyContent={"center"}
                        flexDirection={"column"}
                        alignItems={"center"}
                      >
                        {column.key !== "checked" ? (
                          <Text
                            fontSize={"xs"}
                            userSelect="none"
                            display={"flex"}
                            alignItems={"center"}
                            fontWeight={"bold"}
                            onClick={() => requestSort(column.key)}
                          >
                            {column.hp ? (
                              <Icon
                                as={column.hp.icon}
                                mr={1}
                                color={"gray.600"}
                              ></Icon>
                            ) : (
                              ""
                            )}
                            {column.label}
                            <Icon
                              visibility={
                                column.key === sortConfig.key
                                  ? "visible"
                                  : "hidden"
                              }
                              // width={2}
                              // ml={1}
                              onClick={() => requestSort(column.key)}
                              color={"gray"}
                              as={
                                sortConfig.key === column.key
                                  ? sortConfig.direction === "ascending"
                                    ? FaSortUp
                                    : FaSortDown
                                  : FaSort
                              }
                            ></Icon>
                          </Text>
                        ) : (
                          <Box
                            display={"flex"}
                            height={"parent"}
                            justifyContent={"center"}
                            alignItems={"center"}
                            pt={visible ? "10px" : "2px"}
                          >
                            {column.label}
                          </Box>
                        )}
                        {column.key !== "checked" && visible && (
                          <Box display={"flex"} justifyContent={"center"}>
                            <Icon
                              width={2}
                              ml={1}
                              onClick={() => requestSort(column.key)}
                              color={"gray"}
                              as={
                                sortConfig.key === column.key
                                  ? sortConfig.direction === "ascending"
                                    ? FaSortUp
                                    : FaSortDown
                                  : FaSort
                              }
                            ></Icon>
                          </Box>
                        )}
                      </Box>
                    </div>
                  );
                })}
              </div>
              <div
                className={`virtual-table ${columnGroup ? "group-table" : ""}`}
                style={{
                  height: visible ? height - 95 : height - 80,
                  position: "relative",
                }}
              >
                {columnGroup ? (
                  <List
                    height={height - 85} // Subtracting header height
                    itemCount={columnGroup.groups.length}
                    itemSize={35} // Adjust based on your row height
                    width={totalWidth}
                    itemData={columnGroup.groups}
                    style={{ overflowX: "hidden" }}
                  >
                    {GroupRow}
                  </List>
                ) : (
                  <List
                    height={visible ? height - 95 : height - 80} // Subtracting header height
                    itemCount={sortedData.length}
                    itemSize={15} // Adjust based on your row height
                    width={totalWidth}
                    itemData={sortedData}
                    style={{ overflowX: "hidden" }}
                    onScroll={({ scrollOffset }) => {
                      handleScroll(scrollOffset);
                    }}
                  >
                    {Row}
                  </List>
                )}
              </div>
            </div>
          </div>
        )}
      </AutoSizer>
      <Box
        position="absolute"
        bg="white"
        boxShadow="lg"
        borderRadius="md"
        // top="95%"
        bottom={"0px"}
        left="50%"
        width={"50%"}
        transform="translate(-50%, -50%)" // Center the box
        p={1}
        zIndex={10}
        display={"flex"}
        justifyContent={"space-between"}
        alignItems="center"
      >
        <Text fontSize={"xs"} color="gray.600" p={2}>
          Choose trials to create a group
        </Text>
        <Button
          size={"xs"}
          colorScheme={"blue"}
          variant={"solid"}
          isDisabled={selectedRows.size === 0}
          mr={1}
          onClick={() => {
            groups.addGroup(
              exp?.trials.filter((trial) => selectedRows.has(trial.id)) ?? []
            );
            setGroups(groups);
            setSelectedRows(new Set());
          }}
        >
          Create Trial Group
        </Button>
      </Box>
    </div>
  );
};

export default FastDataTable;

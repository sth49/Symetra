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
import { Box, Button, Heading, Icon, IconButton, Text } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { HyperparamTypes } from "../model/hyperparam";
import { Group } from "../model/group";
import { v4 as uuidv4 } from "uuid";

import { FaLayerGroup } from "react-icons/fa6";
import { FaSort } from "react-icons/fa6";
import { FaSortUp } from "react-icons/fa6";
import { FaSortDown } from "react-icons/fa6";

const FastDataTable = () => {
  const { exp, hyperparams, setGroups, groups } = useCustomStore();
  const [sortedData, setSortedData] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "none", // ascending or descending
  });
  const [hoveredRow, setHoveredRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [isMultiSelect, setIsMultiSelect] = useState(false);

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
        canGroup: false,
        isGroup: false,
      },
      {
        key: "id",
        label: "ID",
        width: 30,
        visibility: true,
        type: "string",
        canGroup: false,
        isGroup: false,
      },
      {
        key: "metric",
        label: "Metric",
        width: 60,
        visibility: true,
        type: "numerical",
        canGroup: true,
        isGroup: false,
      },
      ...(exp?.hyperparams.map((hp) => ({
        key: hp.name,
        label: hp.displayName,
        width: 50,
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

  const groupByColumn = (columnKey) => {
    if (columnGroup && columnGroup.key === columnKey) {
      setColumnGroup(null);
      return;
    }

    if (columnKey === "metric") {
      return;
    }

    const hp = hyperparams.find((hp) => hp.name === columnKey);

    if (hp.type === HyperparamTypes.Numerical) {
      return;
    } else if (
      hp.type === HyperparamTypes.Categorical ||
      hp.type === HyperparamTypes.Boolean
    ) {
      const unqiueValues = hp.value;
      console.log("unqiueValues", unqiueValues);

      setColumnGroup({
        key: columnKey,
        values: unqiueValues,
        groups: unqiueValues.map((value) => ({
          key: value,
          trials: data.filter((trial) => trial[columnKey] === value),
        })),
      });
    }
  };

  const toggleRowSelection = (index, shiftKey) => {
    if (shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSelectedRows = new Set(selectedRows);
      for (let i = start; i <= end; i++) {
        newSelectedRows.add(
          sortedData[i].id // Use the actual trial ID
        );
      }
      setSelectedRows(newSelectedRows);
      setIsMultiSelect(true);
    } else if (isMultiSelect) {
      setSelectedRows(new Set());
      setIsMultiSelect(false);
    } else {
      const newSelectedRows = new Set(selectedRows);
      if (
        newSelectedRows.has(
          sortedData[index].id // Use the actual trial ID
        )
      ) {
        newSelectedRows.delete(
          sortedData[index].id // Use the actual trial ID
        );
      } else {
        newSelectedRows.add(
          sortedData[index].id // Use the actual trial ID
        );
      }
      setSelectedRows(newSelectedRows);
    }
    setLastSelectedIndex(index);
  };

  const Row = useCallback(
    ({ index, style }) => {
      const item = sortedData[index];
      const isHovered = hoveredRow === item.id;
      const isSelected = selectedRows.has(item.id);

      return (
        <div
          style={{
            ...style,
            display: "flex",
            backgroundColor: isSelected
              ? "#d0e0fc"
              : isHovered
              ? "#f0f0f0"
              : "white",
            transition: "background-color 0.3s",
            width: totalWidth,
          }}
          onMouseEnter={() => setHoveredRow(item.id)}
          onMouseLeave={() => setHoveredRow(null)}
          onClick={(e) => toggleRowSelection(index, e.shiftKey)}
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
                  <Text fontSize={"xs"} userSelect="none">
                    {column.hp.formatting(item[column.key])}
                  </Text>
                ) : (
                  <Text fontSize={"xs"} userSelect="none">
                    {item[column.key]}
                  </Text>
                )}
              </div>
            );
          })}
        </div>
      );
    },
    [sortedData, columns, hoveredRow, totalWidth, selectedRows]
  );

  const GroupRow = useCallback(
    ({ index, style }) => {
      const item = columnGroup?.groups[index];
      const isHovered = hoveredRow === item.key.toString();
      const isSelected = selectedRows.has(item.key.toString());

      return (
        <div
          style={{
            ...style,
            display: "flex",
            backgroundColor: isSelected
              ? "#d0e0fc"
              : isHovered
              ? "#f0f0f0"
              : "white",
            transition: "background-color 0.3s",
            width: totalWidth,
          }}
          onMouseEnter={() => setHoveredRow(item.key.toString())}
          onMouseLeave={() => setHoveredRow(null)}
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
    [columnGroup, columns, hoveredRow, totalWidth, selectedRows]
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
        <Heading as="h5" size="sm" color="gray.600" p={4}>
          Trial Details
        </Heading>
        <Box
          width={"40%"}
          display={"flex"}
          justifyContent={"right"}
          p={2}
          alignItems="center"
        >
          <Text fontSize={"sm"} mr={2}>
            Selected: {selectedRows.size} / {sortedData.length}
          </Text>
          <Button
            size={"sm"}
            colorScheme={"blue"}
            variant={"solid"}
            leftIcon={<AddIcon boxSize={3} />}
            isDisabled={selectedRows.size === 0}
            onClick={() => {
              setGroups([
                ...groups,
                new Group(
                  uuidv4(),
                  exp?.trials.filter((trial) => selectedRows.has(trial.id)) ??
                    []
                ),
              ]);
              setSelectedRows(new Set());
            }}
          >
            Group
          </Button>
        </Box>
      </Box>
      <AutoSizer>
        {({ height, width }) => (
          <div
            style={{
              height: height - 50, // Subtracting header height
              width,
              overflowX: "auto",
              overflowY: "hidden",
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
                        borderBottom: "2px solid #ddd",
                        cursor: "pointer",
                        flexShrink: 0,
                        justifyContent: "center",
                        height: "60px",
                      }}
                    >
                      <Box
                        display={"flex"}
                        justifyContent={"center"}
                        height={column.key === "checked" ? "100%" : "50%"}
                      >
                        {column.key !== "checked" ? (
                          <Text fontSize={"sm"} userSelect="none">
                            {column.label}
                          </Text>
                        ) : (
                          column.label
                        )}
                      </Box>
                      {column.key !== "checked" && (
                        <Box display={"flex"} justifyContent={"center"}>
                          <IconButton
                            // fontSize={"10px"}
                            size={"xs"}
                            p={0}
                            variant={
                              sortConfig.key === column.key ? "solid" : "ghost"
                            }
                            colorScheme="blue"
                            onClick={() => requestSort(column.key)}
                            icon={
                              <Icon
                                as={
                                  sortConfig.key === column.key
                                    ? sortConfig.direction === "ascending"
                                      ? FaSortUp
                                      : FaSortDown
                                    : FaSort
                                }
                              ></Icon>
                            }
                          />

                          {column.canGroup && (
                            <IconButton
                              size={"xs"}
                              p={0}
                              variant={
                                columnGroup && columnGroup.key === column.key
                                  ? "solid"
                                  : "ghost"
                              }
                              colorScheme="blue"
                              onClick={() => groupByColumn(column.key)}
                              icon={<Icon as={FaLayerGroup}></Icon>}
                            />
                            // <Button
                            //   size={"sm"}
                            //   variant={
                            //     columnGroup && columnGroup.key === column.key
                            //       ? "solid"
                            //       : "outline"
                            //   }
                            //   colorScheme="blue"
                            //   onClick={() =>
                            //     columnGroup?.columnKey === column.key
                            //       ? setColumnGroup(null)
                            //       : groupByColumn(column.key)
                            //   }
                            // >
                            //   <Icon as={FaLayerGroup} />
                            // </Button>
                          )}
                        </Box>
                      )}
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  height: height - 105,
                }}
              >
                {columnGroup ? (
                  <List
                    height={height - 105} // Subtracting header height
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
                    height={height - 105} // Subtracting header height
                    itemCount={sortedData.length}
                    itemSize={15} // Adjust based on your row height
                    width={totalWidth}
                    itemData={sortedData}
                    style={{ overflowX: "hidden" }}
                  >
                    {Row}
                  </List>
                )}
              </div>
            </div>
          </div>
        )}
      </AutoSizer>
    </div>
  );
};

export default FastDataTable;

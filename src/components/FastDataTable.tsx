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
import { Box, Button, Heading, Text } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { HyperparamTypes } from "../model/hyperparam";
const FastDataTable = () => {
  const { exp, hyperparams } = useCustomStore();
  const [sortedData, setSortedData] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [hoveredRow, setHoveredRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
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
      },
      { key: "id", label: "ID", width: 60, visibility: true, type: "string" },
      {
        key: "metric",
        label: "Metric",
        width: 80,
        visibility: true,
        type: "numerical",
      },
      ...(exp?.hyperparams.map((hp) => ({
        key: hp.name,
        label: hp.displayName,
        width: 70,
        visibility: hp.visible,
        type: hp.type,
        hp: hp,
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
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }, []);

  const toggleRowSelection = (index, shiftKey) => {
    if (shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSelectedRows = new Set(selectedRows);
      for (let i = start + 1; i <= end; i++) {
        if (newSelectedRows.has(i)) {
          newSelectedRows.delete(i);
        } else {
          newSelectedRows.add(i);
        }
      }
      setSelectedRows(newSelectedRows);
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
                    }}
                  />
                ) : column.type === HyperparamTypes.Categorical ? (
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      backgroundColor: column.hp.getColor(index),
                      display: "inline-block",
                    }}
                  />
                ) : column.type === HyperparamTypes.Numerical ? (
                  column.hp.formatting(item[column.key])
                ) : (
                  item[column.key]
                )}
              </div>
            );
          })}
        </div>
      );
    },
    [sortedData, columns, hoveredRow, totalWidth, selectedRows]
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
          justifyContent={"space-between"}
          p={2}
          alignItems="center"
        >
          <Text fontSize={"sm"}>selected: {selectedRows.size}</Text>
          <Button
            size={"sm"}
            colorScheme={"blue"}
            variant={"solid"}
            leftIcon={<AddIcon boxSize={3} />}
            isDisabled={selectedRows.size === 0}
            onClick={() => {
              console.log("clicked");
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
                        fontWeight: "bold",
                        display: "flex",
                        justifyContent: "center",
                      }}
                      onClick={() => {
                        if (column.key !== "checked") {
                          requestSort(column.key);
                        }
                      }}
                    >
                      {column.label}
                      {sortConfig.key === column.key &&
                        (sortConfig.direction === "ascending" ? " ▲" : " ▼")}
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  height: height - 105,
                }}
              >
                <List
                  height={height - 105} // Subtracting header height
                  itemCount={sortedData.length}
                  itemSize={35} // Adjust based on your row height
                  width={totalWidth}
                  itemData={sortedData}
                  style={{ overflowX: "hidden" }}
                >
                  {Row}
                </List>
              </div>
            </div>
          </div>
        )}
      </AutoSizer>
    </div>
  );
};

export default FastDataTable;

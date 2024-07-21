import React, { useState, useMemo, useCallback, useRef } from "react";
import { useCustomStore } from "../store";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Badge, Box, Button, Heading, Icon, Text } from "@chakra-ui/react";
import { FaEye } from "react-icons/fa6";
import { FaEyeSlash } from "react-icons/fa6";
import { BooleanHyperparam, CategoricalHyperparam } from "../model/hyperparam";
import CustomBoxPlot from "./CustomBoxPlot";
import * as d3 from "d3";
const FastEffectTable = () => {
  const { exp, hyperparams, setHyperparams } = useCustomStore();

  const [hoveredRow, setHoveredRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );
  const scrollContainerRef = useRef(null);
  const headerRef = useRef(null);

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
          dist:
            hp instanceof BooleanHyperparam
              ? {
                  points: exp?.trials.map((trial) =>
                    trial.params[hp.name] ? 1 : 0
                  ),
                  type: "boolean",
                  binCount: 2,
                  keys: 0,
                }
              : hp instanceof CategoricalHyperparam
              ? {
                  points: exp?.trials.map((trial) => trial.params[hp.name]),
                  type: "categorical",
                  binCount: Array.from(
                    new Set(exp?.trials.map((trial) => trial.params[hp.name]))
                  ).length,
                  keys: Array.from(
                    new Set(exp?.trials.map((trial) => trial.params[hp.name]))
                  ).sort(),
                }
              : {
                  points: exp?.trials.map((trial) => trial.params[hp.name]),
                  type: "numerical",
                  binCount: 10,
                  keys: 0,
                },
        })),

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
      },
      {
        key: "visible",
        label: <Icon as={FaEye} color={"gray"} />,
        width: 40,
      },
      {
        key: "dist",
        label: "Dist.",
        width: 80,
      },
      { key: "name", label: "Name", width: 70 },
      { key: "effect", label: "Effect", width: 70 },
      { key: "shapValues", label: "SHAP Values", width: 130 },
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
      const item = data[index];
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
            alignItems: "center",
          }}
          onMouseEnter={() => setHoveredRow(item.id)}
          onMouseLeave={() => setHoveredRow(null)}
          onClick={(e) => toggleRowSelection(index, e.shiftKey)}
        >
          {columns.map((column) => (
            <div
              key={column.key}
              style={{
                width: `${column.width}px`,
                padding: "8px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flexShrink: 0,
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
              ) : column.key === "visible" ? (
                <Icon
                  as={
                    hyperparams.find((hp) => hp.displayName === item.name)
                      ?.visible
                      ? FaEye
                      : FaEyeSlash
                  }
                  onClick={() => {
                    const hp = hyperparams.find(
                      (hp) => hp.displayName === item.name
                    );
                    if (hp) {
                      hp.visible = !hp.visible;
                      setHyperparams([...hyperparams]);
                    }
                  }}
                  color={"gray"}
                />
              ) : column.key === "dist" ? (
                <CustomBoxPlot
                  data={item.dist.points}
                  name={"all"}
                  width={40}
                  height={40}
                  type={item.dist.type}
                  count={item.dist.points.length}
                  binCount={item.dist.binCount}
                  keys={item.dist.keys}
                />
              ) : column.key === "name" ? (
                <Text>{item[column.key]}</Text>
              ) : column.key === "effect" ? (
                <Text>{item[column.key].toFixed(2)}</Text>
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
                    >
                      {Object.keys(value).map((key) => (
                        <Badge
                          key={key}
                          m={2}
                          background={shapleyColorScale(value[key])}
                          color={Math.abs(value[key]) < 0.5 ? "black" : "white"}
                          display={"flex"}
                          flexDir={"column"}
                          alignItems={"center"}
                        >
                          <Box>{key}</Box>
                          <Box>{value[key].toFixed(3)}</Box>
                        </Badge>
                      ))}
                    </Box>
                  );
                })()
              ) : (
                <div>asdf</div>
              )}
            </div>
          ))}
        </div>
      );
    },
    [columns, hoveredRow, totalWidth, selectedRows]
  );

  const shapleyColorScale = useMemo(
    () => d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]),
    []
  );
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
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Heading as="h5" size="sm" color="gray.600" p={4}>
          Hyperparameter Effects
        </Heading>
        <Box display={"flex"} p={2}>
          <Button
            size={"sm"}
            onClick={() => toggleVisibilityForSelected(true)}
            mr={2}
            colorScheme="blue"
            isDisabled={selectedRows.size === 0}
          >
            Show
          </Button>
          <Button
            size={"sm"}
            onClick={() => toggleVisibilityForSelected(false)}
            colorScheme="blue"
            isDisabled={selectedRows.size === 0}
            variant={"outline"}
          >
            Hide
          </Button>
        </Box>
      </Box>
      <AutoSizer>
        {({ height, width }) => (
          <div
            style={{
              height: height - 50,
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
                {columns.map((column) => (
                  <div
                    key={column.key}
                    style={{
                      width: `${column.width}px`,
                      padding: "8px",
                      borderBottom: "2px solid #ddd",
                      cursor: "pointer",
                      flexShrink: 0,
                      fontWeight: "bold",
                    }}
                  >
                    {column.label}
                  </div>
                ))}
              </div>
            </div>
            <div
              style={{
                height: height - 100,
              }}
            >
              <List
                height={height - 100} // Subtracting header height
                itemCount={data.length}
                itemSize={55} // Adjust based on your row height
                width={totalWidth}
                itemData={data}
                style={{ overflowX: "hidden" }}
              >
                {Row}
              </List>
            </div>
          </div>
        )}
      </AutoSizer>
    </div>
  );
};

export default FastEffectTable;

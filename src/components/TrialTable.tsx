import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  GroupingState,
} from "@tanstack/react-table";
import { getGroupedRowModel } from "../model/getGroupedRowModel";
import { useConstDataStore } from "./store/constDataStore";
import { formatting } from "../model/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Box, Button, Icon, IconButton, Text } from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { FaSort, FaSortUp, FaSortDown, FaLayerGroup } from "react-icons/fa6";
import BranchBarChart from "./BranchBarChart";
import { HyperparamTypes } from "../model/hyperparam";
import BarChart from "./BarChart";
import { MdDeselect } from "react-icons/md";
// Memoize expensive calculations
import { useMetricScale } from "../model/colorScale";
const adjustTableHeight = (tableRef, virtualHeight) => {
  if (!tableRef.current) return;

  const existingPseudoElement = window.getComputedStyle(
    tableRef.current,
    "::after"
  );
  const existingPseudoHeight = parseFloat(existingPseudoElement.height) || 0;
  const tableHeight = tableRef.current.clientHeight - existingPseudoHeight;
  const pseudoHeight = Math.max(virtualHeight - tableHeight, 0);
  document.documentElement.style.setProperty(
    "--pseudo-height",
    `${pseudoHeight}px`
  );
  return pseudoHeight;
};

interface TrialTableProps {
  showControls?: boolean;
}

const TrialTable = ({ showControls = false }: TrialTableProps) => {
  const { exp, hyperparams } = useConstDataStore();

  const data = useMemo(
    () =>
      exp?.trials
        .sort((a, b) => a.id - b.id)
        .map((trial) => ({
          id: trial.id,
          metric: trial.metric,
          ...trial.params,
        })) ?? [],
    [exp]
  );

  const [columnVisibility, setColumnVisibility] = useState({});
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "metric", desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState({});
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const { colorScale, metricScale } = useMetricScale();

  // Update column visibility when hyperparams change
  useEffect(() => {
    const visibility = Object.fromEntries(
      hyperparams.map((param) => [param.name, param.visible])
    );
    setColumnVisibility(visibility);
  }, [hyperparams]);

  // Memoize columns configuration
  const columns = useMemo(() => {
    return [
      {
        id: "check",
        header: "",
        accessorKey: "check",
        cell: (info) => (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <input
              type="checkbox"
              checked={info.row.getIsSelected()}
              onChange={info.row.getToggleSelectedHandler()}
            />
          </div>
        ),
        meta: { align: "center" },
        size: 30,
        enableSorting: false,
      },
      {
        id: "id",
        header: "ID",
        accessorKey: "id",
        cell: (info) => info.getValue(),
        size: 40,
        meta: { align: "right" },
        type: "string",
        getGroupingValue: (row) => row.original.id,
        aggregationFn: "count",
        aggregatedCell: (info) => info.getValue(),
        enableGrouping: false,
      },
      {
        id: "metric",
        header: "CVRG",
        accessorKey: "metric",
        type: "number",
        aggregationFn: "numericalAggregationFn",
        cell: (info) => {
          const { cell, row } = info;
          if (cell.getIsAggregated() || cell.getIsGrouped()) {
            const points = row.leafRows.map((row) => row.original.id);
            return (
              <Box display="flex" justifyContent="center" alignItems="center">
                <BranchBarChart trialIds={points} />
              </Box>
            );
          }
          return (
            <Box
              background={colorScale(metricScale(cell.getValue()))}
              color={cell.getValue() > 1000 ? "black" : "white"}
              width={"100%"}
            >
              {formatting(info.getValue(), "float")}
            </Box>
          );
        },
        meta: { align: "right" },
        size: 70,
      },
      ...hyperparams.map((param) => ({
        id: param.name,
        header: () => (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Icon as={param.icon} mr={1} color="gray.600" />
            {param.displayName}
          </div>
        ),
        type:
          param.type === HyperparamTypes.Binary
            ? "boolean"
            : param.type === HyperparamTypes.Nominal ||
              param.type === HyperparamTypes.Ordinal
            ? "string"
            : param.type === HyperparamTypes.Continuous
            ? "number"
            : "string",
        accessorKey: param.name,
        cell: (info) => {
          if (info.cell.getIsAggregated() || info.cell.getIsGrouped()) {
            const trialIds = info.row.leafRows.map((row) => row.original.id);
            return <BarChart dist={param.name} trialIds={trialIds} />;
          }
          return info.getValue() === true
            ? "T"
            : info.getValue() === false
            ? "F"
            : info.column.columnDef.meta.type === "string"
            ? info.getValue()
            : formatting(
                info.getValue(),
                info.column.columnDef.meta.type === "int" ? "int" : "float"
              );
        },
        width: 300,
        meta: {
          align: param.valueType === "int" ? "right" : "center",
          type: param.valueType,
        },
        aggregationFn:
          param.type === HyperparamTypes.Binary
            ? "booleanAggregationFn"
            : param.type === HyperparamTypes.Nominal ||
              param.type === HyperparamTypes.Ordinal
            ? "categoricalAggregationFn"
            : param.type === HyperparamTypes.Continuous
            ? "numericalAggregationFn"
            : "mean",
      })),
    ];
  }, [hyperparams]);

  const table = useReactTable({
    data,
    columns,
    aggregationFns: {
      booleanAggregationFn: (columnId, leafRows) => {
        const total = leafRows.length;
        const trueCount = leafRows.filter(
          (row) => row.original[columnId] === true
        ).length;
        return { trueCount, total };
      },
      categoricalAggregationFn: (columnId, leafRows) => {
        const total = leafRows.length;
        const counts = leafRows.reduce((acc, row) => {
          const value = row.original[columnId];
          acc[value] = (acc[value] || 0) + 1;
          return acc;
        }, {});
        return { counts, total };
      },
      numericalAggregationFn: (columnId, leafRows) =>
        leafRows.map((row) => row.original[columnId]),
    },
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
    state: {
      grouping,
      sorting,
      rowSelection,
      columnVisibility,
    },
    initialState: {
      columnPinning: {
        left: ["check"],
        right: [],
      },
    },
    onColumnVisibilityChange: setColumnVisibility,
    onGroupingChange: setGrouping,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    onRowSelectionChange: setRowSelection,
    debugTable: true,
    defaultColumn: {
      minSize: 30,
      size: 50,
      maxSize: 100,
    },
    enableRowSelection: true,
  });

  const { rows } = table.getSortedRowModel();

  const parentRef = useRef<HTMLDivElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [isScrollNearBottom, setIsScrollNearBottom] = useState(false);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 20,
    overscan: 20,
  });

  const {
    setGroups,
    groups,
    selectedTrials,
    setSelectedRowPositions,
    setSelectedTrials,
  } = useCustomStore();

  const virtualItems = virtualizer.getVirtualItems();
  const virtualSize = virtualizer.getTotalSize();
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef(null);
  const paddedTotalSize = virtualSize;

  const handlePseudoResize = useCallback(() => {
    return adjustTableHeight(tableRef, paddedTotalSize);
  }, [tableRef, paddedTotalSize]);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  const lastScrollTopRef = useRef(0);

  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;

    const currentScrollTop = parentRef.current.scrollTop;
    if (currentScrollTop === lastScrollTopRef.current) return;

    if (!isScrolling && Object.keys(rowSelection).length > 0) {
      setIsScrolling(true);
      setSelectedTrials([]);
      setSelectedRowPositions([]);
    }

    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }

    scrollTimerRef.current = setTimeout(() => {
      setIsScrolling(false);
      if (Object.keys(rowSelection).length > 0) {
        updateSelectedTrials(new Set(Object.keys(rowSelection).map(Number)));
      }
    }, 300);

    const visibleHeight = parentRef.current.clientHeight;
    setIsScrollNearBottom(
      currentScrollTop > paddedTotalSize * 0.95 - visibleHeight
    );
    lastScrollTopRef.current = currentScrollTop;
  }, [parentRef, paddedTotalSize, isScrolling, rowSelection]);

  useEffect(() => {
    const scrollable = parentRef.current;
    if (scrollable) {
      scrollable.addEventListener("scroll", handleScroll);
      handlePseudoResize();
    }
    return () => {
      if (scrollable) {
        scrollable.removeEventListener("scroll", handleScroll);
      }
    };
  }, [data, handleScroll, handlePseudoResize]);

  useEffect(() => {
    if (isScrollNearBottom) handlePseudoResize();
  }, [isScrollNearBottom, virtualItems.length, handlePseudoResize]);

  const rowRefs = useRef({});

  const updateSelectedTrials = useCallback(
    (newSelectedRows: Set<number>) => {
      const selectedTrialArray = table
        .getSortedRowModel()
        .rows.filter((row) => newSelectedRows.has(Number(row.id)))
        .map((row) => Number(row.original.id));

      const tableContainer = document.querySelector(".virtual-table");
      const tableRect = tableContainer?.getBoundingClientRect();
      const parentContainer = parentRef.current;
      const scrollTop = parentContainer?.scrollTop || 0;
      const visibleHeight = parentContainer?.clientHeight || 0;
      const container = document.querySelector(".container");
      const containerRect = container?.getBoundingClientRect();

      const positions = selectedTrialArray
        .map((trialId) => {
          const index = rows.findIndex(
            (item) => Number(item.original.id) === trialId
          );
          const rowElement = rowRefs.current[index];
          const virtualPosition = index * 20;

          if (rowElement) {
            const rect = rowElement.getBoundingClientRect();
            let top = rect.bottom;
            let positionType = "visible";

            if (virtualPosition + 35 < scrollTop) {
              top = tableRect.top - 35;
              positionType = "above";
            } else if (virtualPosition > scrollTop + visibleHeight - 35) {
              top = containerRect.bottom + 5;
              positionType = "below";
            }

            return {
              trialId,
              top,
              left: rect.left,
              height: rect.height,
              width: rect.width,
              order: index,
              positionType,
            };
          }

          const estimatedPosition = virtualPosition;
          let positionType = "visible";
          let top = null;

          if (estimatedPosition < scrollTop) {
            top = tableRect.top;
            positionType = "above";
          } else if (estimatedPosition > scrollTop + visibleHeight) {
            top = containerRect.bottom + 5;
            positionType = "below";
          }

          return {
            trialId,
            top,
            left: tableRect?.left || 0,
            height: 20,
            width: tableRect?.width || 0,
            order: index,
            positionType,
          };
        })
        .filter((position) => position !== null);

      setSelectedTrials(selectedTrialArray);
      setSelectedRowPositions(positions);
    },
    [table, setSelectedTrials, setSelectedRowPositions, rows]
  );

  const toggleRowSelection = useCallback(
    (index: number, shiftKey: boolean) => {
      setRowSelection((prevRowSelection) => {
        const newSelection = { ...prevRowSelection };
        const trialId = rows[index].id;

        if (shiftKey && lastSelectedIndex !== null) {
          const start = Math.min(lastSelectedIndex, index);
          const end = Math.max(lastSelectedIndex, index);
          for (let i = start; i <= end; i++) {
            newSelection[rows[i].id] = true;
          }
          setIsMultiSelect(true);
        }

        // else if (isMultiSelect) {
        //   Object.keys(newSelection).forEach((key) => delete newSelection[key]);
        //   setIsMultiSelect(false);
        // }
        else {
          if (newSelection[trialId]) {
            delete newSelection[trialId];
          } else {
            newSelection[trialId] = true;
          }
        }

        setLastSelectedIndex(index);
        updateSelectedTrials(new Set(Object.keys(newSelection).map(Number)));
        return newSelection;
      });
    },
    [rows, lastSelectedIndex, isMultiSelect]
  );

  useEffect(() => {
    if (!isScrolling && Object.keys(rowSelection).length > 0) {
      updateSelectedTrials(new Set(Object.keys(rowSelection).map(Number)));
    }
  }, [sorting, rowSelection, updateSelectedTrials, isScrolling]);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        ref={parentRef}
        className="container"
        style={{
          overflow: "auto",
          height: "calc(100% - 60px - 10px)",
          marginBottom: "10px",
        }}
      >
        <div
          ref={scrollableRef}
          style={{
            position: "relative",
            height: `${virtualizer.getTotalSize()}px`,
          }}
        >
          <table
            ref={tableRef}
            className="virtual-table"
            style={{
              width: table.getCenterTotalSize(),
              tableLayout: "fixed",
            }}
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="virtual-table-sticky-header"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        width: `${header.getSize()}px`,
                        position: "sticky",
                        top: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        padding: "8px 8px",
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : "",
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            height: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {!showControls &&
                            header.column.getCanSort() &&
                            header.column.getIsSorted() !== false && (
                              <Icon
                                color="gray.600"
                                onClick={header.column.getToggleSortingHandler()}
                                as={
                                  (header.column.getIsSorted() as string) ===
                                  "asc"
                                    ? FaSortUp
                                    : (header.column.getIsSorted() as string) ===
                                      "desc"
                                    ? FaSortDown
                                    : FaSort
                                }
                              />
                            )}
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </div>
                      )}
                      {showControls && header.column.getCanSort() && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-evenly",
                          }}
                        >
                          <Icon
                            color={
                              header.column.getIsSorted()
                                ? "blue.500"
                                : "gray.600"
                            }
                            onClick={header.column.getToggleSortingHandler()}
                            as={
                              (header.column.getIsSorted() as string) === "asc"
                                ? FaSortUp
                                : (header.column.getIsSorted() as string) ===
                                  "desc"
                                ? FaSortDown
                                : FaSort
                            }
                          />
                          {header.column.getCanGroup() && (
                            <Icon
                              color={
                                header.column.getIsGrouped()
                                  ? "blue.500"
                                  : "gray.600"
                              }
                              onClick={header.column.getToggleGroupingHandler()}
                              as={FaLayerGroup}
                            />
                          )}
                        </div>
                      )}
                      <div
                        {...{
                          onDoubleClick: () => header.column.resetSize(),
                          onMouseDown: header.getResizeHandler(),
                          onTouchStart: header.getResizeHandler(),
                          className: `resizer ${
                            table.options.columnResizeDirection
                          } ${
                            header.column.getIsResizing() ? "isResizing" : ""
                          }`,
                        }}
                      />
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {virtualizer.getVirtualItems().map((virtualRow, index) => {
                const row = rows[virtualRow.index];
                return (
                  <tr
                    ref={(el) => (rowRefs.current[virtualRow.index] = el)}
                    key={row.id}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${
                        virtualRow.start - index * virtualRow.size
                      }px)`,
                    }}
                    className={`virtual-table-row ${
                      row.getIsSelected() ? "selected" : ""
                    }`}
                    onClick={(e) => {
                      toggleRowSelection(virtualRow.index, e.shiftKey);
                      row.getToggleSelectedHandler()(e);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const { column } = cell;
                      return (
                        <td
                          key={cell.id}
                          style={{
                            width: column.getSize(),
                            textAlign: cell.column.columnDef.meta.align,
                            padding: "0 8px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            alignItems: "center",
                          }}
                        >
                          {cell.getIsGrouped() ? (
                            <>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </>
                          ) : (
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Box
        bg="white"
        p={1}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        className="virtual-table-bottom"
      >
        <Text fontSize="xs" color="gray.600" p={2}>
          Choose trials to create a trial group (
          {formatting(Object.keys(rowSelection).length, "int")} {" / "}
          {formatting(data.length, "int")} Selected)
        </Text>
        <Box display={"flex"}>
          <IconButton
            aria-label="Lasso"
            // icon={isLassoActive ? <TbLassoOff /> : <TbLasso />}
            icon={<MdDeselect />}
            onClick={() => {
              setRowSelection({});
              setSelectedRowPositions([]);
              setSelectedTrials([]);
            }}
            size="xs"
            colorScheme="red"
            isDisabled={Object.keys(rowSelection).length === 0}
            mr={1}
          />

          <Button
            size="xs"
            colorScheme="blue"
            variant="solid"
            isDisabled={selectedTrials.length === 0}
            mr={1}
            onClick={() => {
              const updatedGroups = groups.clone();
              updatedGroups.addGroup(
                exp?.trials.filter((trial) =>
                  selectedTrials.includes(trial.id)
                ) ?? []
              );
              setGroups(updatedGroups);
              setRowSelection({});
              setSelectedRowPositions([]);
              setSelectedTrials([]);
            }}
          >
            Create Trial Group
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default TrialTable;

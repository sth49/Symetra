import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useConstDataStore } from "./store/constDataStore";
import { formatting, getTextColor } from "../model/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Box, Button, Icon, IconButton, Text } from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa6";
import { HyperparamTypes } from "../model/hyperparam";
import { MdDeselect } from "react-icons/md";
import { MdAdd } from "react-icons/md";

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

const TrialTable = () => {
  const { exp, hyperparams } = useConstDataStore();
  const hparamSort = useConstDataStore((state) => state.hparamSort);

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
        cell: (info) => info.getValue() + 1,
        size: 50,
        meta: { align: "right" },
        type: "string",
      },
      {
        id: "metric",
        header: "CVRG",
        accessorKey: "metric",
        type: "number",
        cell: (info) => {
          const { cell } = info;
          return (
            <Box
              background={colorScale(cell.getValue())}
              color={getTextColor(colorScale(cell.getValue()))}
              width={"100%"}
              pr={1}
            >
              {formatting(info.getValue(), "int")}
            </Box>
          );
        },
        meta: { align: "right" },
        size: 70,
      },
      ...hyperparams
        // .sort((a, b) => b.getAbsoluteEffect() - a.getAbsoluteEffect())
        .sort((a, b) => {
          if (hparamSort !== null && hparamSort !== undefined) {
            if (hparamSort.id === "name") {
              if (hparamSort.desc) {
                return b.name.localeCompare(a.name);
              }
              return a.name.localeCompare(b.name);
            } else if (hparamSort.id === "effect") {
              if (hparamSort.desc) {
                return b.getAbsoluteEffect() - a.getAbsoluteEffect();
              }
              return a.getAbsoluteEffect() - b.getAbsoluteEffect();
            }
          }
          return a.name.localeCompare(b.name);
        })
        .map((param) => ({
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
        })),
    ];
  }, [hyperparams, hparamSort]);

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
    state: {
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
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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

  const setGroups = useCustomStore((state) => state.setGroups);
  const groups = useCustomStore((state) => state.groups);
  const selectedTrials = useCustomStore((state) => state.selectedTrials);
  const setSelectedRowPositions = useCustomStore(
    (state) => state.setSelectedRowPositions
  );
  const setSelectedTrials = useCustomStore((state) => state.setSelectedTrials);

  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  const selectFlag = useCustomStore((state) => state.selectFlag);
  const setSelectFlag = useCustomStore((state) => state.setSelectFlag);
  const selectOneTrial = useCustomStore((state) => state.selectOneTrial);
  const setSelectOneTrial = useCustomStore((state) => state.setSelectOneTrial);
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
        } else {
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
    if (selectFlag) {
      const currentGroupTrials = currentSelectedGroup.trials.map(
        (trial) => trial.id
      );
      setRowSelection((prev) => {
        const newSelection = { ...prev };
        rows.forEach((row) => {
          if (currentGroupTrials.includes(Number(row.original.id))) {
            newSelection[row.id] = true;
          }
        });
        return newSelection;
      });

      setSelectFlag(false);
    }
  }, [selectFlag]);

  // useEffect(() => {
  //   if (selectOneTrial !== null) {
  //     const newSelection = { ...rowSelection };
  //     let isLastSelected = false;
  //     rows.forEach((row) => {
  //       if (Number(row.original.id) === selectOneTrial) {
  //         if (newSelection[row.id]) {
  //           if (Object.keys(newSelection).length === 1) {
  //             isLastSelected = true;
  //             return;
  //           }
  //           delete newSelection[row.id];
  //         } else {
  //           newSelection[row.id] = true;
  //         }
  //       }
  //     });
  //     if (isLastSelected) {
  //       setRowSelection({});
  //       setSelectedTrials([]);
  //       setSelectedRowPositions([]);
  //     } else {
  //       setRowSelection(newSelection);
  //     }
  //     setSelectOneTrial(null);
  //   }
  // }, [
  //   selectOneTrial,
  //   rowSelection,
  //   rows,
  //   setSelectedTrials,
  //   setSelectedRowPositions,
  // ]);

  useEffect(() => {
    if (selectOneTrial !== null) {
      const newSelection = { ...rowSelection };
      let isLastSelected = false;
      let targetRowIndex = -1;

      rows.forEach((row, index) => {
        if (Number(row.original.id) === selectOneTrial) {
          targetRowIndex = index;
          if (newSelection[row.id]) {
            if (Object.keys(newSelection).length === 1) {
              isLastSelected = true;
              return;
            }
            delete newSelection[row.id];
          } else {
            newSelection[row.id] = true;
          }
        }
      });

      if (isLastSelected) {
        setRowSelection({});
        setSelectedTrials([]);
        setSelectedRowPositions([]);
      } else {
        setRowSelection(newSelection);

        // Scroll to the target row if found
        if (targetRowIndex !== -1 && parentRef.current) {
          const rowHeight = 20; // Height of each row
          const headerHeight = 35; // Approximate header height
          const containerHeight = parentRef.current.clientHeight;
          const targetPosition = targetRowIndex * rowHeight;

          // Calculate scroll position to center the row in the viewport
          const scrollPosition = Math.max(
            0,
            targetPosition - containerHeight / 2 + rowHeight + headerHeight
          );

          parentRef.current.scrollTo({
            top: scrollPosition,
            behavior: "smooth",
          });
        }
      }
      setSelectOneTrial(null);
    }
  }, [
    selectOneTrial,
    rowSelection,
    rows,
    setSelectedTrials,
    setSelectedRowPositions,
  ]);

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
          height: "calc(100% - 40px)",
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
                        cursor: "pointer",
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
                          {header.column.getCanSort() &&
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
                      cursor: "pointer",
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
                            // @ts-ignore
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
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        className="virtual-table-bottom"
        height={"40px"}
        p={1}
      >
        <Text fontSize="xs" color="gray.600" p={2}>
          Use checkboxes to select a group of trials (
          {formatting(Object.keys(rowSelection).length, "int")} {" / "}
          {formatting(data.length, "int")} Selected)
        </Text>
        <Box display={"flex"}>
          <IconButton
            aria-label="Lasso"
            // icon={isLassoActive ? <TbLassoOff /> : <TbLasso />}
            variant={"outline"}
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
            isDisabled={selectedTrials.length < 3}
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
            <Icon as={MdAdd} mr={1} />
            Create trial group
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default TrialTable;

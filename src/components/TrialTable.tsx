import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useConstDataStore } from "./store/constDataStore";
import { formatting } from "../model/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Box, Button, Icon, Text } from "@chakra-ui/react";
import { useCustomStore } from "../store";

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
  const data = useMemo(
    () =>
      exp?.trials.map((trial) => ({
        id: Number(trial.id),
        metric: trial.metric,
        ...trial.params,
      })) || [],
    [exp]
  );

  const [columnVisibility, setColumnVisibility] = useState({});

  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    const visibility = {};
    hyperparams.forEach((param) => {
      visibility[param.name] = param.visible;
    });
    setColumnVisibility(visibility);
  }, [hyperparams]);
  const columns = useMemo(() => {
    return [
      {
        header: "",
        accessorKey: "check",
        cell: (info) => {
          return (
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
          );
        },
        meta: {
          align: "center",
        },
        size: 30,
      },
      {
        header: "ID",
        accessorKey: "id",
        cell: (info) => info.getValue(),
        size: 40,
        meta: {
          align: "right",
        },
      },
      {
        header: "CVRG",
        accessorKey: "metric",
        cell: (info) => formatting(info.getValue(), "int"),
        meta: {
          align: "right",
        },
        size: 70,
      },
      ...hyperparams.map((param) => {
        return {
          header: () => (
            <div style={{ display: "flex", alignItems: "center" }}>
              <Icon as={param.icon} mr={1} color={"gray.600"}></Icon>
              {param.displayName}
            </div>
          ),
          type: param.type,
          accessorKey: param.name,
          cell: (info) => {
            return info.getValue() === true
              ? "T"
              : info.getValue() === false
              ? "F"
              : //   : info.getColumn().columnDef.type === "string" ?
              info.column.columnDef.meta.type === "string"
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
        };
      }),
    ];
  }, []);

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
  const { rows } = table.getRowModel();

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

  const BOTTOM_PADDING = 100;
  const paddedTotalSize = virtualSize + BOTTOM_PADDING;
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
    if (parentRef.current) {
      const currentScrollTop = parentRef.current.scrollTop;

      if (currentScrollTop !== lastScrollTopRef.current) {
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
            updateSelectedTrials(
              new Set(Object.keys(rowSelection).map(Number))
            );
          }
        }, 150);

        const visibleHeight = parentRef.current.clientHeight;
        setIsScrollNearBottom(
          currentScrollTop > paddedTotalSize * 0.95 - visibleHeight
        );

        lastScrollTopRef.current = currentScrollTop;
      }
    }
  }, [parentRef, paddedTotalSize, isScrolling, rowSelection]);

  useEffect(() => {
    const scrollable = parentRef.current;
    if (scrollable) scrollable.addEventListener("scroll", handleScroll);
    handlePseudoResize();

    return () => {
      if (scrollable) scrollable.removeEventListener("scroll", handleScroll);
    };
  }, [data, handleScroll, handlePseudoResize]);

  useEffect(() => {
    if (isScrollNearBottom) handlePseudoResize();
  }, [isScrollNearBottom, virtualItems.length, handlePseudoResize]);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  const rowRefs = useRef({});
  const updateSelectedTrials = useCallback(
    (newSelectedRows: Set<number>) => {
      const selectedTrialArray = Array.from(newSelectedRows);
      const tableContainer = document.querySelector(".virtual-table");
      const tableRect = tableContainer?.getBoundingClientRect();
      const parentContainer = parentRef.current;
      const scrollTop = parentContainer?.scrollTop || 0;
      const visibleHeight = parentContainer?.clientHeight || 0;
  
      const positions = selectedTrialArray
        .map((trialId) => {
          const index = rows.findIndex((item) => Number(item.id) === trialId);
          const rowElement = rowRefs.current[index];
          const virtualPosition = index * 20;
  
          if (rowElement) {
            const rect = rowElement.getBoundingClientRect();
            
            // Calculate actual position relative to scroll
            let top = rect.bottom;
            let positionType = 'visible';
  
            // Check if row is above visible area
            if (virtualPosition < scrollTop) {
              top = tableRect.top;
              positionType = 'above';
            } 
            // Check if row is below visible area
            else if (virtualPosition > scrollTop + visibleHeight) {
              top = tableRect.bottom;
              positionType = 'below';
            }
  
            return {
              trialId: trialId,
              top: top,
              left: rect.left,
              height: rect.height,
              width: rect.width,
              order: index,
              positionType: positionType
            };
          }
  
          // For rows that don't have elements (virtualized out)
          const estimatedPosition = virtualPosition;
          let positionType = 'visible';
          let top = null;
  
          if (estimatedPosition < scrollTop) {
            top = tableRect.top;
            positionType = 'above';
          } else if (estimatedPosition > scrollTop + visibleHeight) {
            top = tableRect.bottom;
            positionType = 'below';
          }
  
          return {
            trialId: trialId,
            top: top,
            left: tableRect?.left || 0,
            height: 20, 
            width: tableRect?.width || 0,
            order: index,
            positionType: positionType
          };
        })
        .filter((position) => position !== null);
  
      setSelectedTrials(selectedTrialArray);
      setSelectedRowPositions(positions);
    },
    [rows, parentRef]
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
        } else if (isMultiSelect) {
          for (let i = 0; i < rows.length; i++) {
            delete newSelection[rows[i].id];
          }
          setIsMultiSelect(false);
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
          height: "100%",
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
            {...{
              style: {
                width: table.getCenterTotalSize(),
                tableLayout: "fixed",
              },
            }}
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="virtual-table-sticky-header"
                >
                  {headerGroup.headers.map((header) => {
                    // const { column } = header;
                    return (
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
                            {{
                              asc: " 🔼",
                              desc: " 🔽",
                            }[header.column.getIsSorted() as string] ?? null}
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
                    );
                  })}
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
                            // @ts-ignore
                            textAlign: cell.column.columnDef.meta.align,
                            padding: "0 8px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            alignItems: "center",
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
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
        <div
          className="virtual-table-bottom"
          style={{
            position: "absolute",
            width: "100%",
            // transform: "translate(-50%, -50%)",
            zIndex: 10,
            bottom: "0px",
            // left: "10%",
            // fill: "red",
            height: "30px",
          }}
        ></div>
        <Box
          position="absolute"
          bg="white"
          boxShadow="lg"
          borderRadius="md"
          bottom={"0px"}
          left="50%"
          width={"90%"}
          transform="translate(-50%, -50%)" // Center the box
          p={1}
          zIndex={10}
          display={"flex"}
          justifyContent={"space-between"}
          alignItems="center"
        >
          <Text fontSize={"xs"} color="gray.600" p={2}>
            Choose trials to create a trial group (
            {formatting(Object.keys(rowSelection).length, "int")} {" / "}
            {formatting(data.length, "int")} Selected)
          </Text>
          <Button
            size={"xs"}
            colorScheme={"blue"}
            variant={"solid"}
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
      </div>
    </div>
  );
};

export default TrialTable;

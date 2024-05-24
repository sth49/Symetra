/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { Experiment } from "../model/experiment";
import { Hyperparam, HyperparamTypes } from "../model/hyperparam";
import { ArrowDownIcon, ArrowUpIcon } from "@chakra-ui/icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  useReactTable,
  getGroupedRowModel,
} from "@tanstack/react-table";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Box, Button } from "@chakra-ui/react";
interface OptimizedDataTableProps {
  data: Experiment | null;
}

const OptimizedDataTable = (props: OptimizedDataTableProps) => {
  const [data, _setData] = useState(
    props.data?.trials.map((trial) => ({
      id: trial.id,
      metric: trial.metric,
      ...trial.params,
    }))
  );
  const booleanAggregationFn = (columnId, leafRows, childRows) => {
    const total = leafRows.length;
    const trueCount = leafRows.filter(
      (row) => row.original[columnId] === true
    ).length;

    return { trueCount, total };
  };

  const exp = props.data;

  const columns = React.useMemo(() => {
    return [
      {
        accessorKey: "id",
        header: "ID",
        size: 40,
        enableGrouping: false,
        cell: ({ cell }) => cell.getValue(cell.column.accessorKey).toFixed(0),
        aggregationFn: "count",
      },
      {
        accessorKey: "metric",
        header: "Metric",
        size: 80,
        enableGrouping: true,
        cell: ({ cell }) => cell.getValue(cell.column.accessorKey).toFixed(2),
        aggregationFn: "mean",
      },
      ...(exp?.hyperparams.map((hp: Hyperparam) => ({
        accessorKey: hp.name,
        header: hp.displayName,
        size: 60,
        enableGrouping: true,
        aggregationFn:
          hp.type === HyperparamTypes.Boolean ? booleanAggregationFn : "mean",

        cell: ({ cell, row, column }) => {
          switch (hp.type) {
            case HyperparamTypes.Boolean: {
              console.log("getIsAggre", cell.getIsAggregated());
              // console.log("getValue", cell.getValue(cell.column.accessorKey));
              return (
                <Box display="flex" justifyContent="center" alignItems="center">
                  <svg width={12} height={12}>
                    <circle
                      cx="6"
                      cy="6"
                      r="5"
                      stroke={
                        cell.getValue(cell.column.accessorKey)
                          ? "white"
                          : "gray"
                      }
                      fill={
                        cell.getValue(cell.column.accessorKey)
                          ? "gray"
                          : "white"
                      }
                    ></circle>
                  </svg>
                </Box>
              );
            }
            case HyperparamTypes.Categorical: {
              return (
                <Box display="flex" justifyContent="center" alignItems="center">
                  <svg width={12} height={12}>
                    <rect
                      width={12}
                      height={12}
                      fill={hp.getColor(
                        cell.getValue(cell.column.accessorKey) as string
                      )}
                    ></rect>
                  </svg>
                </Box>
              );
            }
            case HyperparamTypes.Numerical: {
              return hp.formatting(cell.getValue(cell.column.accessorKey));
            }
            default: {
              return "U";
            }
          }
        },
      })) || []), // exp?.hyperparams가 undefined일 경우 빈 배열을 확장
    ];
  }, [exp]); // 의존성 배열에 exp를 포함시킵니다.

  const table = useReactTable({
    data: data || [], // Provide a default value for data
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    debugTable: true,
    initialState: {
      columnPinning: {
        left: ["id"],
      },
    },
  });

  const { rows } = table.getRowModel();

  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  return (
    <div className="app">
      ({data?.length ?? 0} rows X {columns.length} columns)
      <div
        className="container"
        ref={tableContainerRef}
        style={{
          overflow: "auto", //our scrollable table container
          position: "relative", //needed for sticky header
          height: "800px", //should be a fixed height
        }}
      >
        {/* Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights */}
        <table style={{ display: "grid" }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    <div onClick={header.column.getToggleGroupingHandler()}>
                      {(header as HeaderGroup).isGrouped ? "👇" : "👉"}{" "}
                      {/* 그룹화 상태 아이콘 */}
                      {header.column.columnDef.header}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <thead
            style={{
              display: "grid",
              position: "sticky",
              top: 0,
              zIndex: 1,
              backgroundColor: "white",
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                style={{ display: "flex", width: "100%" }}
              >
                {headerGroup.headers.map((header) => {
                  console.log("header", header);
                  return (
                    <th
                      key={header.id}
                      style={{
                        display: "flex",
                        width: header.getSize(),
                      }}
                    >
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ArrowUpIcon />,
                          desc: <ArrowDownIcon />,
                        }[header.column.getIsSorted() as string] ?? null}
                        <div>
                          <Button
                            size={"small"}
                            onClick={header.column.getToggleGroupingHandler()}
                          >
                            {(
                              header as HeaderGroup
                            ).column.getGroupedIndex() !== -1
                              ? "UG"
                              : "G"}
                          </Button>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody
            style={{
              display: "grid",
              height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
              position: "relative", //needed for absolute positioning of rows
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index] as Row<any>;
              return (
                <tr
                  data-index={virtualRow.index} //needed for dynamic row height measurement
                  ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
                  key={row.id}
                  style={{
                    display: "flex",
                    position: "absolute",
                    transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
                    width: "100%",
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    // console.log(cell.column.columnDef.cell);
                    // console.log(cell.getContext());
                    return (
                      <td
                        key={cell.id}
                        style={{
                          display: "flex",
                          width: cell.column.getSize(),
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
    </div>
  );
};
export default OptimizedDataTable;

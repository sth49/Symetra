/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, useState } from "react";
import { Experiment } from "../model/experiment";
import { Hyperparam, HyperparamTypes } from "../model/hyperparam";
import { FaLayerGroup } from "react-icons/fa6";
import { FaSort } from "react-icons/fa6";
import { FaSortUp } from "react-icons/fa6";
import { FaSortDown } from "react-icons/fa6";
import { Heading, Icon, Text } from "@chakra-ui/react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  useReactTable,
  getExpandedRowModel,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Box, Button } from "@chakra-ui/react";
import { getGroupedRowModel } from "../model/getGroupedRowModel";
import { FaCaretRight } from "react-icons/fa6";
import { FaCaretDown } from "react-icons/fa6";
import CustomBoxPlot from "./CustomBoxPlot";
interface OptimizedDataTableProps {
  data: Experiment | null;
}

export interface BinData {
  value: number;
  count: number;
}

const OptimizedDataTable = (props: OptimizedDataTableProps) => {
  const [data, _setData] = useState(
    props.data?.trials.map((trial) => ({
      id: trial.id,
      metric: trial.metric,
      ...trial.params,
    }))
  );

  const exp = props.data;

  const columns = React.useMemo(() => {
    return [
      {
        accessorKey: "id",
        header: "ID",
        size: 40,
        enableGrouping: false,
        cell: ({ cell }) => {
          if (cell.getIsAggregated()) {
            return "-";
          }
          return cell.getValue(cell.column.accessorKey);
        },
        type: "string",
      },
      {
        accessorKey: "metric",
        header: "Metric",
        size: 80,
        enableGrouping: true,
        aggregationFn: "numericalAggregationFn",
        type: "number",
        binCount: 5,
        cell: ({ cell, row, column }) => {
          if (
            (cell.getIsPlaceholder() && row.leafRows) ||
            cell.getIsGrouped() ||
            cell.getIsAggregated()
          ) {
            const name = cell.getIsGrouped()
              ? cell.row.id.split(":")[cell.row.id.split(":").length - 1]
              : "all";
            const points = cell.getIsPlaceholder()
              ? row.leafRows.map((row) => row.original.metric)
              : cell.getIsGrouped() && row.getParentRows().length > 0
              ? row.getParentRow().leafRows.map((row) => row.original.metric)
              : cell.getIsAggregated()
              ? cell.getValue(cell.column.accessorKey)
              : exp?.trials.map((trial) => trial.metric);
            const binCount = column.columnDef.binCount;

            return (
              <CustomBoxPlot
                data={points}
                name={name}
                hpName="metric"
                type="numerical"
                count={points.length}
                binCount={binCount}
              />
            );
          } else {
            return cell.getValue(cell.column.accessorKey);
          }
        },
      },
      ...(exp?.hyperparams.map((hp: Hyperparam) => ({
        accessorKey: hp.name,
        header: hp.displayName,
        size: hp.displayName.length * 20 + 20,
        enableGrouping: true,
        binCount: 5,
        aggregationFn:
          hp.type === HyperparamTypes.Boolean
            ? "booleanAggregationFn"
            : hp.type === HyperparamTypes.Categorical
            ? "categoricalAggregationFn"
            : hp.type === HyperparamTypes.Numerical
            ? "numericalAggregationFn"
            : "mean",
        type:
          hp.type === HyperparamTypes.Boolean
            ? "boolean"
            : hp.type === HyperparamTypes.Categorical
            ? "string"
            : hp.type === HyperparamTypes.Numerical
            ? "number"
            : "string",

        cell: ({ cell, row, column }) => {
          switch (hp.type) {
            case HyperparamTypes.Boolean: {
              if (
                (cell.getIsPlaceholder() && row.leafRows) ||
                cell.getIsGrouped() ||
                cell.getIsAggregated()
              ) {
                const name = cell.getIsGrouped()
                  ? cell.row.id
                      .split(":")
                      [cell.row.id.split(":").length - 1].toString()
                  : "all";
                const points = cell.getIsPlaceholder()
                  ? row.leafRows.map((row) => (row.original[hp.name] ? 1 : 0))
                  : cell.getIsGrouped() && row.getParentRows().length > 0
                  ? row
                      .getParentRow()
                      .leafRows.map((row) => (row.original[hp.name] ? 1 : 0))
                  : cell.getIsAggregated()
                  ? cell.getValue(cell.column.accessorKey)
                  : exp?.trials.map((trial) => (trial.params[hp.name] ? 1 : 0));

                const binCount = 2;
                return (
                  <CustomBoxPlot
                    data={points}
                    name={name}
                    hpName={hp.name}
                    type="boolean"
                    count={points.length}
                    binCount={binCount}
                  />
                );
              } else {
                return (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
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
              if (
                (cell.getIsPlaceholder() && row.leafRows) ||
                cell.getIsGrouped() ||
                cell.getIsAggregated()
              ) {
                const name = cell.getIsGrouped()
                  ? cell.row.id
                      .split(":")
                      [cell.row.id.split(":").length - 1].toString()
                  : "all";

                const points = cell.getIsPlaceholder()
                  ? row.leafRows.map((row) => row.original[hp.name])
                  : cell.getIsGrouped() && row.getParentRows().length > 0
                  ? row
                      .getParentRow()
                      .leafRows.map((row) => row.original[hp.name])
                  : cell.getIsAggregated()
                  ? cell.getValue(cell.column.accessorKey)
                  : exp?.trials.map((trial) => trial.params[hp.name]);
                const keys = Array.from(
                  new Set(exp.trials.map((trial) => trial.params[hp.name]))
                ).sort();
                return (
                  <CustomBoxPlot
                    data={points}
                    name={name}
                    keys={keys}
                    type="categorical"
                    count={points.length}
                    binCount={points.length}
                  ></CustomBoxPlot>
                );
              }
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
              if (
                (cell.getIsPlaceholder() && row.leafRows) ||
                cell.getIsGrouped() ||
                cell.getIsAggregated()
              ) {
                const name = cell.getIsGrouped()
                  ? cell.row.id.split(":")[cell.row.id.split(":").length - 1]
                  : "all";
                const points = cell.getIsPlaceholder()
                  ? row.leafRows.map((row) => row.original[hp.name])
                  : cell.getIsGrouped() && row.getParentRows().length > 0
                  ? row
                      .getParentRow()
                      .leafRows.map((row) => row.original[hp.name])
                  : cell.getIsAggregated()
                  ? cell.getValue(cell.column.accessorKey)
                  : exp?.trials.map((trial) => trial.params[hp.name]);
                const binCount = column.columnDef.binCount;
                return (
                  <>
                    <CustomBoxPlot
                      data={points}
                      name={name}
                      type="numerical"
                      count={points.length}
                      binCount={binCount}
                    />
                  </>
                );
              } else {
                return hp.formatting(cell.getValue(cell.column.accessorKey));
              }
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
    aggregationFns: {
      booleanAggregationFn: (columnId, leafRows, childRows) => {
        const values = leafRows.map((row) =>
          row.original[columnId] === true ? 1 : 0
        );

        return values;
      },
      categoricalAggregationFn: (columnId, leafRows, childRows) => {
        const values = leafRows.map((row) => row.original[columnId]);
        return values;
      },
      numericalAggregationFn: (columnId, leafRows, childRows) => {
        const values = leafRows.map((row) => row.original[columnId]);
        return values;
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),

    debugTable: true,
    initialState: {
      columnPinning: {
        left: ["id", "metric"],
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
    <Box ref={tableContainerRef}>
      <table style={{ display: "grid", padding: "2px" }}>
        <thead
          style={{
            display: "grid",
            position: "sticky",
            top: 0,
            zIndex: 1,
            backgroundColor: "white",
            borderBottom: "0.5px solid gray",
            padding: "2px",
          }}
        >
          {/* <Heading as="h5" size="sm" color={"gray.600"} padding={2} m={2}>
            Trial Details
          </Heading> */}
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              style={{
                display: "flex",
                width: "100%",
                paddingBottom: "6px",
              }}
            >
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    style={{
                      width: header.getSize(),
                    }}
                  >
                    <div
                      {...{
                        className: header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : "",
                      }}
                    >
                      <Box
                        display={"flex"}
                        justifyContent={"space-around"}
                        alignItems={"center"}
                        p={2}
                      >
                        <Text
                          fontSize="md"
                          fontWeight="bold"
                          color="gray.500"
                          textAlign="center"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </Text>

                        {/* {{
                          asc: <ArrowUpIcon />,
                          desc: <ArrowDownIcon />,
                        }[header.column.getIsSorted() as string] ?? " "} */}
                      </Box>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        size={"small"}
                        onClick={header.column.getToggleSortingHandler()}
                        p={1}
                      >
                        {{
                          asc: <Icon as={FaSortUp} color={"gray.600"} />,
                          desc: <Icon as={FaSortDown} color={"gray.600"} />,
                        }[header.column.getIsSorted() as string] ?? (
                          <Icon as={FaSort} color={"gray.400"} />
                        )}
                      </Button>
                      {header.column.getCanGroup() && (
                        <Button
                          size={"small"}
                          onClick={header.column.getToggleGroupingHandler()}
                          p={1}
                        >
                          <Icon
                            as={FaLayerGroup}
                            color={
                              header.column.getGroupedIndex() !== -1
                                ? "gray.600"
                                : "gray.400"
                            }
                          />
                        </Button>
                      )}
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
                  padding: "2px",
                  borderBottom: "0.5px solid gray",
                }}
              >
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td
                      key={cell.id}
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        width: cell.column.getSize(),
                      }}
                    >
                      {cell.getIsGrouped() ? (
                        <>
                          <button
                            {...{
                              onClick: row.getToggleExpandedHandler(),
                              style: {
                                cursor: row.getCanExpand()
                                  ? "pointer"
                                  : "normal",
                              },
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                            {row.getIsExpanded() ? (
                              <Icon as={FaCaretDown} color={"gray.600"} />
                            ) : (
                              <Icon as={FaCaretRight} color={"gray.400"} />
                            )}
                          </button>
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
    </Box>
  );
};
export default OptimizedDataTable;

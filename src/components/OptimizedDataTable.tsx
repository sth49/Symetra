/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, useState } from "react";
import { Experiment } from "../model/experiment";
import { Hyperparam, HyperparamTypes } from "../model/hyperparam";
import { ArrowDownIcon, ArrowUpIcon } from "@chakra-ui/icons";
import { ViolinPlot, BoxPlot } from "@visx/stats";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Group } from "@visx/group";
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
  const booleanAggregationFn = (columnId, leafRows, childRows) => {
    const total = leafRows.length;
    const trueCount = leafRows.filter(
      (row) => row.original[columnId] === true
    ).length;

    return { trueCount, total };
  };

  const categoricalAggregationFn = (columnId, leafRows, childRows) => {
    const total = leafRows.length;
    const counts = leafRows.reduce((acc, row) => {
      const value = row.original[columnId];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
    return { counts, total };
  };

  const numericalAggregationFn = (columnId, leafRows, childRows) => {
    // for violin plot
    const values = leafRows.map((row) => row.original[columnId]);
    return values;
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
        size: hp.displayName.length * 20 + 20,

        enableGrouping: true,
        aggregationFn:
          hp.type === HyperparamTypes.Boolean
            ? booleanAggregationFn
            : hp.type === HyperparamTypes.Categorical
            ? categoricalAggregationFn
            : hp.type === HyperparamTypes.Numerical
            ? numericalAggregationFn
            : "mean",

        cell: ({ cell, row, column }) => {
          switch (hp.type) {
            case HyperparamTypes.Boolean: {
              if (cell.getIsAggregated()) {
                const { trueCount, total } = cell.getValue(
                  cell.column.accessorKey
                );
                const percentage = (trueCount / total) * 100;

                return (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <svg height="20" width="20">
                      <circle
                        r="9"
                        cx="10"
                        cy="10"
                        fill="white"
                        stroke="gray"
                      />
                      <circle
                        r="5"
                        cx="10"
                        cy="10"
                        fill="transparent"
                        stroke="gray"
                        strokeWidth="10"
                        strokeDasharray={`${(percentage * 31.4) / 100} 31.4`}
                        transform="rotate(-90) translate(-20)"
                      />
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
              if (cell.getIsAggregated()) {
                const { counts, total } = cell.getValue(
                  cell.column.accessorKey
                );
                const categories = Object.keys(counts);
                const barWidth = 30 / categories.length; // 바의 넓이를 균등하게 분배

                return (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <svg width={30} height={20}>
                      {categories.map((category, index) => {
                        const barHeight = (counts[category] / total) * 20; // 바의 높이는 최대 50
                        return (
                          <rect
                            key={category}
                            x={index * barWidth}
                            y={20 - barHeight}
                            width={barWidth}
                            height={barHeight}
                            fill={hp.getColor(category)}
                            stroke="black"
                            strokeWidth="1"
                          />
                        );
                      })}
                    </svg>
                  </Box>
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
              if (cell.getIsAggregated()) {
                // return violin plot
                const points = cell.getValue(cell.column.accessorKey);
                points.sort((a, b) => a - b);
                const sampleSize = points.length;
                const firstQuartile = points[Math.floor(sampleSize / 4)];
                const thirdQuartile = points[Math.floor((sampleSize * 3) / 4)];
                const IQR = thirdQuartile - firstQuartile;
                let min = Math.min(...points);
                let max = Math.max(...points);

                const outliers = points.filter((p) => p < min || p > max);
                if (outliers.length === 0) {
                  min = Math.min(...points);
                  max = Math.max(...points);
                }
                const binWidth =
                  2 * IQR * (sampleSize - outliers.length) ** (-1 / 3) || 1;
                const binNum = Math.round((max - min) / binWidth);
                const actualBinWidth = (max - min) / binNum;
                const bins: number[] = new Array(binNum + 2).fill(0);
                const values: number[] = new Array(binNum + 2).fill(min);
                for (let ii = 1; ii <= binNum; ii += 1) {
                  values[ii] += actualBinWidth * (ii - 0.5);
                }
                values[values.length - 1] = max;

                points
                  .filter((p) => p >= min && p <= max)
                  .forEach((p) => {
                    bins[Math.floor((p - min) / actualBinWidth) + 1] += 1;
                  });

                const binData: BinData[] = values.map((v: number, index) => ({
                  value: v,
                  count: bins[index],
                }));

                const width = 30;
                const height = 20;
                const yScale = scaleLinear({
                  range: [height, 0],
                  domain: [min, max],
                });

                return (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <svg width={30} height={20}>
                      <ViolinPlot
                        data={binData}
                        width={30}
                        height={20}
                        fill="#48BB78"
                        valueScale={yScale}
                        orientation="vertical"
                      />
                    </svg>
                  </Box>
                );
              }
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
    <div
      className="container"
      ref={tableContainerRef}
      style={{
        overflow: "auto", //our scrollable table container
        position: "relative", //needed for sticky header
        height: "800px", //should be a fixed height
        width: "80%",
      }}
    >
      <table style={{ display: "grid" }}>
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
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} style={{ display: "flex", width: "100%" }}>
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
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: <ArrowUpIcon />,
                        desc: <ArrowDownIcon />,
                      }[header.column.getIsSorted() as string] ?? null}
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
                        colorScheme="yellow"
                        p={1}
                      >
                        S
                      </Button>
                      {header.column.getCanGroup() && (
                        <Button
                          size={"small"}
                          onClick={header.column.getToggleGroupingHandler()}
                          p={1}
                          colorScheme="blue"
                        >
                          {header.column.getGroupedIndex() !== -1 ? "UG" : "G"}
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
  );
};
export default OptimizedDataTable;

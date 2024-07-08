import { Box } from "@chakra-ui/react";
import { Experiment } from "../model/experiment";
import { useState, useEffect, useMemo, useCallback } from "react";
import * as d3 from "d3";

import React from "react";
import { Badge } from "@chakra-ui/react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  getExpandedRowModel,
  getGroupedRowModel,
} from "@tanstack/react-table";
import CustomBoxPlot from "./CustomBoxPlot";
import { BooleanHyperparam, CategoricalHyperparam } from "../model/hyperparam";
import { useCustomStore } from "../store";
const EffectTable = (props: { data: Experiment | null }) => {
  const exp = props.data;
  const [showChartMap, setShowChartMap] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const { clickedHparam, setClickedHparam } = useCustomStore();

  const processedData = useMemo(
    () =>
      exp?.hyperparams
        .sort((a, b) => Math.abs(b.getEffect()) - Math.abs(a.getEffect()))
        .map((hp) => ({
          name: hp.displayName,
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

  const [data, setData] = useState(processedData);
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "dist",
        header: "Dist.",
        size: 40,
        cell: (cell) => {
          const data = cell.getValue(cell.column.accessorKey);
          const points = data.points;
          const type = data.type;
          const binCount = data.binCount;
          const keys = data.keys;
          let name = "all";
          // let binCount = cell.row
          return (
            <CustomBoxPlot
              data={points}
              name={name}
              width={40}
              height={40}
              type={type}
              count={points.length}
              binCount={binCount}
              keys={keys}
            />
          );
        },
      },
      {
        accessorKey: "name",
        header: "Name",
        size: 80,
        cell: (cell) => {
          return cell.getValue(cell.column.accessorKey);
        },
      },

      {
        accessorKey: "effect",
        header: "Effect",
        size: 90,
        cell: (cell) => {
          return cell.getValue(cell.column.accessorKey).toFixed(2);
        },
      },
      {
        accessorKey: "shapValues",
        header: "SHAP Values",
        size: 130,
        cell: (cell) => {
          const value = cell.getValue(cell.column.accessorKey);

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
                  {/* {key}: {value[key].toFixed(3)} */}
                </Badge>
              ))}
            </Box>
          );
        },
      },
    ],
    []
  );

  useEffect(() => {
    if (exp) {
      const initialShowChartMap = exp.hyperparams.reduce((map, hp) => {
        map[hp.name] = false;
        return map;
      }, {});
      setShowChartMap(initialShowChartMap);
    }
  }, [exp]);

  const shapleyColorScale = useMemo(
    () => d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]),
    []
  );
  const handleRowClick = useCallback((rowId: string, hparamId: string) => {
    console.log(`Row clicked: ${rowId}`);
    console.log(`Hparam clicked: ${hparamId}`);
    setHoveredRowId(rowId);
    setClickedHparam(hparamId);
    // 여기에 row 클릭 시 수행할 로직을 넣습니다.
  }, []);

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });
  const TableRow = React.memo(({ row, onRowClick }) => {
    return (
      <tr
        key={row.id}
        style={{
          display: "flex",
          borderBottom: "0.5px solid gray",
          backgroundColor: hoveredRowId === row.id ? "#f0f0f0" : "transparent",
          boxShadow:
            hoveredRowId === row.id ? "0 0 10px rgba(0,0,0,0.1)" : "none",
        }}
        onClick={() => onRowClick(row.id, row.original.name)}
      >
        {row.getVisibleCells().map((cell) => (
          <td
            key={cell.id}
            style={{
              display: "flex",
              justifyContent: "center",
              width: cell.column.getSize(),
              alignItems: "center",
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    );
  });
  const rowModel = useMemo(() => table.getRowModel(), [table]);

  return (
    <Box bg={"white"}>
      <table style={{ display: "grid", padding: "2px" }}>
        <thead
          style={{
            display: "grid",
            position: "sticky",
            top: 0,
            zIndex: 1,
            backgroundColor: "white",
            borderBottom: "0.5px solid gray",
            padding: "8px",
          }}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{
                    width: header.column.getSize(),
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rowModel.rows.map((row) => (
            <TableRow key={row.id} row={row} onRowClick={handleRowClick} />
          ))}
        </tbody>
      </table>
    </Box>
  );
};

export default EffectTable;

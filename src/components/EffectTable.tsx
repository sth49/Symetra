import { Box, Button, Checkbox, Icon } from "@chakra-ui/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { FaEye } from "react-icons/fa6";
import { FaEyeSlash } from "react-icons/fa6";
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
const EffectTable = () => {
  const { exp, hyperparams, setHyperparams } = useCustomStore();

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);

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

  const toggleVisibilityForSelected = (visible) => {
    const updatedHyperparams = hyperparams.map((hp, index) => {
      if (selectedRows.has(index)) {
        return { ...hp, visible };
      }
      return hp;
    });
    setHyperparams(updatedHyperparams);
    setSelectedRows(new Set()); // 선택 초기화
  };

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
        id: "select",
        size: 30,
        cell: ({ row }) => (
          <div className="px-1">
            <Checkbox
              isChecked={selectedRows.has(row.index)}
              onChange={(e) =>
                toggleRowSelection(row.index, e.nativeEvent.shiftKey)
              }
            />
          </div>
        ),
      },
      {
        accessorKey: "visible",
        header: "",
        size: 60,
        cell: (cell) => {
          return (
            <Icon
              as={
                hyperparams.find(
                  (hp) => hp.displayName === cell.row.original.name
                )?.visible
                  ? FaEye
                  : FaEyeSlash
              }
              onClick={() => {
                const hp = hyperparams.find(
                  (hp) => hp.displayName === cell.row.original.name
                );
                if (hp) {
                  hp.visible = !hp.visible;
                  setHyperparams([...hyperparams]);
                }
              }}
              color={"gray"}
            />
          );
        },
      },
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
                </Badge>
              ))}
            </Box>
          );
        },
      },
    ],
    [selectedRows, toggleRowSelection]
  );

  const shapleyColorScale = useMemo(
    () => d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]),
    []
  );

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });
  const TableRow = React.memo(({ row }) => {
    return (
      <tr
        key={row.id}
        style={{
          display: "flex",
          borderBottom: "0.5px solid gray",
        }}
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
      <Box display={"flex"} p={2}>
        <Button onClick={() => toggleVisibilityForSelected(true)} mr={2}>
          Show
        </Button>
        <Button onClick={() => toggleVisibilityForSelected(false)}>Hide</Button>
      </Box>

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
            <TableRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </Box>
  );
};

export default EffectTable;

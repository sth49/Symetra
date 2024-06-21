import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Spinner,
  Tooltip,
  Text,
} from "@chakra-ui/react";
import { Experiment } from "../model/experiment";
import { useState, useEffect, useMemo } from "react";
import * as d3 from "d3";
import { BinData } from "./OptimizedDataTable";
import { ViolinPlot } from "@visx/stats";
import { AxisBottom } from "@visx/axis";
import { generateBinnedData } from "../model/utils";
import { Bar } from "@visx/shape";
import { AxisLeft } from "@visx/axis";
import { scaleLinear } from "@visx/scale";
import { Switch } from "@chakra-ui/react";
import CustomBoxPlot from "./CustomBoxPlot";
import {
  BooleanHyperparam,
  Hyperparam,
  NumericalHyperparam,
} from "../model/hyperparam";
import React from "react";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  useReactTable,
  getExpandedRowModel,
  getGroupedRowModel,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
const EffectTable = (props: { data: Experiment | null }) => {
  const exp = props.data;
  const [showChartMap, setShowChartMap] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [data, setData] = useState(
    exp?.hyperparams.map((hp) => ({
      name: hp.displayName,
      effect: hp.getEffect(),
      shapValues:
        hp.shapValues.reduce((acc, currentValue) => acc + currentValue, 0) /
        hp.shapValues.length,
    }))
  );
  console.log("data", data);
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: (cell) => {
          return cell.getValue(cell.column.accessorKey);
        },
      },

      {
        accessorKey: "effect",
        header: "Effect",
      },
      {
        accessorKey: "shapValues",
        header: "SHAP Values",
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

  const colorScale = useMemo(() => {
    if (!exp) {
      return null;
    }
    const maxEffect = Math.max(
      ...exp.hyperparams.map((hp) => Math.abs(hp.getEffect()))
    );
    return d3.scaleSequential(d3.interpolateReds).domain([0, maxEffect]);
  }, []);
  const textScale = useMemo(() => {
    if (!exp) {
      return null;
    }
    const maxEffect = Math.max(
      ...exp.hyperparams.map((hp) => Math.abs(hp.getEffect()))
    );
    return d3.scaleLinear().domain([0, maxEffect]).range([0, 1]);
  }, []);

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  console.log(table);
  const { rows } = table.getRowModel();
  console.log("rows", rows);

  return (
    <Box height="585px" margin={1} bg={"white"} overflow={"auto"}>
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
          <Heading as="h5" size="sm" color={"gray.600"} padding={2}>
            Hyperparameter Effects
          </Heading>
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
        {/* <tbody
          style={{
            display: "grid",
            overflow: "auto",
            width: "100%",
          }}
        >
          {table.getRowModel().rows.map((row) => {
            console.log("row", row);
            return (
              <tr
                data-index={row.index} //needed for dynamic row height measurement
                // ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
                key={row.id}
                style={{
                  display: "flex",
                  position: "absolute",
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
        </tbody> */}
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{
                    width: cell.column.getSize(),
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* <Box overflow={"auto"} height="90%" mt={3}> */}
      {/* {exp.hyperparams
        .sort((a, b) => b.getEffect() - a.getEffect())
        .map((hp) => {
          const backgroundColor = colorScale
            ? colorScale(hp.getEffect())
            : "white";
          if (
            hp.name === "silent-klee-assume" ||
            hp.name === "sym-arg" ||
            hp.name === "sym-flies"
          ) {
            return <>{hp.name}</>;
          }

          const points = hp.shapValues;

          const width = 30;
          const height = 30;
          const margin = { top: 1, right: 1, bottom: 1, left: 1 };
          const binSize = 0.05;

          const xMin = Math.min(...points);
          const xMax = Math.max(...points);
          const xRange = xMax - xMin;
          const binCount = Math.ceil(xRange / binSize);
          const xScale = scaleLinear({
            domain: [xMin, xMax],
            range: [margin.left, width - margin.right],
          });

          const bins = Array.from({ length: binCount }, (_, i) => ({
            x0: xMin + i * binSize,
            x1: xMin + (i + 1) * binSize,
            count: 0,
          }));

          points.forEach((d) => {
            const binIndex = Math.floor((d - xMin) / binSize);
            if (binIndex >= 0 && binIndex < binCount) {
              bins[binIndex].count++;
            }
          });

          const yScale = scaleLinear({
            domain: [0, Math.max(...bins.map((bin) => bin.count))],
            range: [height - margin.bottom, margin.top],
          });

          return (
            <Box
              key={hp.name}
              border={"1px solid white"}
              padding={1}
              // background={backgroundColor}
              // color={textScale(hp.getEffect()) < 0.5 ? "black" : "white"}
              display={"flex"}
            >
              


              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                background={"white"}
                p={0.5}
              >
                <CustomBoxPlot
                  data={exp?.trials.map((trial) => trial.params[hp.name])}
                  width={width}
                  name={"all"}
                  height={height}
                  margin={margin}
                  type={
                    hp instanceof BooleanHyperparam
                      ? "boolean"
                      : hp instanceof NumericalHyperparam
                      ? "numerical"
                      : "categorical"
                  }
                  count={
                    exp?.trials.map((trial) => trial.params[hp.name]).length
                  }
                  keys={Array.from(
                    new Set(exp?.trials.map((trial) => trial.params[hp.name]))
                  ).sort()}
                  binCount={
                    hp instanceof BooleanHyperparam
                      ? 2
                      : hp instanceof NumericalHyperparam
                      ? 5
                      : 3
                  }
                />
              </Box>
            </Box>
          );
        })} */}
    </Box>
    // </Box>
  );
};

export default EffectTable;

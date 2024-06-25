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

import React from "react";
import { Badge } from "@chakra-ui/react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  useReactTable,
  getExpandedRowModel,
  getGroupedRowModel,
} from "@tanstack/react-table";
import CustomBoxPlot from "./CustomBoxPlot";
import { BooleanHyperparam, CategoricalHyperparam } from "../model/hyperparam";
const EffectTable = (props: { data: Experiment | null }) => {
  const exp = props.data;
  const [showChartMap, setShowChartMap] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [data, setData] = useState(
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
                binCount: 5,
                keys: 0,
              },
      }))
  );
  console.log("effect by value", exp?.hyperparams[3].getEffectByValue());
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
          console.log("cell", cell);
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
        size: 220,
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
              maxWidth={"220px"}
            >
              {Object.keys(value)
                .sort()
                .map((key) => (
                  <Badge
                    key={key}
                    m={2}
                    background={shapleyColorScale(value[key])}
                    color={Math.abs(value[key]) < 0.5 ? "black" : "white"}
                  >
                    {key}: {value[key].toFixed(3)}
                  </Badge>
                ))}
            </Box>
          );
        },
        // cell: (cell) => {
        //   console.log("cell", cell.getValue(cell.column.accessorKey));
        //   const value = cell.getValue(cell.column.accessorKey);
        //   // if (Object.keys(value).length === 3) {
        //   //   return <></>;
        //   // }
        //   return (
        //     <Box
        //       display={"flex"}
        //       justifyContent={"space-between"}
        //       overflowX={"auto"}
        //     >
        //       {Object.keys(value).map((key) => {
        //         return (
        //           <Text>
        //             {key}: {value[key].toFixed(3)}
        //           </Text>
        //         );
        //       })}
        //     </Box>
        //   );
        // },
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

  const shapleyColorScale = d3
    .scaleSequential(d3.interpolateRdBu)
    .domain([-1, 1]);

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
            padding: "8px",
          }}
        >
          <Heading as="h5" size="sm" color={"gray.600"} p={2} pb={6}>
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
            <tr
              key={row.id}
              style={{
                display: "flex",
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{
                    display: "flex",
                    justifyContent: "center",
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

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatting, getTextColor } from "../model/utils";

import * as d3 from "d3";
import { useMemo } from "react";
import { useCustomStore } from "../store";
import { Box, Tooltip, Text, Icon } from "@chakra-ui/react";
import { performStatisticalTest } from "../model/statistic";

import { useConstDataStore } from "./store/constDataStore";
import MetricBadge from "./MetricBadge";
import { AiFillStar } from "react-icons/ai";
const EmptyBox = () => {
  return (
    <Box
      width={"100%"}
      backgroundColor={"#F7F7F7"}
      height={"10px"}
      p={1}
      display={"flex"}
      justifyContent={"center"}
      borderRadius={"5px"}
      // border={"1px solid #CFCFCF"}
    ></Box>
  );
};

interface TrialGroupTableProps {
  heatmapType: "difference" | "union";
}

const TrialGroupTable = ({ heatmapType }: TrialGroupTableProps) => {
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );
  const currentSelectedGroup2 = useCustomStore(
    (state) => state.currentSelectedGroup2
  );
  const setCurrnetSelectedGroup = useCustomStore(
    (state) => state.setCurrentSelectedGroup
  );
  const setCurrnetSelectedGroup2 = useCustomStore(
    (state) => state.setCurrentSelectedGroup2
  );
  const { hyperparams } = useConstDataStore();
  const groups = useCustomStore((state) => state.groups);

  const data = useMemo(() => {
    const emptyData = Array.from(
      { length: 8 - groups.groups.length },
      (_, i) => {
        return {
          id: `empty-${i}`,
          name: "",
          size: -1,
          mean: -1,
          acc: -1,
        };
      }
    );

    return groups.groups
      .map((group) => {
        const groupData = groups.groups.map((g) => {
          if (group.id === g.id) {
            return {
              id: g.id.toString(),
              difference: 0,
            };
          }
          const differences = hyperparams.map((param) => {
            const group1 = group.getHyperparam(param.name);
            const group2 = g.getHyperparam(param.name);
            return {
              param: param.name,
              ...performStatisticalTest(group1, group2, param.type, param),
            };
          });

          const diffCount =
            heatmapType === "difference"
              ? differences.filter(
                  (d) => d.interpretationLevel > 1 && d.pValue < 0.05
                ).length
              : new Set([...group.getUnion(), ...g.getUnion()]).size -
                Math.max(
                  new Set([...group.getUnion()]).size,
                  new Set([...g.getUnion()]).size
                );

          return {
            id: g.id.toString(),
            difference: diffCount,
          };
        });

        return {
          id: group.id,
          name: group.name,
          size: group.trials.length,
          mean: group.getStats().avg,
          acc: new Set([...group.getUnion()]).size,
          ...Object.assign(
            {},
            ...groupData.map((d) => ({ [d.id]: d.difference }))
          ),
        };
      })
      .concat(emptyData);
  }, [groups.groups, heatmapType, hyperparams]);

  const heatmap = useMemo(() => {
    return data.map((d) =>
      groups.groups
        .map((g) => {
          return Number(d[g.id.toString()]);
        })
        .filter((v) => isNaN(v) === false)
        .flat()
    );
  }, [data, groups.groups]);

  console.log("heatmap", heatmap);

  const colorScale = d3
    .scaleSequential(
      heatmapType === "difference" ? d3.interpolateRdPu : d3.interpolateGreens
    )
    .domain([0, Math.max(...heatmap.flat())]);

  const columns = useMemo(() => {
    return [
      {
        id: "checkbox",
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
              type="radio"
              disabled={info.row.original.name === ""}
              checked={
                currentSelectedGroup &&
                info.row &&
                currentSelectedGroup.id === info.row.original.id
              }
              onChange={() => {
                setCurrnetSelectedGroup(groups.getGroup(info.row.original.id));
              }}
              style={{
                cursor: "pointer",
              }}
            />
          </div>
        ),
        meta: { align: "center" },
        enableSorting: false,
        size: 25,
      },
      {
        id: "name",
        header: "Group",
        accessorKey: "name",
        cell: (info) => {
          if (info.getValue() === "") {
            return <EmptyBox />;
          }
          return info.getValue();
        },
        meta: { align: "left" },
        type: "string",
        size: 90,
      },
      {
        id: "size",
        header: "Size",
        accessorKey: "size",
        cell: (info) => {
          if (info.getValue() === -1) {
            return <EmptyBox />;
          }
          return formatting(info.getValue(), "int");
        },
        meta: { align: "right" },
        type: "number",
        size: 55,
      },
      {
        id: "acc",
        header: "Accum",
        accessorKey: "acc",
        type: "number",

        cell: (info) => {
          const { cell } = info;
          if (cell.getValue() === -1) {
            return <EmptyBox />;
          }
          return <MetricBadge metricValue={cell.getValue()} type={"int"} />;
        },
        meta: { align: "right" },
        size: 65,
      },
      {
        id: "mean",
        header: "Mean",
        accessorKey: "mean",
        type: "number",

        cell: (info) => {
          const { cell } = info;
          if (cell.getValue() === -1) {
            return <EmptyBox />;
          }
          return <MetricBadge metricValue={cell.getValue()} type={"float"} />;
        },
        meta: { align: "right" },
        size: 65,
      },
      ...groups.groups.map((group) => {
        return {
          id: group.id.toString(),
          header: "",
          accessorKey: group.id.toString(),
          cell: (info) => {
            if (
              info.row.original.name === "" ||
              info.row.original.id === group.id
            ) {
              return <EmptyBox />;
            }

            return (
              <Tooltip
                label={
                  <Box>
                    <Text>{`${info.row.original.name} vs ${group.name}`}</Text>
                    <Text>
                      {heatmapType === "difference"
                        ? "# of statistically different parameters: "
                        : "Increase in accumulated CVRG when merged: "}{" "}
                      {info.getValue()}
                    </Text>
                  </Box>
                }
                aria-label="A tooltip"
              >
                <Box
                  width={"20px"}
                  height={"20px"}
                  display={"flex"}
                  alignItems={"center"}
                  justifyContent={"center"}
                  backgroundColor={colorScale(info.getValue()) as string}
                  borderRadius={"20px"}
                  color={getTextColor(colorScale(info.getValue()))}
                  style={{
                    cursor: "pointer",
                  }}
                  border={"1px solid #CFCFCF"}
                  className="heatmap-cell"
                  onClick={() => {
                    setCurrnetSelectedGroup(
                      groups.getGroup(info.row.original.id)
                    );
                    setCurrnetSelectedGroup2(groups.getGroup(group.id));
                  }}
                >
                  {currentSelectedGroup &&
                    info.row.original.id === currentSelectedGroup.id &&
                    currentSelectedGroup2 &&
                    group.id === currentSelectedGroup2.id && (
                      <Icon
                        as={AiFillStar}
                        color={
                          getTextColor(colorScale(info.getValue())) as string
                        }
                        width={4}
                        height={4}
                      />
                    )}
                </Box>
              </Tooltip>
            );
          },
          meta: { align: "right" },
          size: 30,
        };
      }),
      ...Array.from({ length: 8 - groups.groups.length }, (_, i) => {
        return {
          id: `empty-${i}`,
          header: "",
          accessorKey: `empty-${i}`,
          cell: () => <EmptyBox />,
          meta: { align: "right" },
          size: 30,
        };
      }),
    ];
  }, [
    groups,
    currentSelectedGroup,
    setCurrnetSelectedGroup,
    heatmapType,
    colorScale,
    currentSelectedGroup2,
    setCurrnetSelectedGroup2,
  ]);

  const table = useReactTable({
    data,
    columns,
    initialState: {
      columnPinning: {
        left: ["check"],
        right: [],
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
    enableRowSelection: true,
  });

  return (
    <Box
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        paddingTop: "20px",
      }}
    >
      <div
        className="container"
        style={{
          overflow: "auto",
          overflowX: "hidden",
          height: "99%",
          padding: "0 4px",
        }}
      >
        <table
          className="hparam-table"
          style={{
            tableLayout: "fixed",
          }}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="hparam-table-sticky-header">
                {headerGroup.headers.map((header) => {
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
                        padding: "8px 4px",
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
                            justifyContent: "center",
                            width: "100%",
                            height: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody key={"tbody"}>
            {table.getRowModel().rows.map((row) => {
              return (
                <>
                  <tr
                    key={row.id}
                    className={`hparam-table-row ${
                      currentSelectedGroup &&
                      row &&
                      currentSelectedGroup.id === row.original.id
                        ? "selected2"
                        : ""
                    } `}
                    style={{
                      padding: "0 10px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setCurrnetSelectedGroup(groups.getGroup(row.original.id));
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
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            alignItems: "center",
                            height: "30px",
                            padding: "0px 4px",
                            // borderBottom: "1px solid #e0e0e0",
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
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </Box>
  );
};

export default TrialGroupTable;

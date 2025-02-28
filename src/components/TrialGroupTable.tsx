import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMetricScale } from "../model/colorScale";
import { formatting, getTextColor } from "../model/utils";

import { useMemo } from "react";
import { useCustomStore } from "../store";
import { Box } from "@chakra-ui/react";
import { performStatisticalTest } from "../model/statistic";

import { useConstDataStore } from "./store/constDataStore";
import MetricBadge from "./MetricBadge";

const TrialGroupTable = () => {
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );
  const setCurrnetSelectedGroup = useCustomStore(
    (state) => state.setCurrentSelectedGroup
  );
  const { hyperparams } = useConstDataStore();
  const groups = useCustomStore((state) => state.groups);

  const data = useMemo(() => {
    return groups.groups.map((group) => {
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
          const pValue =
            performStatisticalTest(group1, group2, param.type, param).pValue ||
            1;
          return {
            param: param.name,
            pValue,
          };
        });

        const diffCount = differences.filter((d) => d.pValue < 0.05).length;
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
        ...Object.assign(
          {},
          ...groupData.map((d) => ({ [d.id]: d.difference }))
        ),
      };
    });
  }, [groups.groups, hyperparams]);

  const { colorScale, metricScale } = useMetricScale();

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
              type="checkbox"
              checked={currentSelectedGroup.id === info.row.original.id}
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
        cell: (info) => info.getValue(),
        meta: { align: "left" },
        type: "string",
        size: 90,
      },
      {
        id: "size",
        header: "Size",
        accessorKey: "size",
        cell: (info) => formatting(info.getValue(), "int"),
        meta: { align: "right" },
        type: "number",
        size: 50,
      },
      {
        id: "mean",
        header: "Mean",
        accessorKey: "mean",
        type: "number",

        cell: (info) => {
          const { cell } = info;
          return (
            <MetricBadge metricValue={cell.getValue()} type={"float"} />
            // <Box
            //   background={colorScale(metricScale(cell.getValue()))}
            //   color={getTextColor(colorScale(metricScale(cell.getValue())))}
            //   width={"100%"}
            //   pr={1}
            // >
            //   {formatting(info.getValue(), "float")}
            // </Box>
          );
        },
        meta: { align: "right" },
        size: 60,
      },
      ...groups.groups.map((group) => {
        return {
          id: group.id.toString(),
          header: "",
          accessorKey: group.id.toString(),
          cell: (info) => {
            return (
              <Box
                width={"100%"}
                pr={1}
                display={"flex"}
                justifyContent={"center"}
              >
                {formatting(info.getValue(), "int")}
              </Box>
            );
          },
          meta: { align: "right" },
          size: 45,
        };
      }),
    ];
  }, [groups, setCurrnetSelectedGroup, colorScale, metricScale]);

  console.log("columns", columns);

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
        // width: "230px",
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        // paddingTop: "30px",
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
                      currentSelectedGroup.id === row.original.id
                        ? "selected"
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

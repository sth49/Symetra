import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { FaSort, FaSortUp, FaSortDown, FaPlus, FaMinus } from "react-icons/fa";
import { useCustomStore } from "../store";
import { Box, Icon, IconButton } from "@chakra-ui/react";
import { formatting } from "../model/utils";
import BidirectionalChart from "./BidirectionalChart";
interface CodeFileExtendedProps {
  item;
  showNum;
}

const CodeFileExtended = ({ item, showNum }: CodeFileExtendedProps) => {
  const currSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  const currSelectedGroup2 = useCustomStore(
    (state) => state.currentSelectedGroup2
  );
  const selectedBranchId = useCustomStore((state) => state.selectedBranchId);
  const setSelectBranchId = useCustomStore(
    (state) => state.setSelectedBranchId
  );

  const data = useMemo(() => {
    const groupByLine = {};
    item.forEach((child) => {
      if (!groupByLine[child.line]) {
        groupByLine[child.line] = {
          line: child.line,
          ids: [child.id],
          group1: child.group1,
          group2: child.group2,
        };
      }
      // Add this line to the lines array if it's not already there
      else if (!groupByLine[child.line].ids.includes(child.id)) {
        groupByLine[child.line].ids.push(child.id);
        groupByLine[child.line].group1 += child.group1;
        groupByLine[child.line].group2 += child.group2;
      }
    });
    return Object.values(groupByLine)
      .map((group: any) => ({
        ...group,
        group1: group.group1 / group.ids.length,
        group2: group.group2 / group.ids.length,
        diff: Math.abs(
          group.group1 / group.ids.length - group.group2 / group.ids.length
        ),
      }))
      .sort((a, b) => b.diff - a.diff)
      .slice(0, showNum);
  }, [item, showNum]);

  console.log("data", data);
  const columns2 = useMemo(() => {
    return [
      {
        id: "line",
        header: "Line",
        accessorKey: "line",
        cell: (info) => info.getValue(),
        meta: {
          align: "center",
        },
        enableSorting: true,
        size: 40,
      },
      // {
      //   id: "ids",
      //   header: "Branch ID",
      //   accessorKey: "ids",
      //   cell: (info) => info.getValue(),
      //   meta: {
      //     align: "center",
      //   },
      //   enableSorting: true,
      //   size: 60,
      // },

      {
        id: "group1",
        header: currSelectedGroup?.name,
        accessorKey: "group1",
        cell: (info) => formatting(info.getValue(), "float") + "%",
        meta: {
          align: "center",
        },
        enableSorting: true,
        size: 60,
      },
      {
        id: "diff",
        header: "Difference",
        accessorKey: "diff",
        cell: (info) => {
          return (
            <Box width="100%">
              <BidirectionalChart
                leftValue={info.row.original.group1}
                rightValue={info.row.original.group2}
                height={20}
              />
            </Box>
          );
        },
        meta: {
          align: "center",
        },
        enableSorting: true,
      },

      {
        id: "group2",
        header: currSelectedGroup2?.name,
        accessorKey: "group2",
        cell: (info) => formatting(info.getValue(), "float") + "%",
        meta: {
          align: "center",
        },
        enableSorting: true,
        size: 60,
      },
    ];
  }, [currSelectedGroup, currSelectedGroup2]);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "diff",
      desc: true,
    },
  ]);

  const table2 = useReactTable({
    data: data,
    columns: columns2,
    state: {
      sorting,
    },
    defaultColumn: {
      minSize: 10,
      maxSize: 80,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
    enableRowSelection: true,
  });

  return (
    <div
      className="container"
      style={{
        height: "99%",
        // padding: "0 4px",
        display: "flex",
      }}
    >
      <table
        className="hparam-table"
        style={{
          tableLayout: "fixed",
          width: "100%",
        }}
      >
        <thead>
          {table2.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="hparam-table-sticky-header"
              style={{
                zIndex: 1,
                backgroundColor: "#f9f9f9",
              }}
            >
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
                      //   padding: "10px 0px",
                      height: "35px",
                      fontSize: "12px",
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
                          justifyContent: "center",
                        }}
                      >
                        {header.column.getCanSort() &&
                          header.column.getIsSorted() !== false && (
                            <Icon
                              color="gray.600"
                              onClick={header.column.getToggleSortingHandler()}
                              as={
                                (header.column.getIsSorted() as string) ===
                                "asc"
                                  ? FaSortUp
                                  : (header.column.getIsSorted() as string) ===
                                    "desc"
                                  ? FaSortDown
                                  : FaSort
                              }
                            />
                          )}
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
          {table2.getRowModel().rows.map((row) => {
            return (
              <tr
                key={row.id}
                className={`hparam-table-row`}
                style={{
                  padding: "0 10px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setSelectBranchId(row.original.ids[0] as string);
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
                        fontWeight: row.original.ids.includes(selectedBranchId)
                          ? "bold"
                          : "normal",
                        fontSize: "12px",
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

export default CodeFileExtended;

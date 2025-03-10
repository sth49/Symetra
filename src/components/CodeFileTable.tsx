import {
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { FaSort, FaSortUp, FaSortDown, FaPlus, FaMinus } from "react-icons/fa";
import { useConstDataStore } from "./store/constDataStore";
import { useCustomStore } from "../store";
import { Box, Button, Icon, IconButton } from "@chakra-ui/react";
import { formatting } from "../model/utils";
import CodeFileExtended from "./CodeFileExtended";
import { FaAngleUp, FaAngleDown } from "react-icons/fa";
const CodeFileTable = () => {
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  const currentSelectedGroup2 = useCustomStore(
    (state) => state.currentSelectedGroup2
  );

  const experiment = useConstDataStore((state) => state.exp);
  const [showNum, setShowNum] = useState(5);

  const data = useMemo(() => {
    if (!currentSelectedGroup || !currentSelectedGroup2) {
      return [];
    }
    const branchCount = {};
    experiment.branchInfo.forEach((branch) => {
      if (branchCount[branch.filePath]) {
        branchCount[branch.filePath]++;
      } else {
        branchCount[branch.filePath] = 1;
      }
    });

    const group1 = currentSelectedGroup?.getOrignalBranches(
      experiment.branchInfo
    );
    const length1 = currentSelectedGroup.getLength();

    const group2 = currentSelectedGroup2?.getOrignalBranches(
      experiment.branchInfo
    );

    const length2 = currentSelectedGroup2.getLength();
    return Object.keys(branchCount).map((filePath, i) => {
      const children = experiment.branchInfo
        .filter((b) => b.filePath === filePath)
        .map((b) => {
          const g1 = group1[b.branch] ? group1[b.branch] : 0;
          const g2 = group2[b.branch] ? group2[b.branch] : 0;
          const diff = Math.abs(g1 - g2);

          return {
            id: b.branch,
            line: b.line,
            group1: (g1 / length1) * 100,
            diff:
              formatting(g1 / diff, "float").toString() +
              " || " +
              formatting(g2 / diff, "float").toString(),
            group2: (g2 / length2) * 100,
          };
        });

      return {
        id: i,
        count: branchCount[filePath],
        filePath:
          filePath.split("/").slice(-2)[0] +
          "/" +
          filePath.split("/").slice(-1)[0],
        group1Count: children.reduce(
          (acc, child) => (child.group1 !== 0 ? acc + 1 : acc),
          0
        ),
        group2Count: children.reduce(
          (acc, child) => (child.group2 !== 0 ? acc + 1 : acc),
          0
        ),
        children: children,
      };
    });
  }, [currentSelectedGroup, currentSelectedGroup2, experiment.branchInfo]);

  const columns = useMemo(() => {
    return [
      {
        id: "filePath",
        header: "File Path",
        accessorKey: "filePath",
        cell: (info) => info.getValue(),
        meta: {
          align: "left",
        },
        enableSorting: true,
      },
      {
        id: "count",
        header: "Count",
        accessorKey: "count",
        cell: (info) => info.getValue(),
        meta: {
          align: "right",
        },
        enableSorting: true,
        size: 40,
      },
      {
        id: "group1Count",
        header: currentSelectedGroup?.name,
        accessorKey: "group1Count",
        cell: (info) => formatting(info.getValue(), "int"),
        meta: {
          align: "right",
        },
        enableSorting: true,
        size: 60,
      },
      {
        id: "group2Count",
        header: currentSelectedGroup2?.name,
        accessorKey: "group2Count",
        cell: (info) => formatting(info.getValue(), "int"),
        meta: {
          align: "right",
        },
        enableSorting: true,
        size: 60,
      },
      {
        id: "expander",
        header: "",
        accessorKey: "expander",
        cell: (info) => {
          const { row } = info;
          return (
            <IconButton
              size={"xs"}
              icon={
                row.getIsExpanded() ? (
                  <Icon as={FaAngleUp} color={"gray.500"} />
                ) : (
                  <Icon as={FaAngleDown} color={"gray.500"} />
                )
              }
              onClick={() => {
                row.toggleExpanded();
                setShowNum(5);
              }}
              aria-label={""}
            />
          );
        },
        meta: {
          align: "right",
        },
        enableSorting: false,
        size: 30,
      },
    ];
  }, [currentSelectedGroup, currentSelectedGroup2]);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "group1Count",
      desc: true,
    },
  ]);

  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      expanded,
    },
    defaultColumn: {
      minSize: 10,

      maxSize: 80,
    },

    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
    enableRowSelection: true,
  });

  return (
    <div style={{ width: "100%", height: "25%" }}>
      <div
        style={{
          height: "100%",
          width: "100%",
          position: "relative",
          overflow: "hidden",
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
              width: "100%",
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
                              width: "100%",
                              height: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
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
              {table.getRowModel().rows.map((row) => {
                return (
                  <>
                    <tr
                      key={row.id}
                      className={`hparam-table-row`}
                      style={{
                        padding: "0 10px",
                        cursor: "pointer",
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
                              padding: "0 8px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              alignItems: "center",
                              height: "35px",
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
                    {row.getIsExpanded() && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            backgroundColor: "#f9f9f9",
                          }}
                        >
                          <CodeFileExtended
                            item={row.original.children
                              .sort((a, b) => b.priority - a.priority)
                              .slice(0, showNum)}
                          />

                          <Button
                            size={"xs"}
                            m={1}
                            width={"100%"}
                            onClick={() => {
                              setShowNum(showNum + 5);
                            }}
                          >
                            <Icon as={FaAngleDown} mr={2} />
                            {"Show More"}
                          </Button>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CodeFileTable;

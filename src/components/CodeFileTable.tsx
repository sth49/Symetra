import {
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { FaSort, FaSortUp, FaSortDown, FaEye } from "react-icons/fa";
import { useConstDataStore } from "./store/constDataStore";
import { useCustomStore } from "../store";
import {
  Box,
  Button,
  Icon,
  IconButton,
  Select,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { formatting } from "../model/utils";
import CodeFileExtended from "./CodeFileExtended";
import { FaAngleUp, FaAngleDown } from "react-icons/fa";
import BidirectionalChart from "./BidirectionalChart";
import CodeView from "./CodeView";
import { FaAnglesUp } from "react-icons/fa6";
const CodeFileTable = () => {
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  const selectedBranchId = useCustomStore((state) => state.selectedBranchId);
  const setSelectedBranchId = useCustomStore(
    (state) => state.setSelectedBranchId
  );

  const currentSelectedGroup2 = useCustomStore(
    (state) => state.currentSelectedGroup2
  );

  const setCurrentSelectedGroup2 = useCustomStore(
    (state) => state.setCurrentSelectedGroup2
  );

  const setViewType = useCustomStore((state) => state.setViewType);

  const groups = useCustomStore((state) => state.groups);

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

          return {
            id: b.branch,
            line: b.line,
            group1: (g1 / length1) * 100,
            group2: (g2 / length2) * 100,
          };
        });
      const g1Count =
          (children.reduce(
            (acc, child) => (child.group1 !== 0 ? acc + 1 : acc),
            0
          ) /
            branchCount[filePath]) *
          100,
        g2Count =
          (children.reduce(
            (acc, child) => (child.group2 !== 0 ? acc + 1 : acc),
            0
          ) /
            branchCount[filePath]) *
          100;

      const groupByLine = {};
      children.forEach((child) => {
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

      return {
        id: i,
        count: branchCount[filePath],
        filePath:
          filePath.split("/").slice(-2)[0] +
          "/" +
          filePath.split("/").slice(-1)[0],
        group1Count: g1Count,
        diff: Math.abs(g1Count - g2Count),
        group2Count: g2Count,
        children: Object.values(groupByLine)
          .map((group: any) => ({
            ...group,
            group1: group.group1 / group.ids.length,
            group2: group.group2 / group.ids.length,
            diff: Math.abs(
              group.group1 / group.ids.length - group.group2 / group.ids.length
            ),
          }))
          .sort((a, b) => b.diff - a.diff),
      };
    });
  }, [currentSelectedGroup, currentSelectedGroup2, experiment.branchInfo]);

  const columns = useMemo(() => {
    return [
      {
        id: "fc",
        header: () => null,
        accessorKey: "line",
        cell: (info) => {
          if (
            info.row.original.children.find((d) =>
              d.ids.includes(selectedBranchId)
            ) !== undefined
          ) {
            return <Icon as={FaEye} />;
          }
        },
        meta: {
          align: "center",
        },
        enableSorting: true,
        size: 20,
      },
      {
        id: "filePath",
        header: () => "File Path",
        accessorKey: "filePath",
        // cell: (info) => info.getValue(),
        cell: (info) => {
          const value = info.getValue();
          const text = String(value);

          const frontChars = 4;
          const backChars = 3;

          // 긴 텍스트를 처리하는 함수
          if (text.length <= frontChars + backChars + 3) {
            return text;
          }

          const front = text.substring(0, frontChars);
          const back = text.substring(text.length - backChars);
          return <Tooltip label={text}>{front + "..." + back}</Tooltip>;
        },

        meta: {
          align: "left",
        },
        enableSorting: true,
        size: 40,
      },
      {
        id: "count",
        header: () => (
          <div style={{ lineHeight: "1.2" }}>
            <Text fontSize="xs" wordBreak="break-all">
              # of
            </Text>
            <Text fontSize="xs" wordBreak="break-all">
              Branches
            </Text>
          </div>
        ),
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
        header: () => currentSelectedGroup?.name,
        accessorKey: "group1Count",
        cell: (info) => formatting(info.getValue(), "int") + " %",
        meta: {
          align: "right",
        },
        enableSorting: false,
        size: 40,
      },
      {
        id: "diff",
        header: () => "Difference",
        accessorKey: "diff",
        cell: (info) => (
          <Box>
            <BidirectionalChart
              leftValue={info.row.original.group1Count}
              rightValue={info.row.original.group2Count}
              height={20}
            />
          </Box>
        ),
        meta: {
          align: "center",
        },
        enableSorting: true,
      },
      {
        id: "group2Count",
        header: () => (
          <Select
            cursor={"pointer"}
            w={"100%"}
            value={
              currentSelectedGroup2 ? currentSelectedGroup2.id.toString() : ""
            }
            size={"xs"}
            onChange={(e) => {
              const newGroup = groups.getGroup(parseInt(e.target.value));
              setCurrentSelectedGroup2(newGroup);
              // setGroup2(newGroup);
            }}
          >
            {groups.groups
              .filter((g) => g.id !== currentSelectedGroup.id)
              .map((group) => (
                <option key={group.id} value={group.id.toString()}>
                  {group.name} ({formatting(group.getLength(), "int")})
                </option>
              ))}
          </Select>
        ),
        accessorKey: "group2Count",
        cell: (info) => formatting(info.getValue(), "int") + " %",
        meta: {
          align: "right",
        },
        enableSorting: false,
        size: 50,
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
              onClick={(e) => {
                e.stopPropagation();
                row.toggleExpanded();
                setShowNum(5);
              }}
              aria-label={""}
            />
          );
        },
        meta: {
          align: "left",
        },
        enableSorting: false,
        size: 20,
      },
    ];
  }, [
    currentSelectedGroup?.id,
    currentSelectedGroup?.name,
    currentSelectedGroup2,
    groups,
    selectedBranchId,
    setCurrentSelectedGroup2,
  ]);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "diff",
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
    <Box w={"100%"} p={1} height={`calc(100% - 35px)`}>
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
                  <tr
                    key={headerGroup.id}
                    className="hparam-table-sticky-header"
                  >
                    {headerGroup.headers.map((header) => {
                      return (
                        <th
                          key={header.id}
                          style={{
                            width: `${header.getSize()}px`,
                            position: "sticky",
                            top: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            padding: "8px 0",
                          }}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              {...{
                                className: header.column.getCanSort()
                                  ? "cursor-pointer select-none"
                                  : "",
                                onClick:
                                  header.column.getToggleSortingHandler(),
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
                        onClick={() => {
                          const branchId = row.original.children[0].ids[0];
                          setSelectedBranchId(branchId);
                          setViewType("file");
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
                            colSpan={7}
                            style={{
                              backgroundColor: "#f9f9f9",
                            }}
                          >
                            <CodeFileExtended
                              item={row.original.children}
                              showNum={showNum}
                            />

                            <Box display={"flex"} justifyContent={"center"}>
                              <Button
                                size={"xs"}
                                m={1}
                                width={"50%"}
                                disabled={
                                  showNum >= row.original.children.length
                                }
                                onClick={() => {
                                  setShowNum(
                                    showNum + 5 > row.original.children.length
                                      ? row.original.children.length
                                      : showNum + 5
                                  );
                                }}
                              >
                                <Icon as={FaAngleDown} mr={2} />
                                {"Show More"}
                              </Button>
                              <Button
                                size={"xs"}
                                m={1}
                                width={"50%"}
                                disabled={showNum <= 5}
                                onClick={() => {
                                  setShowNum(showNum - 5 < 5 ? 5 : showNum - 5);
                                }}
                              >
                                <Icon as={FaAngleUp} mr={2} />
                                {"Show Less"}
                              </Button>
                            </Box>
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
      <CodeView
        item={data.find((d) =>
          d.children.find((c) => c.ids.includes(selectedBranchId))
        )}
      />
    </Box>
  );
};

export default CodeFileTable;

import {
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";

import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { useConstDataStore } from "./store/constDataStore";
import { useCustomStore } from "../store";
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Icon,
  Text,
} from "@chakra-ui/react";

import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { formatting } from "../model/utils";
import CodeFileExtended from "./CodeFileExtended";
import { FaAngleUp, FaAngleDown } from "react-icons/fa";
import BidirectionalChart from "./BidirectionalChart";
import CodeView from "./CodeView";
import { LiaAngleRightSolid, LiaAngleDownSolid } from "react-icons/lia";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { BranchInfo } from "../model/experiment";

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

  const viewType = useCustomStore((state) => state.viewType);
  const setViewType = useCustomStore((state) => state.setViewType);

  const experiment = useConstDataStore((state) => state.exp);
  const [showNum, setShowNum] = useState([]);

  const [branchInfo, setBranchInfo] = useState<BranchInfo | undefined>(
    undefined
  );
  const totalLines = useCustomStore((state) => state.totalLines);

  const filePath = useMemo(() => {
    if (!experiment?.branchInfo || experiment.branchInfo.length === 0) {
      return {};
    }
    const path = {};
    experiment.branchInfo.forEach((b) => {
      const folder = b.filePath.split("/").slice(-2)[0];
      const file = b.fileName;

      if (!path[folder] && folder !== "program") {
        path[folder] = [
          {
            file: file,
            line: [b.line],
          },
        ];
      } else if (path[folder] && !path[folder].find((f) => f.file === file)) {
        path[folder].push({
          file: file,
          line: [b.line],
        });
      } else if (
        path[folder] &&
        path[folder].find((f) => f.file === file) &&
        !path[folder].find((f) => f.file === file).line.includes(b.line)
      ) {
        path[folder].find((f) => f.file === file).line.push(b.line);
      }
    });
    return path;
  }, [experiment?.branchInfo]);

  useEffect(() => {
    if (selectedBranchId) {
      const branch = experiment.branchInfo.find(
        (b) => b.branch === selectedBranchId
      );
      console.log("Setting branch info:", branch);
      setBranchInfo(branch);
    }
  }, [selectedBranchId, experiment.branchInfo]);

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
        id: "expander",
        header: "",
        accessorKey: "expander",
        cell: (info) => {
          const { row } = info;
          return (
            <Box>
              {row.getIsExpanded() ? (
                <Icon as={LiaAngleDownSolid} size={"xs"} />
              ) : (
                <Icon as={LiaAngleRightSolid} size={"xs"} />
              )}
            </Box>
          );
        },
        meta: {
          align: "left",
        },
        enableSorting: false,
        size: 15,
      },
      {
        id: "filePath",
        header: () => "File Path",
        accessorKey: "filePath",
        cell: (info) => {
          const value = info.getValue();
          const text = String(value);
          return text.split("/")[1];
        },

        meta: {
          align: "left",
        },
        enableSorting: true,
        size: 60,
      },
      {
        id: "count",
        header: "Branch #",
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
        header: () => currentSelectedGroup2?.name,
        accessorKey: "group2Count",
        cell: (info) => formatting(info.getValue(), "int") + " %",
        meta: {
          align: "right",
        },
        enableSorting: false,
        size: 50,
      },
    ];
  }, [currentSelectedGroup?.name, currentSelectedGroup2]);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "diff",
      desc: true,
    },
  ]);

  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [open, setOpen] = useState([]);

  useEffect(() => {
    setExpanded({});
    setOpen([]);
    setSorting([
      {
        id: "diff",
        desc: true,
      },
    ]);
  }, [currentSelectedGroup, currentSelectedGroup2]);

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
                          backgroundColor:
                            viewType === "file" &&
                            row.original.children.find((c) =>
                              c.ids.includes(selectedBranchId)
                            ) !== undefined
                              ? "#d0e0fc"
                              : "white",
                          // border:
                          //   row.id === selectedRow
                          //     ? "1px solid blue"
                          //     : "1px solid transparent",
                        }}
                        onClick={() => {
                          if (!row.getIsExpanded()) {
                            showNum[`${row.original.filePath}`] = 10;
                            setShowNum({ ...showNum });
                          }

                          row.toggleExpanded();
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
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                textAlign: cell.column.columnDef.meta.align,
                                padding: "0 4px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                alignItems: "center",
                                // height: "35px",
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
                            colSpan={columns.length}
                            style={{
                              backgroundColor: "#f9f9f9",
                            }}
                          >
                            <CodeFileExtended
                              item={row.original.children}
                              showNum={showNum[`${row.original.filePath}`]}
                              sortBy={sorting}
                            />

                            {row.original.children.length >
                              showNum[`${row.original.filePath}`] && (
                              <Button
                                size={"xs"}
                                m={1}
                                width={"100%"}
                                onClick={() => {
                                  if (
                                    showNum[`${row.original.filePath}`] ===
                                      undefined ||
                                    showNum[`${row.original.filePath}`] ===
                                      row.original.children.length
                                  ) {
                                    setShowNum({
                                      ...showNum,
                                      [`${row.original.filePath}`]: 10,
                                    });
                                  } else {
                                    setShowNum({
                                      ...showNum,
                                      [`${row.original.filePath}`]:
                                        row.original.children.length,
                                    });
                                  }
                                }}
                              >
                                {showNum[`${row.original.filePath}`] ==
                                row.original.children.length ? (
                                  <Icon as={FaAngleUp} mr={2} />
                                ) : (
                                  <Icon as={FaAngleDown} mr={2} />
                                )}
                                {showNum[`${row.original.filePath}`] >=
                                row.original.children.length
                                  ? "Hide"
                                  : "Show All"}
                              </Button>
                            )}
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
      <Box w={"100%"} h={"calc(78% - 30px)"}>
        {data && data.length > 0 && branchInfo && experiment && (
          <Box
            w={"100%"}
            height={"40px"}
            borderTop={"1px solid #ddd"}
            borderBottom={"1px solid #ddd"}
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
          >
            <Breadcrumb
              spacing="8px"
              separator={<ChevronRightIcon color="gray.500" />}
            >
              <BreadcrumbItem>
                <BreadcrumbLink>
                  <Popover>
                    <PopoverTrigger asChild>
                      {branchInfo?.filePath.split("/").slice(-2)[0]}
                    </PopoverTrigger>
                    <PopoverContent>
                      <Box>
                        {Object.keys(filePath).map((key) => {
                          return (
                            <Box
                              w={"100%"}
                              display={"flex"}
                              flexDirection={"column"}
                            >
                              <Box
                                className="file-path"
                                w={"100%"}
                                onClick={() => {
                                  setOpen(
                                    open.includes(key)
                                      ? open.filter((o) => o !== key)
                                      : [...open, key]
                                  );
                                }}
                                display={"flex"}
                                alignItems={"center"}
                              >
                                {open.includes(key) ? (
                                  <Icon as={LiaAngleDownSolid} size={"xs"} />
                                ) : (
                                  <Icon as={LiaAngleRightSolid} size={"xs"} />
                                )}
                                <Text ml={2} fontSize={"sm"}>
                                  {key}
                                </Text>
                              </Box>
                              {open.includes(key) &&
                                filePath[key].map((f) => (
                                  <Box
                                    display={"flex"}
                                    height={"16px"}
                                    className="file-path"
                                    backgroundColor={
                                      f.file === branchInfo?.fileName
                                        ? "#d0e0fc"
                                        : "white"
                                    }
                                    onClick={() => {
                                      const branchId =
                                        experiment.branchInfo.find((b) =>
                                          b.filePath.split("/").slice(-1)[0] ===
                                          f.file
                                            ? b.branch
                                            : null
                                        ).branch;
                                      setSelectedBranchId(branchId);
                                      setViewType("file");
                                    }}
                                  >
                                    <svg width={"16px"} height={"16px"}>
                                      <line
                                        x1="50%"
                                        y1="0%"
                                        x2="50%"
                                        y2="100%"
                                        stroke="black"
                                        strokeWidth="1"
                                      />
                                    </svg>
                                    <Text fontSize={"xs"}>{f.file}</Text>
                                  </Box>
                                ))}
                            </Box>
                          );
                        })}
                      </Box>
                    </PopoverContent>
                  </Popover>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbItem>
                <Popover>
                  <PopoverTrigger asChild>
                    {branchInfo?.filePath.split("/").slice(-1)[0]}
                  </PopoverTrigger>
                  <PopoverContent>
                    {filePath[branchInfo?.filePath.split("/").slice(-2)[0]].map(
                      (f) => {
                        return (
                          <Box
                            className="file-path"
                            display={"flex"}
                            alignItems={"center"}
                            backgroundColor={
                              f.file === branchInfo?.fileName
                                ? "#d0e0fc"
                                : "white"
                            }
                            onClick={() => {
                              const branchId = experiment.branchInfo.find((b) =>
                                b.filePath.split("/").slice(-1)[0] === f.file
                                  ? b.branch
                                  : null
                              ).branch;
                              setSelectedBranchId(branchId);
                              setViewType("file");
                            }}
                          >
                            <Text ml={2} fontSize={"sm"}>
                              {f.file}
                            </Text>
                          </Box>
                        );
                      }
                    )}
                  </PopoverContent>
                </Popover>
                <Text ml={1} fontSize={"xs"}>
                  ({formatting(totalLines, "int")} lines)
                </Text>
              </BreadcrumbItem>

              {viewType === "line" && (
                <BreadcrumbItem>
                  <Popover>
                    <PopoverTrigger asChild>
                      {/* {branchInfo?.filePath.split("/").slice(-1)[0]} */}
                      {"Line: " + branchInfo?.line}
                    </PopoverTrigger>
                    <PopoverContent>
                      {filePath[branchInfo?.filePath.split("/").slice(-2)[0]]
                        .find((f) => f.file === branchInfo?.fileName)
                        ?.line.map((l) => {
                          return (
                            <Box
                              className="file-path"
                              display={"flex"}
                              alignItems={"center"}
                              backgroundColor={
                                l === branchInfo?.line ? "#d0e0fc" : "white"
                              }
                              onClick={() => {
                                const branchId = experiment.branchInfo.find(
                                  (b) =>
                                    b.filePath.split("/").slice(-1)[0] ===
                                      branchInfo?.fileName && b.line === l
                                      ? b.branch
                                      : null
                                ).branch;
                                setSelectedBranchId(branchId);
                                setViewType("line");
                              }}
                            >
                              <Text ml={2} fontSize={"sm"}>
                                {/* {l} */}
                                {"Line: " + l}
                              </Text>
                            </Box>
                          );
                        })}
                    </PopoverContent>
                  </Popover>
                </BreadcrumbItem>
              )}
            </Breadcrumb>
          </Box>
        )}
        <CodeView
          item={data.find((d) =>
            d.children.find((c) => c.ids.includes(selectedBranchId))
          )}
        />
      </Box>
    </Box>
  );
};

export default CodeFileTable;

import { Box, Heading, Icon, Text } from "@chakra-ui/react";
import { FaSort, FaSortUp, FaSortDown, FaAsterisk } from "react-icons/fa";
import { useCustomStore } from "../store";
import { memo, useEffect, useMemo, useState } from "react";
import { formatting } from "../model/utils";
import { performStatisticalTest } from "../model/statistic";
import { useConstDataStore } from "./store/constDataStore";
import { Select } from "@chakra-ui/react";
import BarChart from "./BarChart";
import { Tooltip } from "@chakra-ui/react";

import AreaChart from "./AreaChart";
import MetricBadge from "./MetricBadge";
import SelectIcon from "./SelectIcon";
import OverlappedCharts from "./OverlappedCharts";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

const starRender = (value) => {
  if (value === 0) {
    return <Icon as={FaAsterisk} color={"blue.600"} width={"8px"} />;
  } else if (value === 1) {
    return (
      <Box display={"flex"} alignItems={"center"} justifyContent={"center"}>
        <Icon as={FaAsterisk} color={"blue.600"} width={"8px"} />
        <Icon as={FaAsterisk} color={"blue.600"} width={"8px"} />
      </Box>
    );
  } else if (value === 2) {
    return (
      <Box
        display={"flex"}
        alignItems={"center"}
        flexDir={"column"}
        justifyContent={"center"}
      >
        <Icon as={FaAsterisk} color={"blue.600"} width={"8px"} height={"8px"} />
        <Box display={"flex"} alignItems={"center"}>
          <Icon
            as={FaAsterisk}
            color={"blue.600"}
            width={"8px"}
            height={"8px"}
          />
          <Icon
            as={FaAsterisk}
            color={"blue.600"}
            width={"8px"}
            height={"8px"}
          />
        </Box>
      </Box>
    );
  } else if (value === 3) {
    return (
      <Box
        display={"flex"}
        alignItems={"center"}
        flexDir={"column"}
        justifyContent={"center"}
      >
        <Box display={"flex"} alignItems={"center"}>
          <Icon
            as={FaAsterisk}
            color={"blue.600"}
            width={"8px"}
            height={"8px"}
          />
          <Icon
            as={FaAsterisk}
            color={"blue.600"}
            width={"8px"}
            height={"8px"}
          />
        </Box>
        <Box display={"flex"} alignItems={"center"}>
          <Icon
            as={FaAsterisk}
            color={"blue.600"}
            width={"8px"}
            height={"8px"}
          />
          <Icon
            as={FaAsterisk}
            color={"blue.600"}
            width={"8px"}
            height={"8px"}
          />
        </Box>
      </Box>
    );
  }
  return null;
};

const InterGroupView = () => {
  const { exp } = useConstDataStore();
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  const currentSelectedGroup2 = useCustomStore(
    (state) => state.currentSelectedGroup2
  );

  const setCurrentSelectedGroup2 = useCustomStore(
    (state) => state.setCurrentSelectedGroup2
  );

  const groups = useCustomStore((state) => state.groups);
  // const [group2, setGroup2] = useState(
  //   currentSelectedGroup !== currentSelectedGroup2
  //     ? currentSelectedGroup2
  //     : groups.groups.filter((group) => group.id !== currentSelectedGroup.id)[0]
  // );

  // useEffect(() => {
  //   setCurrentSelectedGroup2(group2);
  // }, [group2, setCurrentSelectedGroup2]);

  const stats = useMemo(() => {
    if (!currentSelectedGroup || !currentSelectedGroup2) {
      return null;
    }
    const group1Stats = currentSelectedGroup.getStats();
    const group2Stats = currentSelectedGroup2.getStats();

    return {
      Maximum: {
        group1: group1Stats.max,
        group2: group2Stats.max,
        type: "int",
      },
      Mean: {
        group1: group1Stats.avg,
        group2: group2Stats.avg,
        type: "float",
      },
      Minimum: {
        group1: group1Stats.min,
        group2: group2Stats.min,
        type: "int",
      },
      Accumulated: {
        group1: group1Stats.acc,
        group2: group2Stats.acc,
        type: "int",
      },
    };
  }, [currentSelectedGroup, currentSelectedGroup2]);

  const data = useMemo(() => {
    if (!currentSelectedGroup || !currentSelectedGroup2) {
      return [];
    }
    const trialIds1 =
      (currentSelectedGroup &&
        currentSelectedGroup.trials.map((trial) => trial.id)) ||
      [];
    const trialIds2 =
      (currentSelectedGroup2 &&
        currentSelectedGroup2.trials.map((trial) => trial.id)) ||
      [];

    return exp?.hyperparams.map((hp, index) => {
      return {
        id: index,
        name: hp.displayName,
        fullName: hp.name,
        desc: hp.description,
        default: hp.defaultString,
        displayName: hp.displayName,
        group1: hp.getEffect(trialIds1),
        trialIds1: trialIds1,
        group2: hp.getEffect(trialIds2),
        trialIds2: trialIds2,
        dist: hp.name,
        type: hp.type,
        icon: hp.icon,
        ...performStatisticalTest(
          currentSelectedGroup.getHyperparam(hp.name),
          currentSelectedGroup2.getHyperparam(hp.name),
          hp.type,
          hp
        ),
      };
    });
  }, [currentSelectedGroup, exp?.hyperparams, currentSelectedGroup2]);

  useEffect(() => {
    if (
      currentSelectedGroup &&
      (currentSelectedGroup2 === currentSelectedGroup || !currentSelectedGroup2)
    ) {
      setCurrentSelectedGroup2(
        groups.groups.filter((group) => group.id !== currentSelectedGroup.id)[0]
      );
    }
  }, [
    currentSelectedGroup,
    currentSelectedGroup2,
    groups,
    setCurrentSelectedGroup2,
  ]);

  const columns = useMemo(() => {
    return [
      {
        id: "name",
        header: () => "Name",
        accessorKey: "name",
        cell: (info) => {
          const hparamIcon = info.row.original.icon;
          const { row } = info;
          return (
            <Box display={"flex"} alignItems={"center"}>
              <Tooltip
                label={
                  <div>
                    <Text fontSize="xs" borderBottom={"1px solid white"}>
                      {row.original.fullName} (default: {row.original.default})
                    </Text>
                    <Text fontSize="xs">{row.original.desc}</Text>
                  </div>
                }
              >
                <Text
                  userSelect={"none"}
                  display={"flex"}
                  alignItems={"center"}
                >
                  <Icon as={hparamIcon} mr={1} color={"gray.600"} />
                  {info.getValue()}
                </Text>
              </Tooltip>
            </Box>
          );
        },
        meta: {
          align: "center",
        },
        enableSorting: true,
        size: 35,
      },
      {
        id: "effect",
        header: () => (
          <div style={{ lineHeight: "1.2" }}>
            <Text fontSize="xs" wordBreak="break-all">
              Effect
            </Text>
            <Text fontSize="xs" wordBreak="break-all">
              Size
            </Text>
          </div>
        ),
        accessorKey: "interpretationLevel",
        cell: (info) => starRender(info.getValue()),
        meta: {
          align: "center",
        },
        enableSorting: true,
        size: 25,
      },
      {
        id: "pValue",
        header: () => (
          <Box
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
          >
            <Text fontStyle="italic" fontSize="xs">
              p &lt; 0.05
            </Text>
          </Box>
        ),
        accessorKey: "pValue",
        cell: (info) => {
          const d = info.row.original;
          if (d.pValue < 0.05)
            return <Icon as={FaAsterisk} color={"red.600"} width={"8px"} />;
        },
        meta: {
          align: "center",
        },
        enableSorting: true,
        size: 20,
      },
      {
        id: "group1",
        header:
          currentSelectedGroup?.name +
            " (" +
            formatting(currentSelectedGroup?.trials.length, "int") +
            ")" || "Group 1",
        accessorKey: "group1",
        cell: (info) => {
          const d = info.row.original;
          return (
            <BarChart
              dist={d.dist}
              trialIds={d.trialIds1}
              width={90}
              height={30}
              isGroup={true}
            />
          );
        },
        meta: {
          align: "center",
        },
        enableSorting: false,
        size: 60,
      },
      {
        id: "group2",
        header: () => (
          <Select
            cursor={"pointer"}
            // w={"85%"}
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
        accessorKey: "group2",
        cell: (info) => {
          const d = info.row.original;
          return (
            <BarChart
              dist={d.dist}
              trialIds={d.trialIds2}
              width={90}
              height={30}
              isGroup={true}
            />
          );
        },
        meta: {
          align: "center",
        },
        enableSorting: false,
        size: 60,
      },
    ];
  }, [
    currentSelectedGroup,
    currentSelectedGroup2,
    groups,
    setCurrentSelectedGroup2,
  ]);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "effect",
      desc: true,
    },
  ]);

  const table = useReactTable({
    data,
    columns,
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
    <div style={{ height: "100%", width: "100%", userSelect: "none" }}>
      <Box display={"flex"} justifyContent={"left"} alignItems={"center"}>
        <Heading
          as="h5"
          size="sm"
          color="gray.600"
          p={2}
          display={"flex"}
          alignItems={"center"}
        >
          Comparison View
        </Heading>
        <Box
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          pl={1}
        >
          <Text fontSize="xs" color="gray.600">
            Effect Size of parameter difference:
          </Text>

          <Box
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            padding={"0 8px"}
          >
            <Text fontSize="xs" color={"gray.600"}>
              small
            </Text>
            <Box display={"flex"} alignItems={"center"} pr={1} pl={1}>
              {[0, 1, 2, 3].map((value) => (
                <Box display={"flex"} alignItems={"center"} pr={1} pl={1}>
                  {starRender(value)}
                </Box>
              ))}
            </Box>
            <Text fontSize="xs" color={"gray.600"}>
              large
            </Text>
          </Box>
        </Box>
      </Box>
      <div style={{ width: "100%", height: `calc(100% - 35px)` }}>
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
                {stats &&
                  Object.keys(stats).map((key) => (
                    <tr
                      className={`hparam-table-row`}
                      style={{
                        padding: "0 10px",
                        cursor: "pointer",
                      }}
                    >
                      <td
                        style={{
                          padding: "0 8px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          alignItems: "center",
                          height: "25px",
                        }}
                        colSpan={3}
                      >
                        <Text fontSize={"xs"}>{key} Coverage Value</Text>
                      </td>
                      <td
                        style={{
                          padding: "0 4px",
                          height: "25px",
                        }}
                      >
                        <MetricBadge
                          metricValue={stats[key].group1}
                          type={stats[key].type}
                        />
                      </td>
                      <td
                        style={{
                          padding: "0 4px",
                          height: "25px",
                        }}
                      >
                        <MetricBadge
                          metricValue={stats[key].group2}
                          type={stats[key].type}
                        />
                      </td>
                    </tr>
                  ))}

                {currentSelectedGroup && currentSelectedGroup2 && (
                  <>
                    <tr
                      className={`hparam-table-row`}
                      style={{
                        padding: "0 10px",
                        cursor: "pointer",
                      }}
                    >
                      <td
                        style={{
                          padding: "0 8px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          alignItems: "center",
                          height: "25px",
                        }}
                        colSpan={3}
                      >
                        {/* {key} */}
                        <Text fontSize={"xs"}>Merged Coverage Value</Text>
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          padding: "0 4px",
                          height: "25px",
                        }}
                      >
                        <MetricBadge
                          metricValue={
                            new Set([
                              ...currentSelectedGroup.getUnion(),
                              ...currentSelectedGroup2.getUnion(),
                            ]).size
                          }
                          type={"int"}
                        />
                      </td>
                    </tr>

                    <tr
                      className={`hparam-table-row`}
                      style={{
                        padding: "0 10px",
                        cursor: "pointer",
                      }}
                    >
                      <td
                        style={{
                          padding: "0 8px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          alignItems: "center",
                          height: "25px",
                        }}
                        colSpan={3}
                      >
                        <Text fontSize={"xs"}>Coverage Pattern</Text>
                      </td>
                      <td>
                        <Box height={"25px"} pr={1} pl={1}>
                          <AreaChart trialGroup={currentSelectedGroup} />
                        </Box>
                      </td>
                      <td>
                        <Box height={"25px"} pr={1} pl={1}>
                          <AreaChart trialGroup={currentSelectedGroup2} />
                        </Box>
                      </td>
                    </tr>

                    <tr
                      className={`hparam-table-row`}
                      style={{
                        padding: "0 10px",
                        cursor: "pointer",
                      }}
                    >
                      <td
                        style={{
                          padding: "0 8px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          alignItems: "center",
                          height: "25px",
                        }}
                        colSpan={3}
                      >
                        <Text fontSize={"xs"}>Coverage Pattern (overlaid)</Text>
                      </td>
                      <td colSpan={2}>
                        <Box height={"25px"} pr={1} pl={1}>
                          <OverlappedCharts
                            trialGroup1={currentSelectedGroup}
                            trialGroup2={
                              currentSelectedGroup2 || currentSelectedGroup
                            }
                          />
                        </Box>
                      </td>
                    </tr>
                  </>
                )}
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
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(InterGroupView);

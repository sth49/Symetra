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
interface CodeFileExtendedProps {
  item;
}

const SpeedometerGauge = ({
  value,
  group1Color,
  group2Color,
  group1Value,
  group2Value,
}) => {
  // value는 -100(완전 그룹2 우세)에서 100(완전 그룹1 우세) 사이의 값
  const needleRotation = -(-90 + ((value + 100) * 180) / 200); // -90도에서 90도 사이로 변환

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      {/* 게이지 배경 */}
      <svg width="30px" height="30px" viewBox="0 0 120 60">
        <defs>
          <linearGradient
            id={`gradient-${group1Value}-${group2Value}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={"rgba(0, 0, 255, 0.2)"} />
            <stop offset="50%" stopColor="#E5E7EB" />
            <stop offset="100%" stopColor={"rgba(255, 0, 0, 0.5)"} />
          </linearGradient>
        </defs>

        {/* 반원 게이지 배경 */}
        <path
          d="M10,50 A50,50 0 0,1 110,50"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* 게이지 채우기 (그라데이션) */}
        <path
          d="M10,50 A50,50 0 0,1 110,50"
          fill="none"
          stroke={`url(#gradient-${group1Value}-${group2Value})`}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* 중앙 마커 */}
        <line
          x1="60"
          y1="50"
          x2="60"
          y2="42"
          stroke="#6B7280"
          strokeWidth="2"
        />

        {/* 게이지 마커들 */}
        <line
          x1="20"
          y1="50"
          x2="20"
          y2="44"
          stroke="#6B7280"
          strokeWidth="1"
        />
        <line
          x1="40"
          y1="50"
          x2="40"
          y2="44"
          stroke="#6B7280"
          strokeWidth="1"
        />
        <line
          x1="80"
          y1="50"
          x2="80"
          y2="44"
          stroke="#6B7280"
          strokeWidth="1"
        />
        <line
          x1="100"
          y1="50"
          x2="100"
          y2="44"
          stroke="#6B7280"
          strokeWidth="1"
        />

        {/* 바늘 */}
        <line
          x1="60"
          y1="50"
          x2="60"
          y2="20"
          stroke={"#6B7280"}
          strokeWidth="4"
          style={{
            transformOrigin: "60px 50px",
            transform: `rotate(${needleRotation}deg)`,
            transition: "transform 0.3s ease-out",
          }}
        />

        {/* 바늘 중앙 원 */}
        <circle cx="60" cy="50" r="3" fill={"#6B7280"} />
      </svg>
    </div>
  );
};

const calculateDominance = (a, b) => {
  const group1Coverage = a;
  const group2Coverage = b;

  // 두 그룹 간의 차이를 -100에서 100 사이로 정규화
  // -100: 그룹2가 완전 우세, 0: 동등, 100: 그룹1이 완전 우세
  const totalCoverage = group1Coverage + group2Coverage;
  if (totalCoverage === 0) return 0;

  const difference = group1Coverage - group2Coverage;
  const maxPossibleDiff = totalCoverage;

  // -100 ~ 100 사이의 값으로 정규화
  return Math.round((difference / maxPossibleDiff) * 100);
};

const CodeFileExtended = ({ item }: CodeFileExtendedProps) => {
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
  const columns2 = useMemo(() => {
    return [
      {
        id: "id",
        header: "Branch ID",
        accessorKey: "id",
        cell: (info) => info.getValue(),
        meta: {
          align: "center",
        },
        enableSorting: true,
        size: 60,
      },
      {
        id: "line",
        header: "Line",
        accessorKey: "line",
        cell: (info) => info.getValue(),
        meta: {
          align: "center",
        },
        enableSorting: true,
        size: 60,
      },
      {
        id: "group1",
        header: currSelectedGroup?.name,
        accessorKey: "group1",
        cell: (info) => formatting(info.getValue(), "int"),
        meta: {
          align: "center",
        },
        enableSorting: true,
        size: 60,
      },
      {
        id: "diff",
        header: "Diff",
        accessorKey: "diff",
        cell: (info) => {
          const dominance = calculateDominance(
            info.row.original.group1,
            info.row.original.group2
          );
          return (
            <SpeedometerGauge
              value={dominance}
              group1Color={"blue"}
              group2Color={"red"}
              group1Value={info.row.original.group1}
              group2Value={info.row.original.group2}
            />
          );
        },
        meta: {
          align: "center",
        },
        enableSorting: true,
        size: 60,
      },

      {
        id: "group2",
        header: currSelectedGroup2?.name,
        accessorKey: "group2",
        cell: (info) => formatting(info.getValue(), "int"),
        meta: {
          align: "center",
        },
        enableSorting: true,
        size: 60,
      },
      {
        id: "priority",
        header: "Priority",
        accessorKey: "priority",
        cell: (info) => info.getValue(),
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
      id: "priority",
      desc: true,
    },
  ]);

  const table2 = useReactTable({
    data: item,
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
        padding: "0 4px",
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
                  setSelectBranchId(row.original.id as string);
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
                        // padding: "0 8px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight:
                          selectedBranchId === row.original.id
                            ? "bold"
                            : "normal",
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

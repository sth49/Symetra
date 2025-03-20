import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useCustomStore } from "../store";
import { Box, Text } from "@chakra-ui/react";
import { formatting } from "../model/utils";
import BidirectionalChart from "./BidirectionalChart";
interface CodeFileExtendedProps {
  item: {
    line: number;
    ids: string[];
    group1Count: number;
    group2Count: number;
    diff: number;
  }[];
  showNum: number;
  sortBy: any;
}

const CodeFileExtended = ({ item, showNum, sortBy }: CodeFileExtendedProps) => {
  console.log("CodeFileExtended", item, showNum, sortBy);
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

  const setViewType = useCustomStore((state) => state.setViewType);
  const viewType = useCustomStore((state) => state.viewType);

  const data = useMemo(() => {
    return item.slice(0, showNum);
  }, [item, showNum]);

  const columns2 = useMemo(() => {
    return [
      {
        id: "dummy",
        header: "",
        accessorKey: "group2",
        cell: () => (
          <Box w={"100%"} h={"100%"}>
            <svg width="15" height="20" viewBox="0 0 15 24">
              <line
                x1="7.5"
                y1="0"
                x2="7.5"
                y2="24"
                stroke="black"
                strokeWidth="1"
              />
            </svg>
          </Box>
        ),
        meta: {
          align: "center",
        },
        enableSorting: true,
        size: 15,
      },

      {
        id: "line",
        header: "Line",
        accessorKey: "line",
        cell: (info) => <Box pl={2}>{"Line: " + info.getValue()}</Box>,
        meta: {
          align: "left",
        },
        enableSorting: true,
        size: 60,
      },
      {
        id: "ids",
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
        accessorKey: "ids",
        cell: (info) => info.getValue().length,
        meta: {
          align: "right",
        },
        enableSorting: true,
        size: 40,
      },

      {
        id: "group1Count",
        header: currSelectedGroup?.name,
        accessorKey: "group1Count",
        cell: (info) => formatting(info.getValue(), "float") + "%",
        meta: {
          align: "right",
        },
        enableSorting: true,
        size: 40,
      },
      {
        id: "diff",
        header: "Difference",
        accessorKey: "diff",
        cell: (info) => {
          return (
            <Box width="100%">
              <BidirectionalChart
                leftValue={info.row.original.group1Count}
                rightValue={info.row.original.group2Count}
                height={10}
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
        id: "group2Count",
        header: currSelectedGroup2?.name,
        accessorKey: "group2Count",
        cell: (info) => formatting(info.getValue(), "float") + "%",
        meta: {
          align: "right",
        },
        enableSorting: true,
        size: 50,
      },
    ];
  }, [currSelectedGroup?.name, currSelectedGroup2?.name]);

  const [sorting, setSorting] = useState<SortingState>(sortBy);

  useEffect(() => {
    setSorting(sortBy);
  }, [sortBy]);

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
        <tbody key={"tbody"}>
          {table2.getRowModel().rows.map((row) => {
            return (
              <tr
                key={row.id}
                className={`hparam-table-row`}
                style={{
                  padding: "0 10px",
                  cursor: "pointer",
                  backgroundColor:
                    (row.original.ids as string[]).includes(selectedBranchId) &&
                    viewType === "line"
                      ? "#d0e0fc"
                      : "",
                }}
                // 모든 브랜치 ID에 대한 데이터 속성 추가
                data-branch-ids={(row.original.ids as string[]).join(",")}
                data-line-number={row.original.line}
                // 선택된 브랜치 ID가 포함된 경우 특별한 데이터 속성 추가

                onClick={() => {
                  setSelectBranchId(row.original.ids[0] as string);
                  setViewType("line");
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

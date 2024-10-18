import { useCallback, useMemo, useState } from "react";
import { useConstDataStore } from "./store/constDataStore";
import { formatting } from "../model/utils";
import { Tooltip } from "@chakra-ui/react";
import {
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { Box, Button, Icon, IconButton, Text } from "@chakra-ui/react";
import { FaEye } from "react-icons/fa6";
import { FaEyeSlash } from "react-icons/fa6";
import BarChart from "./BarChart";
import { FaAngleUp } from "react-icons/fa6";
import { FaAngleDown } from "react-icons/fa6";
import { FaSort } from "react-icons/fa6";
import { FaSortUp } from "react-icons/fa6";
import { FaSortDown } from "react-icons/fa6";
import HparamExtended from "./HparamExtended";

const HparamTable = () => {
  const { exp, hyperparams, setHyperparams } = useConstDataStore();

  const data = useMemo(
    () =>
      exp?.hyperparams
        .sort((a, b) => Math.abs(b.getEffect()) - Math.abs(a.getEffect()))
        .map((hp, index) => ({
          id: index,
          name: hp.displayName,
          fullName: hp.name,
          displayName: hp.displayName,
          effect: hp.getEffect(),
          effctsByValue: hp.getEffectsByValue(),
          dist: hp.name,
          type: hp.type,
          icon: hp.icon,
        })),

    [exp]
  );
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );
  const toggleVisibilityForSelected = useCallback(
    (visible) => {
      const selectedRowIds = table
        .getSortedRowModel()
        .rows.filter((r, i) => selectedRows.has(i))
        .map((r) => r.original.displayName);

      const newHyperparams = hyperparams.map((hp, i) => {
        if (selectedRowIds.includes(hp.displayName)) {
          hp.visible = visible;
        }
        return hp;
      });
      setHyperparams([...newHyperparams]);
      setSelectedRows(new Set());
    },

    [selectedRows, hyperparams, setHyperparams]
  );
  const toggleRowSelection = useCallback(
    (index, shiftKey) => {
      console.log("index", index);

      if (shiftKey && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const newSelectedRows = new Set(selectedRows);
        for (let i = start; i <= end; i++) {
          newSelectedRows.add(i);
        }
        setSelectedRows(newSelectedRows);
        setIsMultiSelect(true);
      } else if (isMultiSelect) {
        setSelectedRows(new Set());
        setIsMultiSelect(false);
      } else {
        const newSelectedRows = new Set(selectedRows);
        if (newSelectedRows.has(index)) {
          newSelectedRows.delete(index);
        } else {
          newSelectedRows.add(index);
        }
        setSelectedRows(newSelectedRows);
      }
      setLastSelectedIndex(index);
    },
    [isMultiSelect, lastSelectedIndex, selectedRows]
  );

  const columns = useMemo(() => {
    return [
      {
        id: "visible",
        header: "",
        accessorKey: "visible",
        cell: (info) => {
          const { row } = info;

          const item = row.original;
          const visible = hyperparams.find(
            (hp) => hp.name === item.fullName
          )?.visible;

          return (
            <IconButton
              size={"xs"}
              colorScheme={visible ? "blue" : "gray"}
              icon={
                visible ? (
                  <Icon as={FaEye} color={"white"} />
                ) : (
                  <Icon as={FaEyeSlash} color={"gray.500"} />
                )
              }
              onClick={(e) => {
                e.stopPropagation();
                const newHyperparams = hyperparams.map((hp, i) => {
                  if (hp.name === item.fullName) {
                    hp.visible = !hp.visible;
                  }
                  return hp;
                });
                setHyperparams([...newHyperparams]);
              }}
              aria-label={""}
            />
          );
        },
        size: 46,
        meta: {
          align: "left",
        },
        enableSorting: false,
      },
      {
        id: "name",
        header: "Name",
        accessorKey: "name",
        cell: (info) => {
          const hparamIcon = info.row.original.icon;
          const { row } = info;
          const index = table
            .getSortedRowModel()
            .rows.findIndex((r) => r.id === row.id);
          return (
            <Box
              display={"flex"}
              alignItems={"center"}
              onClick={(e) => {
                toggleRowSelection(index, e.shiftKey);
              }}
              //   onMouseEnter={(e) => {
              //     showTooltip({
              //       tooltipLeft: e.clientX,
              //       tooltipTop: e.clientY,
              //       tooltipData: { key: item.fullName, value: item.name },
              //     });
              //   }}
              //   onMouseLeave={hideTooltip}
            >
              <Tooltip label={row.original.fullName}>
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
        size: 60,
        meta: {
          align: "center",
        },
      },
      {
        id: "effect",
        header: "Effect",
        accessorKey: "effect",
        cell: (info) => {
          const { row } = info;
          //   console.log("row", row);

          const index = table
            .getSortedRowModel()
            .rows.findIndex((r) => r.id === row.id);
          return (
            <div
              onClick={(e) => {
                toggleRowSelection(index, e.shiftKey);
              }}
            >
              {formatting(row.original.effect, "float")}
            </div>
          );
        },

        size: 50,
        meta: {
          align: "center",
        },
      },
      {
        id: "effectsByValue",
        header: "Distribution",
        accessorKey: "dist",
        cell: (info) => {
          return (
            <BarChart
              dist={info.getValue()}
              width={100}
              height={30}
              trialIds={[]}
            />
          );
          //   return <>dist</>;
        },
        size: 110,
        meta: {
          align: "center",
        },
        enableSorting: false,
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
                  <Icon as={FaAngleDown} color={"gray.500"} />
                ) : (
                  <Icon as={FaAngleUp} color={"gray.500"} />
                )
              }
              onClick={() => row.toggleExpanded()}
              aria-label={""}
            />
          );
        },
        size: 46,
        meta: {
          align: "right",
        },
        enableSorting: false,
      },
    ];
  }, [
    toggleRowSelection,
    hyperparams,
    setHyperparams,
    selectedRows,
    isMultiSelect,
  ]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      expanded,
    },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    // getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
    defaultColumn: {
      minSize: 30,
      size: 50,
      maxSize: 100,
    },
    enableRowSelection: true,
  });

  return (
    <div
      style={{
        height: "calc(100% - 35px)",
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
                          }}
                        >
                          {{
                            asc: <Icon color={"gray.600"} as={FaSortUp} />,
                            desc: <Icon color={"gray.600"} as={FaSortDown} />,
                          }[header.column.getIsSorted() as string] ??
                            (header.column.getCanSort() && (
                              <Icon color={"gray.600"} as={FaSort} />
                            ))}
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
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const index = table
                .getSortedRowModel()
                .rows.findIndex((r) => r.id === row.id);
              return (
                <>
                  <tr
                    key={row.id}
                    // className="hparam-table-row"
                    className={`hparam-table-row ${
                      selectedRows.has(index) ? "selected" : ""
                    }`}
                    style={{
                      padding: "0 10px",
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
                            whiteSpace: "nowrap",
                            alignItems: "center",
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
                      <td colSpan={5} style={{ backgroundColor: "#f9f9f9" }}>
                        <HparamExtended item={row.original} />
                      </td>
                    </tr>
                  )}
                  {selectedRows.has(
                    table
                      .getSortedRowModel()
                      .rows.findIndex((r) => r.id === row.id)
                  ) &&
                    lastSelectedIndex ===
                      table
                        .getSortedRowModel()
                        .rows.findIndex((r) => r.id === row.id) && (
                      <tr>
                        <td colSpan={5} style={{ backgroundColor: "#f9f9f9" }}>
                          <Box
                            display={"flex"}
                            width={"100%"}
                            justifyContent={"space-between"}
                            p={"10px 0"}
                            bgColor={"#f9f9f9"}
                          >
                            <Button
                              size={"xs"}
                              width={"48%"}
                              height={"40px"}
                              isDisabled={selectedRows.size === 0}
                              onClick={() => toggleVisibilityForSelected(true)}
                              colorScheme="blue"
                              whiteSpace="normal"
                              display={"flex"}
                              wordBreak="break-word"
                              ml={0.5}
                              fontSize={"10px"}
                            >
                              <Icon as={FaEye} />
                              Show selected hyperparameters ({selectedRows.size}
                              )
                            </Button>
                            <Button
                              size={"xs"}
                              width={"48%"}
                              height={"40px"}
                              isDisabled={selectedRows.size === 0}
                              onClick={() => toggleVisibilityForSelected(false)}
                              colorScheme="blue"
                              display={"flex"}
                              whiteSpace="normal"
                              wordBreak="break-word"
                              mr={0.5}
                              fontSize={"10px"}
                            >
                              <Icon as={FaEyeSlash} />
                              Hide selected hyperparameters ({selectedRows.size}
                              )
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
  );
};

export default HparamTable;

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useConstDataStore } from "./store/constDataStore";
import { formatting } from "../model/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
const adjustTableHeight = (tableRef, virtualHeight) => {
  if (!tableRef.current) return;

  const existingPseudoElement = window.getComputedStyle(
    tableRef.current,
    "::after"
  );
  const existingPseudoHeight = parseFloat(existingPseudoElement.height) || 0;
  const tableHeight = tableRef.current.clientHeight - existingPseudoHeight;
  const pseudoHeight = Math.max(virtualHeight - tableHeight, 0);
  document.documentElement.style.setProperty(
    "--pseudo-height",
    `${pseudoHeight}px`
  );
  return pseudoHeight;
};
const TrialTable = () => {
  const { exp, hyperparams } = useConstDataStore();
  const data = useMemo(
    () =>
      exp?.trials.map((trial) => ({
        id: trial.id,
        metric: trial.metric,
        ...trial.params,
      })) || [],
    [exp]
  );

  //   console.log(data);

  const columns = useMemo(() => {
    return [
      {
        header: "",
        accessorKey: "check",
        cell: <input type="checkbox" />,
        meta: {
          align: "center",
        },
        size: 50,
      },
      {
        header: "ID",
        accessorKey: "id",
        cell: (info) => info.getValue(),
        // size: 100,
        meta: {
          align: "right",
        },
        size: 100,
      },
      {
        header: "Metric",
        accessorKey: "metric",
        cell: (info) => formatting(info.getValue(), "int"),
        meta: {
          align: "right",
        },
        size: 100,
      },
      ...hyperparams.map((param) => {
        return {
          header: param.displayName,
          type: param.type,
          accessorKey: param.name,
          cell: (info) =>
            info.getValue() === true
              ? "T"
              : info.getValue() === false
              ? "F"
              : //   : info.getColumn().columnDef.type === "string" ?
                info.getValue(),
          // info.getValue() === true
          //   ? "T"
          //   : info.getValue() === false
          //   ? "F"
          //   : //   : info.getColumn().columnDef.type === "string" ?
          //     info.getValue(),
          //   formatting(
          //       info.getValue(),
          //       info.getColumn().columnDef.type === "int" ? "int" : "float"
          //     ),
          //   width: 100,
          meta: {
            align: "center",
          },
          size: 100,
        };
      }),
    ];
  }, []);
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });
  const { rows } = table.getRowModel();

  const parentRef = useRef<HTMLDivElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [isScrollNearBottom, setIsScrollNearBottom] = useState(false);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 20,
    overscan: 20,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const virtualSize = virtualizer.getTotalSize();

  // callback to adjust the height of the pseudo element
  const handlePseudoResize = useCallback(() => {
    return adjustTableHeight(tableRef, virtualSize);
  }, [tableRef, virtualSize]);

  // callback to handle scrolling, checking if we are near the bottom
  const handleScroll = useCallback(() => {
    if (parentRef.current) {
      const scrollPosition = parentRef.current?.scrollTop;
      const visibleHeight = parentRef.current?.clientHeight;
      setIsScrollNearBottom(
        scrollPosition > virtualSize * 0.95 - visibleHeight
      );
    }
  }, [parentRef, virtualSize]);

  // add an event listener on the scrollable parent container and resize the
  // pseudo element whenever the table renders with new data
  useEffect(() => {
    const scrollable = parentRef.current;
    if (scrollable) scrollable.addEventListener("scroll", handleScroll);
    handlePseudoResize();

    return () => {
      if (scrollable) scrollable.removeEventListener("scroll", handleScroll);
    };
  }, [data, handleScroll, handlePseudoResize]);

  // if we are near the bottom of the table, resize the pseudo element each time
  // the length of virtual items changes (which is effectively the number of table
  // rows rendered to the DOM). This ensures we don't scroll too far or too short.
  useEffect(() => {
    if (isScrollNearBottom) handlePseudoResize();
  }, [isScrollNearBottom, virtualItems.length, handlePseudoResize]);

  return (
    <div
      ref={parentRef}
      className="container"
      style={{
        overflow: "auto",
        height: "100%",
      }}
    >
      <div
        ref={scrollableRef}
        style={{
          position: "relative",
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        <table ref={tableRef} className="virtual-table">
          <thead
          // style={{
          //   position: "sticky",
          //   top: 0,
          //   zIndex: 10,
          //   backgroundColor: "white",
          // }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="virtual-table-sticky-header">
                {headerGroup.headers.map((header) => {
                  const { column } = header;
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        width: column.getSize(),
                        position: "sticky",
                        top: 0,
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
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: " 🔼",
                            desc: " 🔽",
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {virtualizer.getVirtualItems().map((virtualRow, index) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${
                      virtualRow.start - index * virtualRow.size
                    }px)`,
                  }}
                  className="virtual-table-row"
                >
                  {row.getVisibleCells().map((cell) => {
                    const { column } = cell;
                    return (
                      <td
                        key={cell.id}
                        style={{
                          width: column.getSize(),
                          textAlign: cell.column.columnDef.meta.align,
                          padding: "0 8px",
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
    </div>
  );
};

export default TrialTable;

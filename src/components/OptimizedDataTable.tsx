import React, { useMemo, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { Experiment } from "../model/experiment";
import { Hyperparam } from "../model/hyperparam";
import { useTableStyles } from "@chakra-ui/react";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  useReactTable,
} from "@tanstack/react-table";

import { useVirtualizer } from "@tanstack/react-virtual";
interface OptimizedDataTableProps {
  data: Experiment | null;
}

const OptimizedDataTable = (props: OptimizedDataTableProps) => {
  const [data, _setData] = useState(
    props.data?.trials.map((trial) => ({
      id: trial.id,
      metric: trial.metric,
      ...trial.params,
    }))
  );

  const exp = props.data;

  const columns = React.useMemo(() => {
    // useMemo 내부에서 배열을 직접 반환합니다.
    return [
      {
        accessorKey: "id",
        header: "ID",
        size: 60,
      },
      {
        accessorKey: "metric",
        header: "Metric",
        size: 60,
      },
      ...(exp?.hyperparams.map((hp: Hyperparam) => ({
        accessorKey: hp.name,
        header: hp.displayName,
        size: 60,
      })) || []), // exp?.hyperparams가 undefined일 경우 빈 배열을 확장
    ];
  }, [exp]); // 의존성 배열에 exp를 포함시킵니다.

  console.log(columns);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  const { rows } = table.getRowModel();

  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "ascending",
  });

  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  // 셀 렌더링 컴포넌트
  //   const Row = ({ index, style, data }) => (
  //     <div
  //       style={{
  //         ...style,
  //         display: "flex",
  //         flexDirection: "row",
  //         justifyContent: "space-between",
  //         padding: "10px",
  //         borderBottom: "1px solid #ccc",
  //       }}
  //     >
  //       <div>{data[index].id}</div>
  //       <div>{data[index].metric}</div>
  //       {exp?.hyperparams.map((hp: Hyperparam, i: number) => {
  //         return <div>{data[index].params[hp.name]}</div>;
  //       })}
  //       {/* {columns.map((col, i) => {
  //         return RenderDataCell(col, data[index][col]);
  //       })} */}
  //     </div>
  //   );

  const sortedData = useMemo(() => {
    if (!sortConfig) {
      return data;
    }
    const sorted = [...data].sort((a, b) => {
      if (sortConfig.key === "id" || sortConfig.key === "metric") {
        if (a[sortConfig.key] < b[sortConfig.key])
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key])
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      } else {
        if (a.params[sortConfig.key] < b.params[sortConfig.key])
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (a.params[sortConfig.key] > b.params[sortConfig.key])
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      }
    });
    return sorted;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="app">
      {process.env.NODE_ENV === "development" ? (
        <p>
          <strong>Notice:</strong> You are currently running React in
          development mode. Virtualized rendering performance will be slightly
          degraded until this application is built for production.
        </p>
      ) : null}
      ({data.length} rows)
      <div
        className="container"
        ref={tableContainerRef}
        style={{
          overflow: "auto", //our scrollable table container
          position: "relative", //needed for sticky header
          height: "800px", //should be a fixed height
        }}
      >
        {/* Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights */}
        <table style={{ display: "grid" }}>
          <thead
            style={{
              display: "grid",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                style={{ display: "flex", width: "100%" }}
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      style={{
                        display: "flex",
                        width: header.getSize(),
                      }}
                    >
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
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody
            style={{
              display: "grid",
              height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
              position: "relative", //needed for absolute positioning of rows
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index] as Row<Person>;
              return (
                <tr
                  data-index={virtualRow.index} //needed for dynamic row height measurement
                  ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
                  key={row.id}
                  style={{
                    display: "flex",
                    position: "absolute",
                    transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
                    width: "100%",
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td
                        key={cell.id}
                        style={{
                          display: "flex",
                          width: cell.column.getSize(),
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
//   return (
//     <div>
//       <div
//         style={{
//           display: "flex",
//           flexDirection: "row",
//           justifyContent: "space-between",
//           padding: "10px",
//           background: "#f0f0f0",
//           transform: "translateZ(0)", // 브라우저 레이어 변환을 통해 하드웨어 가속 사용
//         }}
//       >
//         {/* <button onClick={() => requestSort("id")}>ID</button>
//         <button onClick={() => requestSort("metric")}>metric</button>
//         <button onClick={() => requestSort("email")}>Email</button>
//         <button onClick={() => requestSort("city")}>City</button>
//         <button onClick={() => requestSort("job")}>Job Title</button> */}

//         {/* {columns.map((col, i) => {
//           return (
//             <div
//               style={{
//                 padding: 3,
//                 borderLeft: "1px solid #000",
//               }}
//               onClick={() => requestSort(col)}
//             >
//               {col}
//             </div>
//           );
//         })} */}
//         {/* {columns.map((col, i) => {
//           return (
//             <button
//               onClick={() => requestSort(col)}
//               style={{ padding: 3, borderLeft: "1px solid #000" }}
//             >
//               {col}
//             </button>
//           );
//         })} */}
//       </div>
//       {/* <List
//         height={600}
//         width={"100%"}
//         itemCount={sortedData.length}
//         itemSize={50}
//         itemData={sortedData}
//       >
//         {Row}
//       </List> */}
//     </div>
//   );
// };

export default OptimizedDataTable;

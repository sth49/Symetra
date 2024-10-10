import { Box, Icon, Text } from "@chakra-ui/react";
import { formatting, generateBinnedData } from "../model/utils";
import ViolinPlot from "@visx/stats/lib/ViolinPlot";
import { FaSort } from "react-icons/fa6";
import { FaSortUp } from "react-icons/fa6";
import { FaSortDown } from "react-icons/fa6";
import { Axis, Orientation } from "@visx/axis";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HyperparamTypes } from "../model/hyperparam";
interface HparamExtendedProps {
  item;
}

const HparamExtended = ({ item }: HparamExtendedProps) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "none", // ascending or descending
  });
  const [sortedData, setSortedData] = useState([]);

  const data = useMemo(() => {
    return Object.keys(item.effctsByValue).map((key) => {
      return {
        value: item.type === HyperparamTypes.Ordinal ? Number(key) : key,
        count: item.effctsByValue[key].length,
        effect: item.effctsByValue[key].reduce((a, b) => a + b, 0),
        binData: generateBinnedData(item.effctsByValue[key], 100, 30, "x"),
      };
    });
  }, [item.effctsByValue]);

  const xScale = useMemo(() => {
    const allEffectByValue = Object.values(
      item.effctsByValue
    ).flat() as number[];
    return generateBinnedData(allEffectByValue, 100, 30, "x").xScale;
  }, [item.effctsByValue]);

  const requestSort = useCallback((key) => {
    setSortConfig((prevConfig) => ({
      key:
        prevConfig.key === key && prevConfig.direction === "descending"
          ? null
          : key,
      direction:
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }, []);

  const columns = useMemo(
    () => [
      { label: `${item.name}`, key: "value", width: 50, align: "center" },
      { label: "Count", key: "count", width: 60, align: "center" },
      {
        label: "Effect",
        key: "effect",

        width: 60,
        align: "center",
      },
      {
        label: "Distribution",
        key: "distribution",
        width: 100,
        align: "center",
      },
    ],
    []
  );

  useEffect(() => {
    let sortedItems = [...data];
    if (sortConfig.key !== null) {
      sortedItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    setSortedData(sortedItems);
  }, [data, sortConfig]);

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
        }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            style={{
              display: "flex",
              width: `${column.width}px`,
              padding: "2px",
              borderBottom: "1px solid #ddd",
              cursor: "pointer",
              flexShrink: 0,
              justifyContent: column.align,
              alignItems: "center",
              height: "35px",
              fontSize: "small",
            }}
            onClick={() => {
              if (column.key !== "distribution") {
                requestSort(column.key);
              }
            }}
          >
            {column.key !== "distribution" && (
              <Icon
                color={"gray"}
                width={2}
                mr={1}
                as={
                  sortConfig.key === column.key
                    ? sortConfig.direction === "ascending"
                      ? FaSortUp
                      : FaSortDown
                    : FaSort
                }
              />
            )}
            <Text fontWeight={"bold"}>{column.label}</Text>
          </div>
        ))}
      </div>
      {sortedData.map((row, index) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          {columns.map((column) => (
            <div
              key={column.key}
              style={{
                width: `${column.width}px`,
                padding: "2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flexShrink: 0,
                display: "flex",
                justifyContent: column.align,
                fontSize: "small",
              }}
            >
              {column.key === "value" ? (
                row[column.key]
              ) : column.key === "count" ? (
                formatting(row[column.key], "int")
              ) : column.key === "effect" ? (
                formatting(row[column.key], "float")
              ) : column.key === "distribution" ? (
                <svg width={100} height={36}>
                  <g transform="translate(10, 0)">
                    {" "}
                    <ViolinPlot
                      data={row.binData}
                      valueScale={xScale}
                      width={26}
                      height={100}
                      horizontal={true}
                      top={5}
                      fill="grey"
                    />
                    <Axis
                      scale={xScale}
                      orientation={Orientation.bottom}
                      top={18}
                      numTicks={2}
                      tickValues={[xScale.domain()[0], xScale.domain()[1]]}
                    />
                    {/* {(() => {
                      const medianValue = allEffectByValue.sort(
                        (a, b) => a - b
                      )[Math.floor(allEffectByValue.length / 2)];
                      const medianX = xScale(medianValue);
                      return (
                        <line
                          x1={medianX}
                          y1={4} // ViolinPlot의 top 값
                          x2={medianX}
                          y2={32} // Axis의 top 값
                          stroke="red"
                          strokeWidth={1}
                          strokeDasharray="2,2"
                        />
                      );
                    })()} */}
                  </g>
                </svg>
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
    // <Box
    //   display={"flex"}
    //   flexDir={"column"}
    //   alignItems={"center"}
    //   justifyContent={"space-between"}
    //   whiteSpace={"nowrap"}
    //   overflowX={"auto"}
    //   textOverflow={"ellipsis"}
    //   userSelect={"none"}
    //   w={"100%"}
    // >
    //   <Box
    //     width={"100%"}
    //     display={"flex"}
    //     alignItems={"center"}
    //     borderBottom={"1px solid #ddd"}
    //   >
    //     <Box width={"20%"}>
    //       <Text fontSize={"xs"} fontWeight={"bold"} align="center">
    //         {item.name}
    //       </Text>
    //     </Box>
    //     <Box width={"15%"}>
    //       <Text fontSize={"xs"} fontWeight={"bold"} align="center">
    //         Count
    //       </Text>
    //     </Box>
    //     <Box width={"15%"}>
    //       <Text fontSize={"xs"} fontWeight={"bold"} align="center">
    //         Effect
    //       </Text>
    //     </Box>
    //     <Box width={"40%"}>
    //       <Text fontSize={"xs"} fontWeight={"bold"} align="center"></Text>
    //     </Box>
    //   </Box>
    //   {Object.keys(item.effctsByValue)
    //     .sort((a, b) => {
    //       const aSum = item.effctsByValue[a].reduce((a, b) => a + b, 0);
    //       const bSum = item.effctsByValue[b].reduce((a, b) => a + b, 0);
    //       return bSum - aSum;
    //     })
    //     .map((key) => {
    //       const allEffectByValue = Object.values(
    //         item.effctsByValue
    //       ).flat() as number[];
    //       const { binData } = generateBinnedData(
    //         item.effctsByValue[key],
    //         100,
    //         30,
    //         "x"
    //       );
    //       return (
    //         <Box display={"flex"} width={"100%"} alignItems={"center"} mb={1.5}>
    //           <Box width={"20%"}>
    //             <Text fontSize={"xs"} align="center" whiteSpace="pre-line">
    //               {key}
    //             </Text>
    //           </Box>
    //           <Box width={"15%"}>
    //             <Text fontSize={"xs"} align="right">
    //               {formatting(item.effctsByValue[key].length, "int")}
    //             </Text>
    //           </Box>
    //           <Box width={"15%"}>
    //             <Text fontSize={"xs"} align="right">
    //               {formatting(
    //                 item.effctsByValue[key].reduce((a, b) => a + b, 0),
    //                 "float"
    //               )}
    //             </Text>
    //           </Box>
    //           <Box width={"50%"} display={"flex"} justifyContent={"center"}>
    //             <svg width={120} height={36}>
    //               <g transform="translate(10, 0)">
    //                 {" "}
    //                 <ViolinPlot
    //                   data={binData}
    //                   valueScale={xScale}
    //                   width={26}
    //                   height={100}
    //                   horizontal={true}
    //                   top={5}
    //                   fill="grey"
    //                 />
    //                 <Axis
    //                   scale={xScale}
    //                   orientation={Orientation.bottom}
    //                   top={18}
    //                   numTicks={2}
    //                   tickValues={[xScale.domain()[0], xScale.domain()[1]]}
    //                 />
    //                 {(() => {
    //                   const medianValue = allEffectByValue.sort(
    //                     (a, b) => a - b
    //                   )[Math.floor(allEffectByValue.length / 2)];
    //                   const medianX = xScale(medianValue);
    //                   return (
    //                     <line
    //                       x1={medianX}
    //                       y1={4} // ViolinPlot의 top 값
    //                       x2={medianX}
    //                       y2={32} // Axis의 top 값
    //                       stroke="red"
    //                       strokeWidth={1}
    //                       strokeDasharray="2,2"
    //                     />
    //                   );
    //                 })()}
    //               </g>
    //             </svg>
    //           </Box>
    //         </Box>
    //       );
    //     })}
    // </Box>
  );
};

export default HparamExtended;

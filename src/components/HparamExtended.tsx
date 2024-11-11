import { Box, Icon, Text } from "@chakra-ui/react";
import { formatting, generateBinnedData } from "../model/utils";
import ViolinPlot from "@visx/stats/lib/ViolinPlot";
import { FaSort } from "react-icons/fa6";
import { FaSortUp } from "react-icons/fa6";
import { FaSortDown } from "react-icons/fa6";
import { Axis, Orientation } from "@visx/axis";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { HyperparamTypes } from "../model/hyperparam";
import BranchBarChart from "./BranchBarChart";
import { useConstDataStore } from "./store/constDataStore";
import * as d3 from "d3";
import { useMetricScale } from "../model/colorScale";
interface HparamExtendedProps {
  item;
}

const HparamExtended = ({ item }: HparamExtendedProps) => {
  const [sortConfig, setSortConfig] = useState({
    key: "effect",
    direction: "descending", // ascending or descending
  });
  const exp = useConstDataStore((state) => state.exp);
  const [sortedData, setSortedData] = useState([]);

  // console.log("item", item);
  const data = useMemo(() => {
    return Object.keys(item.effctsByValue).map((key) => {
      return {
        value: item.type === HyperparamTypes.Ordinal ? Number(key) : key,
        count: item.effctsByValue[key].length,
        effect:
          item.effctsByValue[key].reduce((a, b) => a + b, 0) /
          item.effctsByValue[key].length,
        // positiveEffect:
        //   item.effctsByValue[key]
        //     .filter((v) => v > 0)
        //     .reduce((a, b) => a + b, 0) /
        //   item.effctsByValue[key].filter((v) => v > 0).length,
        // negativeEffect:
        //   item.effctsByValue[key]
        //     .filter((v) => v < 0)
        //     .reduce((a, b) => a + b, 0) /
        //   item.effctsByValue[key].filter((v) => v < 0).length,
        binData: generateBinnedData(item.effctsByValue[key], 100, 30, "x")
          .binData,
        trialIds: item.idsByValue[key],
        allEffectValues: item.allEffectValues,
      };
    });
  }, [item.effctsByValue]);

  const xScale = useMemo(() => {
    const allEffectByValue = Object.values(
      item.effctsByValue
    ).flat() as number[];
    return generateBinnedData(allEffectByValue, 60, 30, "x").xScale;
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
      { label: `${item.name}`, key: "value", width: 80, align: "center" },
      { label: "Count", key: "count", width: 60, align: "right" },
      {
        label: "Effect",
        key: "effect",

        width: 55,
        align: "right",
      },
      {
        label: "Coverage",
        key: "distribution",
        width: 90,
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

  const medianValue = useMemo(() => {
    const allCoverage = exp.trials.map((trial) => trial.metric);
    return d3.median(allCoverage);
  }, [exp.trials]);

  return (
    <div style={{ width: "100%", marginBottom: "5px" }}>
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
              justifyContent: "center",
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
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
          }}
          className="hparam-extended-row"
        >
          {columns.map((column) => (
            <div
              key={column.key}
              style={{
                width: `${column.width}px`,
                padding: "2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "normal",
                flexShrink: 0,
                display: "flex",
                justifyContent: column.align,
                fontSize: "small",
                alignItems: "center",
                height: "35px",
              }}
            >
              {column.key === "value" ? (
                <Text whiteSpace={"normal"} textAlign={"center"}>
                  {row[column.key]}
                </Text>
              ) : column.key === "count" ? (
                formatting(row[column.key], "int")
              ) : column.key === "effect" ? (
                <>{formatting(row[column.key], "float")}</>
              ) : column.key === "distribution" ? (
                <BranchBarChart
                  trialIds={row.trialIds}
                  width={100}
                  height={30}
                />
              ) : null}
            </div>
          ))}
        </div>
      ))}
      {/* <Box display={"flex"} justifyContent={"center"} mb={3} mt={1}>
        <Text
          fontSize={"xs"}
          color="gray.600"
          align="center"
          whiteSpace="pre-line"
        >
          Median Coverage
        </Text>
        <Text
          fontSize={"xs"}
          color={medianValue < 1000 ? "white" : "black"}
          align="center"
          whiteSpace="pre-line"
          ml={2}
          background={colorScale(metricScale(medianValue))}
        >
          {formatting(medianValue, "float")}
        </Text>
      </Box> */}
    </div>
  );
};

export default memo(HparamExtended);

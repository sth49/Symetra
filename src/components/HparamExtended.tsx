import { Icon, Text } from "@chakra-ui/react";
import { formatting, generateBinnedData } from "../model/utils";
import { FaSort } from "react-icons/fa6";
import { FaSortUp } from "react-icons/fa6";
import { FaSortDown } from "react-icons/fa6";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { HyperparamTypes } from "../model/hyperparam";
import BranchBarChart from "./BranchBarChart";
interface HparamExtendedProps {
  item;
}

const HparamExtended = ({ item }: HparamExtendedProps) => {
  const [sortConfig, setSortConfig] = useState({
    key: "effect",
    direction: "descending", // ascending or descending
  });
  const [sortedData, setSortedData] = useState([]);

  const data = useMemo(() => {
    return Object.keys(item.effctsByValue).map((key) => {
      return {
        value: item.type === HyperparamTypes.Ordinal ? Number(key) : key,
        count: item.effctsByValue[key].length,
        effect:
          item.effctsByValue[key].reduce((a, b) => a + b, 0) /
          item.effctsByValue[key].length,
        binData: generateBinnedData(item.effctsByValue[key], 100, 30, "x")
          .binData,
        trialIds: item.idsByValue[key],
        allEffectValues: item.allEffectValues,
      };
    });
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
      { label: `${item.name}`, key: "value", width: 60, align: "center" },
      { label: "Count", key: "count", width: 60, align: "right" },
      {
        label: "Effect",
        key: "effect",

        width: 55,
        align: "right",
      },
      {
        label: "Trials by Coverage",
        key: "distribution",
        width: 125,
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
              fontSize: "12px",
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
                fontSize: "12px",
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
                  hparamKey={item.name}
                  hparamValue={row["value"]}
                  trialIds={row.trialIds}
                  width={110}
                  height={30}
                />
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default memo(HparamExtended);

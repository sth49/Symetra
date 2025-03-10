import { Box, Text } from "@chakra-ui/react";
import { formatting } from "../model/utils";
import { useConstDataStore } from "./store/constDataStore";
import { useMemo } from "react";

import * as d3 from "d3";
const MetricLegend = () => {
  const exp = useConstDataStore((state) => state.exp);

  const metricValues = useMemo(
    () => exp.trials.map((trial) => trial.metric),
    [exp]
  );

  const minValue = Math.min(...metricValues.filter((v) => v !== 0));
  const maxValue = Math.max(...metricValues);

  // Create gradient stops for the legend
  const gradientStops = useMemo(() => {
    return d3.range(0, 1.01, 0.1).map((t) => {
      const value = minValue + t * (maxValue - minValue);
      const color = d3
        .scaleSequential(d3.interpolateGreens)
        .domain([minValue, maxValue])(value);
      return { offset: `${t * 100}%`, color };
    });
  }, [minValue, maxValue]);

  return (
    <div style={{ display: "flex", width: "300px", alignItems: "center" }}>
      <Box
        style={{
          width: "16px",
          height: "16px",
          backgroundColor: "#E9392E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text fontSize="12px" color={"white"}>
          0
        </Text>
      </Box>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        style={{
          width: `calc(100% - 16px)`,
          marginLeft: "5px",
          padding: "0 10px",
        }}
      >
        <Text fontSize="12px" color={"black"}>
          {formatting(minValue, "int")}
        </Text>
        <svg width="200" height="16">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {gradientStops.map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
          <rect width="200" height="16" fill="url(#gradient)" />
        </svg>

        <Text fontSize="12px" color={"black"}>
          {formatting(maxValue, "int")}
        </Text>
      </Box>
      {/* {ranges.map((range, i) => (
        <div
          key={i}
          style={{
            backgroundColor: range.color,
            color: range.textColor,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text fontSize="12px" color={range.textColor}>
            {range.label}
          </Text>
        </div>
      ))} */}
    </div>
  );
};

export default MetricLegend;

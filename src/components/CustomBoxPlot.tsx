import { Box, Tooltip } from "@chakra-ui/react";
import { AxisBottom } from "@visx/axis";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";

interface BoxPlotProps {
  data: number[];
  name: string;
  count: number;
  binCount: number;
  maxCount: number;
  type: string;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

const CustomBoxPlot = ({
  data,
  name,
  count,
  binCount,
  maxCount,
  type,
  width = 50,
  height = 40,
  margin = { top: 2, right: 2, bottom: 10, left: 4 },
}: BoxPlotProps) => {
  if (type === "numerical") {
    const xMin = Math.min(...data);
    const xMax = Math.max(...data);
    const xRange = xMax - xMin;
    const binSize = xRange / binCount;
    const isInteger = data.every(Number.isInteger);
    const xScale = scaleLinear({
      domain: [xMin, xMax],
      range: [margin.left, width - margin.right],
    });

    const bins = Array.from({ length: binCount }, (_, i) => ({
      x0: isInteger
        ? Math.floor(xMin + i * binSize)
        : (xMin + i * binSize).toFixed(2),
      x1: isInteger
        ? Math.floor(xMin + (i + 1) * binSize)
        : (xMin + (i + 1) * binSize).toFixed(2),
      count: 0,
    }));

    data.forEach((d) => {
      const binIndex = Math.floor((d - xMin) / binSize);
      if (binIndex >= 0 && binIndex < binCount) {
        bins[binIndex].count++;
      }
    });
    const yScale = scaleLinear({
      domain: [0, Math.max(...bins.map((bin) => bin.count))],
      range: [height - margin.bottom, margin.top],
    });
    return (
      <Tooltip
        label={
          <Box>
            {name !== "all" && <Box>Range: {name}</Box>}
            <Box>Count: {count}</Box>
          </Box>
        }
      >
        <Box display="flex" justifyContent="center" alignItems="center">
          <svg width={width} height={height}>
            {bins.map((bin, i) => (
              <Bar
                key={i}
                x={xScale(Number(bin.x0))}
                y={yScale(Number(bin.count))}
                width={xScale(Number(bin.x1)) - xScale(Number(bin.x0)) - 1}
                height={height - margin.bottom - yScale(Number(bin.count))}
                fill={
                  name ===
                    `${Math.floor(Number(bin.x0))} ~ ${Math.floor(
                      Number(bin.x1)
                    )}` || name === "all"
                    ? "#48BB78"
                    : "gray"
                }
              />
            ))}
          </svg>
        </Box>
      </Tooltip>
    );
  } else if (type === "boolean") {
    const bins = Array.from({ length: binCount }, (_, i) => ({
      x0: i,
      x1: i + 1,
      count: 0,
    }));
    const xScale = scaleBand({
      domain: bins.map((bin) => bin.x0),
      range: [margin.left, width - margin.right],
      padding: 0.1,
    });

    data.forEach((d) => {
      const binIndex = d ? 1 : 0;
      bins[binIndex].count++;
    });

    const yScale = scaleLinear({
      domain: [0, maxCount],
      range: [height - margin.bottom, margin.top],
    });

    if (name !== "all") {
      console.log("name: ", name);
    }

    const flag = name === "true" ? 1 : 0;

    return (
      <Tooltip
        label={
          name === "all" ? (
            <>
              <Box>True: {bins[1].count}</Box>
              <Box>False: {bins[0].count}</Box>
            </>
          ) : flag === 1 ? (
            <Box>True: {bins[1].count}</Box>
          ) : (
            <Box>False: {bins[0].count}</Box>
          )
        }
      >
        <Box display="flex" justifyContent="center" alignItems="center">
          <svg width={width} height={height}>
            {bins.map((bin, i) => (
              <Bar
                key={i}
                x={xScale(bin.x0)}
                y={yScale(Number(bin.count))}
                width={xScale.bandwidth()}
                height={height - margin.bottom - yScale(Number(bin.count))}
                stroke="gray"
                fill={name === "all" || flag === bin.x0 ? "gray" : "white"}
              />
            ))}
            <AxisBottom
              scale={xScale}
              top={height - margin.bottom}
              // tickFormat={(value) => (value === 0 ? "false" : "true")}
            />
          </svg>
        </Box>
      </Tooltip>
    );
  }
};

export default CustomBoxPlot;

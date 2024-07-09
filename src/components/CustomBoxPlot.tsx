import { Box, Tooltip } from "@chakra-ui/react";
import { scaleBand, scaleLinear, scaleOrdinal } from "@visx/scale";
import { Bar } from "@visx/shape";
import { schemeCategory10, schemeSet1 } from "d3";

interface BoxPlotProps {
  data: number[];
  name: string;
  count: number;
  binCount: number;
  keys: string[];
  type: string;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

const CustomBoxPlot = ({
  data,
  name,
  count,
  binCount = 3,
  keys = [],
  type,
  width = 50,
  height = 40,
  margin = { top: 2, right: 2, bottom: 10, left: 4 },
}: BoxPlotProps) => {
  if (type === "numerical") {
    const isInteger = data.every(Number.isInteger);
    const isSame = data.every((val, i, arr) => val === arr[0]);
    const xMin = Math.min(...data);
    const xMax =
      isInteger && isSame ? xMin + 10 : isSame ? xMin + 0.5 : Math.max(...data);

    const xScale = scaleLinear({
      domain: [xMin, xMax],
      range: [margin.left, width - margin.right],
      nice: true,
    });

    const [niceXMin, niceXMax] = xScale.domain();
    const xRange = niceXMax - niceXMin;
    const binSize = xRange / binCount;

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
      } else if (d === xMax) bins[binCount - 1].count++;
    });

    // if (hpName === "metric") console.log(bins);

    const yScale = scaleLinear({
      domain: [0, Math.max(...bins.map((bin) => bin.count))],
      range: [height - margin.bottom, margin.top],
    });

    return (
      <Tooltip
        label={
          <Box>
            {name === "all" ? (
              <>
                <Box>All: {count}</Box>
                {bins.map((bin) => (
                  <Box>
                    {bin.x0} ~ {bin.x1}: {bin.count}
                  </Box>
                ))}
              </>
            ) : (
              <Box>
                {name}:{" "}
                {bins.find((bin) => `${bin.x0} ~ ${bin.x1}` === name)?.count}
              </Box>
            )}
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
                fill={"#48BB78"}
                opacity={
                  name === `${bin.x0} ~ ${bin.x1}` || name === "all" ? 1 : 0.5
                }
              />
            ))}
          </svg>
        </Box>
      </Tooltip>
    );
  } else if (type === "boolean") {
    // const allBins = Array.from({ length: 2 }, (_, i) => ({
    //   x0: i,
    //   x1: i + 1,
    //   count: 0,
    // }));
    // exp?.trials.map((trial) => {
    //   trial.params[hpName] ? allBins[1].count++ : allBins[0].count++;
    // });
    // const maxCount = Math.max(...allBins.map((bin) => bin.count));

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
      domain: [0, Math.max(...bins.map((bin) => bin.count))],
      range: [height - margin.bottom, margin.top],
    });

    const flag = name === "true" ? 1 : 0;

    return (
      <Tooltip
        label={
          name === "all" ? (
            <>
              <Box>All: {count}</Box>
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
                // fill={name === "all" || flag === bin.x0 ? "gray" : "white"}
                fill={"gray"}
                opacity={
                  name === "all" || flag === bin.x0 || name === "all" ? 1 : 0.5
                }
              />
            ))}
          </svg>
        </Box>
      </Tooltip>
    );
  } else if (type === "categorical") {
    const count = data.reduce((acc, cur) => {
      acc[cur] = (acc[cur] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // const keys = Object.keys(count).sort();

    const bins = keys.map((key, i) => ({
      x0: key,
      x1: key,
      count: count[key] ? count[key] : 0,
    }));

    const xScale = scaleBand({
      domain: bins.map((bin) => bin.x0),
      range: [margin.left, width - margin.right],
      padding: 0.1,
    });

    const yScale = scaleLinear({
      domain: [0, Math.max(...bins.map((bin) => bin.count))],
      range: [height - margin.bottom, margin.top],
    });
    const colorScale = scaleOrdinal({
      domain: keys.map((_, i) => i),
      range: schemeCategory10,
    });
    return (
      <Tooltip
        label={
          name === "all" ? (
            <>
              <Box>All: {data.length}</Box>
              {bins.map((bin) => {
                if (bin.count > 0) {
                  return (
                    <Box>
                      {bin.x0}: {bin.count}
                    </Box>
                  );
                }
              })}
            </>
          ) : (
            <Box>
              {name}: {count[name]}
            </Box>
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
                fill={name === "all" ? colorScale(i) : colorScale(i)}
                opacity={name === "all" || name === bin.x0 ? 1 : 0.5}
              />
            ))}
          </svg>
        </Box>
      </Tooltip>
    );
  }
};

export default CustomBoxPlot;

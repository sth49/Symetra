import React from "react";
import { Group } from "@visx/group";
import genBins, { Bin, Bins } from "@visx/mock-data/lib/generators/genBins";
import { scaleLinear } from "@visx/scale";
import { HeatmapCircle, HeatmapRect } from "@visx/heatmap";
import { getSeededRandom } from "@visx/mock-data";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { useCustomStore } from "../store";

const hot1 = "#77312f";
const hot2 = "#f33d15";
const cool1 = "#122549";
const cool2 = "#b4fbde";
export const background = "#e9e8ed";

const defaultMargin = { top: 10, left: 45, right: 10, bottom: 50 };

export type HeatmapProps = {
  correlationMatrix: { [key: string]: { [key: string]: number } };
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  events?: boolean;
};
function CorrelationHeatmap({
  correlationMatrix,
  width = 700,
  height = 700,
  events = false,
  margin = defaultMargin,
}: HeatmapProps) {
  console.log("CorrelationHeatmap");

  if (!correlationMatrix || Object.keys(correlationMatrix).length === 0) {
    return <div>No data available</div>;
  }

  const { hyperparams } = useCustomStore();

  const params = Object.keys(correlationMatrix);

  const binData = params.map((p1, i) => {
    return {
      bin: i,
      bins: params.map((p2, j) => {
        return {
          bin: j,
          count: correlationMatrix[p1][p2]
            ? correlationMatrix[p1][p2]
            : correlationMatrix[p2][p1]
            ? correlationMatrix[p2][p1]
            : 0,
        };
      }),
    };
  });

  console.log(correlationMatrix["zero-seed-extension"]["watchdog"]);

  console.log("binData", binData);
  function max<Datum>(data: Datum[], value: (d: Datum) => number): number {
    return Math.max(...data.map(value));
  }

  function min<Datum>(data: Datum[], value: (d: Datum) => number): number {
    return Math.min(...data.map(value));
  }

  // accessors
  const bins = (d: Bins) => d.bins;
  const count = (d: Bin) => d.count;

  const colorMax = Math.max(
    ...Object.values(correlationMatrix).flatMap((row) =>
      Object.values(row).map(Math.abs)
    )
  );

  const colorMin = Math.min(
    ...Object.values(correlationMatrix).flatMap((row) =>
      Object.values(row).map(Math.abs)
    )
  );
  const bucketSizeMax = Math.max(
    ...Object.values(correlationMatrix).map((row) => Object.keys(row).length)
  );

  // scales
  const xScale = scaleLinear<number>({
    domain: [0, binData.length],
  });
  const yScale = scaleLinear<number>({
    domain: [0, bucketSizeMax],
  });
  const circleColorScale = scaleLinear<string>({
    range: ["blue", "white", "red"],
    domain: [-colorMax, 0, colorMax],
  });

  const opacityScale = scaleLinear<number>({
    range: [0.1, 1],
    domain: [0, colorMax],
    clamp: true,
  });

  // bounds
  const size =
    width > margin.left + margin.right
      ? width - margin.left - margin.right
      : width;
  const xMax = size;
  const yMax = height - margin.bottom - margin.top;

  const binWidth = xMax / binData.length;
  const binHeight = yMax / bucketSizeMax;
  const radius = min([binWidth, binHeight], (d) => d) / 2;

  xScale.range([0, xMax]);
  yScale.range([0, yMax]);

  return width < 10 ? null : (
    <svg width={width} height={height}>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={14}
        fill={background}
      />
      <Group top={margin.top} left={margin.left}>
        <HeatmapCircle
          data={binData}
          xScale={(d) => xScale(d) ?? 0}
          yScale={(d) => yScale(d) ?? 0}
          colorScale={(d) => circleColorScale(d)}
          radius={radius}
          gap={2}
        >
          {(heatmap) =>
            heatmap.map((heatmapBins) =>
              heatmapBins.map((bin) => {
                // console.log(bin);
                return (
                  <circle
                    key={`heatmap-circle-${bin.row}-${bin.column}`}
                    className="visx-heatmap-circle"
                    cx={bin.cx}
                    cy={bin.cy}
                    r={bin.r}
                    fill={circleColorScale(bin.count)}
                  />
                );
              })
            )
          }
        </HeatmapCircle>
        <AxisLeft
          scale={yScale}
          tickValues={params.map((_, i) => i)}
          tickFormat={(i) =>
            hyperparams.find((h) => h.name === params[i])?.displayName
          }
          stroke="#333"
          tickStroke="#333"
          hideAxisLine
          hideTicks
          tickLabelProps={() => ({
            fill: "#333",
            fontSize: 10,
            textAnchor: "end",
            dy: "0.9em",
            dx: "0.5em",
          })}
        />
        <AxisBottom
          top={yMax}
          scale={xScale}
          tickValues={params.map((_, i) => i)}
          tickFormat={(i) =>
            hyperparams.find((h) => h.name === params[i])?.displayName
          }
          stroke="#333"
          tickStroke="#333"
          hideAxisLine
          hideTicks
          tickLabelProps={() => ({
            fill: "#333",
            fontSize: 10,
            textAnchor: "end",
            dy: "-1.2em",
            dx: "0.7em",
            angle: -90,
          })}
        />
      </Group>
      {/* <Group top={margin.top} left={xMax + margin.left + separation}>
        <HeatmapRect
          data={binData}
          xScale={(d) => xScale(d) ?? 0}
          yScale={(d) => yScale(d) ?? 0}
          colorScale={rectColorScale}
          opacityScale={opacityScale}
          binWidth={binWidth}
          binHeight={binWidth}
          gap={2}
        >
          {(heatmap) =>
            heatmap.map((heatmapBins) =>
              heatmapBins.map((bin) => (
                <rect
                  key={`heatmap-rect-${bin.row}-${bin.column}`}
                  className="visx-heatmap-rect"
                  width={bin.width}
                  height={bin.height}
                  x={bin.x}
                  y={bin.y}
                  fill={bin.color}
                  fillOpacity={bin.opacity}
                  onClick={() => {
                    if (!events) return;
                    const { row, column } = bin;
                    alert(JSON.stringify({ row, column, bin: bin.bin }));
                  }}
                />
              ))
            )
          }
        </HeatmapRect>
      </Group> */}
    </svg>
  );
}

export default CorrelationHeatmap;

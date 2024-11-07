import { useMemo } from "react";
import { Group } from "@visx/group";
import { Bin, Bins } from "@visx/mock-data/lib/generators/genBins";
import { scaleLinear } from "@visx/scale";
import { HeatmapRect } from "@visx/heatmap";
import { useTooltipInPortal } from "@visx/tooltip";
import { AxisBottom, AxisLeft } from "@visx/axis";
import * as d3 from "d3";
import { ParentSize } from "@visx/responsive";

interface HeatmapBaseProps {
  result: any;
  width?: number;
  height?: number;
}

const HeatmapBase = ({ result, width = 0, height = 0 }: HeatmapBaseProps) => {
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  });

  const binData = useMemo(() => {
    return result && result.value.value.bins;
  }, [result]);

  function max<Datum>(data: Datum[], value: (d: Datum) => number): number {
    return Math.max(...data.map(value));
  }

  function min<Datum>(data: Datum[], value: (d: Datum) => number): number {
    return Math.min(...data.map(value));
  }

  const bins = (d: Bins) => d.bins;
  const count = (d: Bin) => d.count;

  const colorMax = max(binData, (d) => max(bins(d), count));
  const bucketSizeMax = max(binData, (d) => bins(d).length);

  const margin = { top: 10, right: 10, bottom: 40, left: 50 };

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // 스케일 수정
  const xScale = scaleLinear<number>({
    domain: [0, 2.0], // x축 범위를 0에서 2.0으로 수정
    range: [0, xMax],
  });

  const yScale = scaleLinear<number>({
    domain: [0, bucketSizeMax],
    range: [0, yMax], // y축 방향 수정
  });

  const colorScale = d3
    .scaleSequential(d3.interpolateBlues)
    .domain([0, colorMax]);

  const opacityScale = scaleLinear<number>({
    range: [0.1, 1],
    domain: [0, colorMax],
  });

  const binWidth = xMax / binData.length;
  const binHeight = yMax / bucketSizeMax;

  return (
    <div ref={containerRef} className="relative">
      <svg width={width} height={height} className="overflow-visible">
        <Group left={margin.left} top={margin.top}>
          <HeatmapRect
            data={binData}
            xScale={xScale}
            yScale={yScale}
            colorScale={colorScale}
            opacityScale={opacityScale}
            binWidth={binWidth}
            binHeight={binHeight}
            gap={0} // gap을 0으로 설정하여 히트맵 셀 사이의 간격 제거
          >
            {(heatmap) =>
              heatmap.map((heatmapBins) =>
                heatmapBins.map((bin, i) => {
                  return (
                    <g key={i}>
                      <rect
                        key={`heatmap-rect-${bin.row}-${bin.column}`}
                        className="visx-heatmap-rect"
                        width={bin.width}
                        height={Math.max(0, bin.height)} // height 값을 0 이상으로 설정
                        x={bin.x}
                        y={bin.y}
                        fill={bin.color}
                        fillOpacity={bin.opacity}
                      />
                      <text
                        x={bin.x + bin.width / 2}
                        y={bin.y + bin.height / 2}
                        fontSize={12}
                        textAnchor="middle"
                        dy=".33em"
                        fill={colorMax / 2 < bin.count ? "white" : "black"}
                      >
                        {bin.count}
                      </text>
                    </g>
                  );
                })
              )
            }
          </HeatmapRect>
          <AxisBottom
            scale={xScale}
            top={yMax}
            tickFormat={(value) => {
              if (value === 0.5) return "T";
              if (value === 1.5) return "F";
              return "";
            }}
            numTicks={5}
            // label="X Axis"
            label={result.value.hp.hp1.displayName}
            hideAxisLine
            hideTicks
          />
          <AxisLeft
            scale={yScale}
            numTicks={4}
            hideAxisLine
            hideTicks
            label={result.value.hp.hp2.displayName}
            labelOffset={15}
            tickFormat={(value) => {
              if (value === 0.5) return "T";
              if (value === 1.5) return "F";
              return "";
            }}
          />
        </Group>
      </svg>
    </div>
  );
};

const Heatmap = (props: HeatmapBaseProps) => {
  return (
    <ParentSize>
      {({ width, height }) => (
        <HeatmapBase {...props} width={width} height={height} />
      )}
    </ParentSize>
  );
};

export default Heatmap;

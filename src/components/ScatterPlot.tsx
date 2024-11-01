import { Circle } from "@visx/shape";
import { Group } from "@visx/group";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { scaleLinear, scaleBand } from "@visx/scale";
import { formatting } from "../model/utils";
import { useMemo } from "react";
import { extent } from "d3";
import { useTooltip, useTooltipInPortal } from "@visx/tooltip";
import { localPoint } from "@visx/event";

interface ScatterPlotProps {
  result: any;
}

interface TooltipData {
  val1: number | boolean;
  val2: number;
  hp1: { displayName: string };
  hp2: { displayName: string };
}

const ScatterPlot = ({ result }: ScatterPlotProps) => {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<TooltipData>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  });

  const handleMouseOver = (
    event: React.MouseEvent<SVGCircleElement>,
    datum: TooltipData
  ) => {
    const coords = localPoint(
      (event.target as SVGElement).ownerSVGElement,
      event
    );
    showTooltip({
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
      tooltipData: datum,
    });
  };

  const width = 250;
  const height = 130;
  const margin = { top: 10, right: 10, bottom: 35, left: 50 };

  const x = (d) => d.val1;
  const y = (d) => d.val2;

  const data = useMemo(() => {
    return (
      (result &&
        result.value.value.val1.map((val1, i) => {
          return {
            val1: val1,
            val2: result.value.value.val2[i],
            hp1: result.value.hp.hp1,
            hp2: result.value.hp.hp2,
          };
        })) ||
      []
    );
  }, [result]);

  const xScale = useMemo(() => {
    if (result.value.type === "pearson") {
      return scaleLinear({
        range: [0, width - margin.left - margin.right],
        domain: extent(data, x),
        nice: true,
      });
    } else {
      // Boolean 값을 위한 scaleBand 설정
      const booleanScale = scaleBand({
        range: [0, width - margin.left - margin.right],
        domain: [true, false], // 도메인 순서를 [true, false]로 변경
        padding: 0.4,
      });

      // getCenterValue 함수 추가
      booleanScale.getCenterValue = (value: boolean) => {
        const bandWidth = booleanScale.bandwidth();
        const start = booleanScale(value);
        return start + bandWidth / 2;
      };

      return booleanScale;
    }
  }, [result]);

  const yScale = useMemo(() => {
    return scaleLinear({
      range: [height - margin.top - margin.bottom, 0],
      domain: extent(data, y),
      nice: true,
    });
  }, [result]);

  return (
    <div ref={containerRef}>
      <svg width={width} height={height}>
        <rect width={width} height={height} fill="#E2E8F0" rx={14} />
        <Group
          transform={`translate(${margin.left}, ${margin.top})`}
          width={width - margin.left - margin.right}
          height={height - margin.top - margin.bottom}
        >
          <rect
            width={width - margin.left - margin.right}
            height={height - margin.top - margin.bottom}
            fill="#F7FAFC"
          />
          <AxisBottom
            scale={xScale}
            label={result.value.hp.hp1.displayName}
            top={height - margin.bottom - margin.top}
            labelOffset={3}
            numTicks={2}
            labelProps={{
              fontSize: 10,
              textAnchor: "middle",
            }}
            tickFormat={(value) => {
              if (result.value.type === "pearson") {
                return value.toString();
              } else {
                return value ? "True" : "False";
              }
            }}
          />
          <AxisLeft
            scale={yScale}
            label={result.value.hp.hp2.displayName}
            numTicks={2}
            labelOffset={23}
            labelProps={{
              fontSize: 10,
              textAnchor: "middle",
              transform: "rotate(-90)",
            }}
          />
          {data.map((point, i) => (
            <Circle
              key={i}
              cx={
                result.value.type === "pearson"
                  ? xScale(point.val1)
                  : (xScale as any).getCenterValue(point.val1)
              }
              cy={yScale(point.val2)}
              r={3}
              fill={tooltipData === point ? "#FF0066" : "#0070f3"}
              fillOpacity={0.8}
              opacity={tooltipData === point ? 1 : 0.5}
              onMouseEnter={(event) => handleMouseOver(event, point)}
              onMouseLeave={hideTooltip}
              className="cursor-pointer transition-opacity duration-200"
            />
          ))}
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <TooltipInPortal
          key={Math.random()}
          top={tooltipTop}
          left={tooltipLeft}
          className="bg-white p-2 rounded shadow-lg text-sm"
        >
          <div className="font-semibold text-gray-800">Data Point</div>
          <div className="text-gray-600">
            {tooltipData.hp1.displayName}:{" "}
            {typeof tooltipData.val1 === "boolean"
              ? tooltipData.val1
                ? "True"
                : "False"
              : formatting(tooltipData.val1 as number, "float")}
          </div>
          <div className="text-gray-600">
            {tooltipData.hp2.displayName}:{" "}
            {formatting(tooltipData.val2, "float")}
          </div>
        </TooltipInPortal>
      )}
    </div>
  );
};

export default ScatterPlot;

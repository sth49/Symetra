import { Circle } from "@visx/shape";
import { Group } from "@visx/group";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { scaleLinear, scaleBand } from "@visx/scale";
import { formatting } from "../model/utils";
import { useMemo } from "react";
import { extent } from "d3";
import { useTooltip, useTooltipInPortal } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { ParentSize } from "@visx/responsive";

interface ScatterPlotBaseProps {
  result: {
    value: {
      type: string;
      value: {
        val1: (number | boolean)[];
        val2: number[];
      };
      hp: {
        hp1: { displayName: string };
        hp2: { displayName: string };
      };
    };
  };
  width?: number;
  height?: number;
}

interface TooltipData {
  val1: number | boolean;
  val2: number;
  hp1: { displayName: string };
  hp2: { displayName: string };
}

const ScatterPlotBase = ({ result, width, height }: ScatterPlotBaseProps) => {
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

  const margin = { top: 10, right: 10, bottom: 35, left: 50 };

  const x = (d: TooltipData) => d.val1;
  const y = (d: TooltipData) => d.val2;

  const data = useMemo(() => {
    return result.value.value.val1.map((val1, i) => ({
      val1,
      val2: result.value.value.val2[i],
      hp1: result.value.hp.hp1,
      hp2: result.value.hp.hp2,
    }));
  }, [result]);

  const xScale = useMemo(() => {
    if (result.value.type === "pearson") {
      return scaleLinear<number>({
        range: [0, width - margin.left - margin.right],
        domain: extent(data, x) as [number, number],
        nice: true,
      });
    } else {
      const booleanScale = scaleBand<boolean>({
        range: [0, width - margin.left - margin.right],
        domain: [true, false],
        padding: 0.4,
      });

      (booleanScale as any).getCenterValue = (value: boolean) => {
        const bandWidth = booleanScale.bandwidth();
        const start = booleanScale(value);
        return start + bandWidth / 2;
      };

      return booleanScale;
    }
  }, [result, width]);

  const yScale = useMemo(() => {
    return scaleLinear<number>({
      range: [height - margin.top - margin.bottom, 0],
      domain: extent(data, y) as [number, number],
      nice: true,
    });
  }, [result, height]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg width={width} height={height}>
        {/* <rect width={width} height={height} fill="#ffffff" rx={14} /> */}
        <Group
          transform={`translate(${margin.left}, ${margin.top})`}
          width={width - margin.left - margin.right}
          height={height - margin.top - margin.bottom}
        >
          <rect
            width={width - margin.left - margin.right}
            height={height - margin.top - margin.bottom}
            fill="#ffffff"
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
            // tickFormat={(value) => {
            //   if (result.value.type === "pearson") {
            //     return value.toString();
            //   } else {
            //     return value ? "True" : "False";
            //   }
            // }}
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
                  ? xScale(point.val1 as number)
                  : (xScale as any).getCenterValue(point.val1 as boolean)
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

const ScatterPlot = (props: ScatterPlotBaseProps) => {
  return (
    <ParentSize>
      {({ width, height }) => (
        <ScatterPlotBase {...props} width={width} height={height} />
      )}
    </ParentSize>
  );
};

export default ScatterPlot;

import { Box, Text } from "@chakra-ui/react";
import { scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import { useTooltip, useTooltipInPortal } from "@visx/tooltip";
import { formatting } from "../model/utils";
import { useConstDataStore } from "./store/constDataStore";
import { useMetricScale } from "../model/colorScale";
import { ParentSize } from "@visx/responsive";

type TooltipData = {
  key: string; // hparam name
  value: string; // hparam value
  count: number; // trial count
};

interface BranchBarChartProps {
  hparamKey: any;
  hparamValue: any;
  trialIds: number[];
  width?: number;
  height?: number;
}

const BranchBarChart = ({
  hparamKey,
  hparamValue,
  trialIds = [],
  width = 100,
  height = 30,
}: BranchBarChartProps) => {
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<TooltipData>();

  // console.log("hparamKey, hparamValue:", hparamKey, hparamValue);
  const margin = { top: 2, right: 1, bottom: 5, left: 15 };

  const { TooltipInPortal } = useTooltipInPortal({
    scroll: true,
  });

  const { exp } = useConstDataStore();

  const data = exp?.trials.map((trial) => trial.metric);

  const selectedData =
    trialIds.length > 0
      ? trialIds.map(
          (id) => exp?.trials.find((trial) => trial.id === id)?.metric
        )
      : [];

  console.log("selectedData:", selectedData);

  const binCount = 10;
  const isInteger = data.every(Number.isInteger);
  const isSame = data.every((val, i, arr) => val === arr[0]);
  const xMin = Math.min(...(data as number[]));
  const xMax =
    isInteger && isSame
      ? xMin + 10
      : isSame
      ? xMin + 0.5
      : Math.max(...(data as number[]));

  const xScale = scaleLinear({
    domain: [xMin, xMax],
    range: [margin.left, width - margin.right],
    nice: true,
  });

  const [niceXMin, niceXMax] = xScale.domain();
  const { metricScale, colorScale } = useMetricScale();
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

  selectedData.forEach((d) => {
    const binIndex = Math.floor((d - xMin) / binSize);
    if (binIndex >= 0 && binIndex < binCount) {
      bins[binIndex].count++;
    } else if (d === xMax) bins[binCount - 1].count++;
  });

  const yScale = scaleLinear({
    domain: [0, Math.max(...bins.map((bin) => bin.count))],
    range: [height - margin.bottom, margin.top],
  });

  return (
    <ParentSize>
      {({ width: parentWidth, height: parentHeight }) => (
        <Box display="flex" justifyContent="center" alignItems="center">
          <svg width={parentWidth} height={parentHeight}>
            {bins.map((bin, i) => (
              <g key={i}>
                <Bar
                  x={xScale(Number(bin.x0))}
                  y={yScale(Number(bin.count))}
                  width={xScale(Number(bin.x1)) - xScale(Number(bin.x0)) - 1}
                  height={Math.max(
                    0,
                    parentHeight - margin.bottom - yScale(Number(bin.count))
                  )}
                  fill={colorScale(metricScale(Number(bin.x0)))}
                />
                <Bar
                  x={xScale(Number(bin.x0))}
                  width={xScale(Number(bin.x1)) - xScale(Number(bin.x0)) - 1}
                  height={parentHeight}
                  fill={"transparent"}
                  onMouseMove={(event) => {
                    showTooltip({
                      tooltipData: {
                        key: "Coverage",
                        value: `${formatting(
                          Number(bin.x0),
                          isInteger ? "int" : "float"
                        )} ~ ${formatting(
                          Number(bin.x1),
                          isInteger ? "int" : "float"
                        )}`,
                        count: bin.count,
                      },
                      tooltipLeft: event.clientX,
                      tooltipTop: event.clientY,
                    });
                  }}
                  onMouseLeave={hideTooltip}
                />
              </g>
            ))}
          </svg>
          {tooltipOpen && tooltipData && (
            <TooltipInPortal top={tooltipTop} left={tooltipLeft}>
              <Box>
                <Text fontWeight={"bold"} align={"left"} mb={2}>
                  {tooltipData.key} = {tooltipData.value}
                </Text>
                <Text fontWeight={"bold"} align={"left"} mb={2}>
                  {hparamKey} = {hparamValue}
                </Text>
                <Text align={"left"} mb={"2px"}>
                  {formatting(tooltipData.count, "int")} trials
                </Text>
              </Box>
            </TooltipInPortal>
          )}
        </Box>
      )}
    </ParentSize>
  );
};

export default BranchBarChart;

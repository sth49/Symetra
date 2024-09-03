import { Box, Text } from "@chakra-ui/react";
import { scaleBand, scaleLinear, scaleOrdinal } from "@visx/scale";
import { Bar } from "@visx/shape";
import { useCustomStore } from "../store";
import {
  BinaryHyperparam,
  ContinuousHyperparam,
  // DiscreteHyperparam,
  NominalHyperparam,
  OrdinalHyperparam,
} from "../model/hyperparam";

import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";
import { Pattern, PatternLines } from "@visx/pattern";
import { schemeCategory10 } from "d3";
import { scaleLog } from "@visx/vendor/d3-scale";
type TooltipData = {
  key: string; // hparam name
  value: any; // hparam value
  count: number; // trial count
};

interface BarChartProps {
  dist: string;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

const BarChart = ({
  dist,
  width = 50,
  height = 40,
  margin = { top: 2, right: 2, bottom: 2, left: 2 },
}: BarChartProps) => {
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<TooltipData>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    // TooltipInPortal is rendered in a separate child of <body /> and positioned
    // with page coordinates which should be updated on scroll. consider using
    // Tooltip or TooltipWithBounds if you don't need to render inside a Portal
    scroll: true,
  });

  const { exp, hyperparams, setClickedHparamValue, clickedHparamValue } =
    useCustomStore();

  const data = exp?.trials.map((trial) => trial.params[dist]);
  const hparam = hyperparams.find((hparam) => hparam.name === dist);
  //   console.log(data);
  //   console.log(hparam?.name);

  if (
    hparam instanceof BinaryHyperparam ||
    hparam instanceof NominalHyperparam ||
    hparam instanceof OrdinalHyperparam
  ) {
    const keys = Array.from(new Set(hparam.values)).sort(
      hparam instanceof OrdinalHyperparam
        ? (a, b) => Number(a) - Number(b)
        : undefined
    );
    const count = data.reduce((acc, cur) => {
      acc[cur] = (acc[cur] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

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

    // data?.forEach((d) => {
    //   const binIndex = d ? 1 : 0;
    //   bins[binIndex].count++;
    // });

    const yScale = scaleLinear({
      domain: [0, Math.max(...bins.map((bin) => bin.count))],
      range: [height - margin.bottom, margin.top],
      clamp: true,
    });

    // console
    const calculateOverlayBins = () => {
      if (!clickedHparamValue) return [];

      return keys.map((key) => {
        const relevantTrials = exp?.trials.filter(
          (trial) => trial.params[dist] === key
        );
        const overlayCount =
          relevantTrials?.filter((trial) =>
            clickedHparamValue.value.length === 1
              ? trial.params[clickedHparamValue.name] ===
                clickedHparamValue.value[0]
              : clickedHparamValue.value[0] <=
                  trial.params[clickedHparamValue.name] &&
                trial.params[clickedHparamValue.name] <
                  clickedHparamValue.value[1]
          ).length || 0;
        return {
          x0: key,
          x1: key,
          count: overlayCount,
        };
      });
    };
    const bins2 = calculateOverlayBins();
    // const colorScale = scaleOrdinal({
    //   domain: keys.map((_, i) => i),
    //   range: schemeCategory10,
    // });

    return (
      <Box display="flex" justifyContent="center" alignItems="center">
        <svg width={width} height={height}>
          {bins.map((bin, i) => (
            <>
              <Bar
                key={i + 3}
                x={xScale(bin.x0)}
                y={yScale(Number(bin.count))}
                width={xScale.bandwidth()}
                height={height - margin.bottom - yScale(Number(bin.count))}
                // fill={colorScale(i)}
                fill={hparam.getColorByValue(bin.x0)}
                opacity={1}
              />
              <Bar
                x={xScale(bin.x0)}
                width={xScale.bandwidth()}
                height={height}
                fill={"transparent"}
                onMouseMove={(event) => {
                  showTooltip({
                    tooltipData: {
                      key: hparam.displayName,
                      value: bin.x0.toString(),
                      count: bin.count,
                    },
                    tooltipLeft: event.clientX,
                    tooltipTop: event.clientY,
                  });
                }}
                onMouseLeave={hideTooltip}
                onClick={(e) => {
                  e.stopPropagation();
                  if (clickedHparamValue?.name === dist) {
                    if (clickedHparamValue?.value[0] === bin.x0) {
                      setClickedHparamValue(null);
                    } else {
                      setClickedHparamValue({
                        name: dist,
                        value: [bin.x0],
                      });
                    }
                  } else {
                    setClickedHparamValue({
                      name: dist,
                      value: [bin.x0],
                    });
                  }
                }}
              />
            </>
          ))}
          {bins2.map((bin, i) => (
            <Bar
              onClick={(e) => {
                e.stopPropagation();
                console.log("1");
                if (clickedHparamValue?.name === dist) {
                  if (clickedHparamValue?.value[0] === bin.x0) {
                    setClickedHparamValue(null);
                  } else {
                    setClickedHparamValue({
                      name: dist,
                      value: [bin.x0],
                    });
                  }
                } else {
                  setClickedHparamValue({
                    name: dist,
                    value: [bin.x0],
                  });
                }
              }}
              key={i}
              x={xScale(bin.x0)}
              y={yScale(Number(bin.count))}
              width={xScale.bandwidth()}
              height={height - margin.bottom - yScale(Number(bin.count))}
              fill={"url(#pattern)"}
              opacity={1}
              stroke="#030f1b"
            />
          ))}
          <PatternLines
            id="pattern"
            height={5}
            width={5}
            stroke="#030f1b"
            strokeWidth={1}
            orientation={["diagonal"]}
          />
        </svg>
        {tooltipOpen && tooltipData && (
          <TooltipInPortal top={tooltipTop} left={tooltipLeft}>
            <Box>
              <Text fontWeight={"bold"} align={"center"}>
                {tooltipData.key} {tooltipData.value}
              </Text>
              <Text align={"center"}>{tooltipData.count} trials</Text>
            </Box>
          </TooltipInPortal>
        )}
      </Box>
    );
  } else if (hparam instanceof ContinuousHyperparam) {
    const binCount = 5;
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

    const calculateOverlayBins = () => {
      if (!clickedHparamValue) return [];

      return bins.map((bin) => {
        const relevantTrials = exp?.trials.filter(
          (trial) =>
            trial.params[dist] >= Number(bin.x0) &&
            trial.params[dist] < Number(bin.x1)
        );
        // const overlayCount =
        //   relevantTrials?.filter(
        //     (trial) =>
        //       trial.params[clickedHparamValue.name] === clickedHparamValue.value
        //   ).length || 0;
        const overlayCount =
          relevantTrials?.filter((trial) =>
            clickedHparamValue.value.length === 1
              ? trial.params[clickedHparamValue.name] ===
                clickedHparamValue.value[0]
              : clickedHparamValue.value[0] <=
                  trial.params[clickedHparamValue.name] &&
                trial.params[clickedHparamValue.name] <
                  clickedHparamValue.value[1]
          ).length || 0;
        return {
          x0: bin.x0,
          x1: bin.x1,
          count: overlayCount,
        };
      });
    };
    const bins2 = calculateOverlayBins();
    // if (hparam.displayName === "MSAS") {
    //   console.log("sf");
    //   console.log(bins);
    //   console.log(bins2);
    // }
    return (
      <Box display="flex" justifyContent="center" alignItems="center">
        <svg width={width} height={height}>
          {bins.map((bin, i) => (
            <>
              <Bar
                key={i}
                x={xScale(Number(bin.x0))}
                y={yScale(Number(bin.count))}
                width={xScale(Number(bin.x1)) - xScale(Number(bin.x0)) - 1}
                height={height - margin.bottom - yScale(Number(bin.count))}
                // fill={"#48BB78"}
                fill={hparam.getColorByValue(
                  Number(bin.x1) - Number(bin.x0) / 2
                )}
              />
              <Bar
                x={xScale(Number(bin.x0))}
                width={xScale(Number(bin.x1)) - xScale(Number(bin.x0)) - 1}
                height={height}
                fill={"transparent"}
                onMouseMove={(event) => {
                  showTooltip({
                    tooltipData: {
                      key: hparam.displayName,
                      value: `${bin.x0} - ${bin.x1}`,
                      count: bin.count,
                    },
                    tooltipLeft: event.clientX,
                    tooltipTop: event.clientY,
                  });
                }}
                onMouseLeave={hideTooltip}
                onClick={(e) => {
                  e.stopPropagation();
                  if (clickedHparamValue?.name === dist) {
                    if (clickedHparamValue?.value[0] === bin.x0) {
                      setClickedHparamValue(null);
                    } else {
                      setClickedHparamValue({
                        name: dist,
                        value: [bin.x0, bin.x1],
                      });
                    }
                  } else {
                    setClickedHparamValue({
                      name: dist,
                      value: [bin.x0, bin.x1],
                    });
                  }
                }}
              />
            </>
          ))}
          {bins2.map((bin, i) => (
            <Bar
              key={i}
              x={xScale(Number(bin.x0))}
              y={yScale(Number(bin.count))}
              width={xScale(Number(bin.x1)) - xScale(Number(bin.x0)) - 1}
              height={height - margin.bottom - yScale(Number(bin.count))}
              fill={"url(#pattern)"}
              opacity={1}
              stroke="#030f1b"
              onClick={(e) => {
                e.stopPropagation();
                if (clickedHparamValue?.name === dist) {
                  if (clickedHparamValue?.value[0] === bin.x0) {
                    setClickedHparamValue(null);
                  } else {
                    setClickedHparamValue({
                      name: dist,
                      value: [bin.x0, bin.x1],
                    });
                  }
                } else {
                  setClickedHparamValue({
                    name: dist,
                    value: [bin.x0, bin.x1],
                  });
                }
              }}
            />
          ))}
        </svg>
        {tooltipOpen && tooltipData && (
          <TooltipInPortal top={tooltipTop} left={tooltipLeft}>
            <Box>
              <Text fontWeight={"bold"} align={"center"}>
                {tooltipData.key} {tooltipData.value}
              </Text>
              <Text align={"center"}>{tooltipData.count} trials</Text>
            </Box>
          </TooltipInPortal>
        )}
      </Box>
    );
  }

  return <Box>{dist}</Box>;
};

export default BarChart;

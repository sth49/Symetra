import { Box, Text } from "@chakra-ui/react";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import { useCustomStore } from "../store";
import {
  BinaryHyperparam,
  ContinuousHyperparam,
  NominalHyperparam,
} from "../model/hyperparam";

import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";
import { PatternLines } from "@visx/pattern";
import { formatting } from "../model/utils";
import { useConstDataStore } from "./store/constDataStore";
import { ParentSize } from "@visx/responsive";

type TooltipData = {
  key: string; // hparam name
  value: string | number; // hparam value
  count: number; // trial count
};

const tooltipStyles = {
  ...defaultStyles,
  background: "rgba(0, 0, 0, 1)",
  color: "white",
  padding: "8px",
  borderRadius: "4px",
  zIndex: 1000,
};

interface BarChartProps {
  dist: string;
  trialIds: number[];
  viewType?: string;
  width: number;
  height: number;
  opacity?: number;
  isGroup?: boolean;
}
const BarChart = ({
  dist,
  trialIds,
  viewType,
  opacity,
  isGroup = false,
}: BarChartProps) => {
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<TooltipData>();
  const { TooltipInPortal } = useTooltipInPortal({
    scroll: true,
  });
  const { exp } = useConstDataStore();
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );
  const currentSelectedGroup2 = useCustomStore(
    (state) => state.currentSelectedGroup2
  );
  const setClickedHparamValue = useCustomStore(
    (state) => state.setClickedHparamValue
  );
  const clickedHparamValue = useCustomStore(
    (state) => state.clickedHparamValue
  );

  const margin = { top: 2, right: 2, bottom: 5, left: 2 };

  const hyperparams = exp?.hyperparams;

  const data =
    trialIds.length > 0
      ? trialIds.map(
          (id) => exp?.trials.find((trial) => trial.id === id)?.params[dist]
        )
      : exp?.trials.map((trial) => trial.params[dist]);
  const allData = exp?.trials.map((trial) => trial.params[dist]);
  const hparam = hyperparams.find((hparam) => hparam.name === dist);

  const handleBarClick = (binX0: string | number[]) => {
    if (viewType !== "hparam") return;
    if (clickedHparamValue?.name === dist) {
      if (
        (typeof binX0 === "string" && clickedHparamValue?.value[0] === binX0) ||
        (typeof binX0 !== "string" &&
          clickedHparamValue?.value[0] === binX0[0] &&
          clickedHparamValue?.value[1] === binX0[1])
      ) {
        setClickedHparamValue(null);
      } else {
        setClickedHparamValue({
          name: dist,
          displayName: hparam?.displayName,
          value: typeof binX0 === "string" ? [binX0] : binX0,
        });
      }
    } else {
      setClickedHparamValue({
        name: dist,
        displayName: hparam?.displayName,
        value: typeof binX0 === "string" ? [binX0] : binX0,
      });
    }
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ParentSize>
        {({ width, height }) => {
          if (
            hparam instanceof BinaryHyperparam ||
            hparam instanceof NominalHyperparam
          ) {
            const keys = Array.from(new Set(hparam.values)).sort();
            const count = data.reduce((acc: { [key: string]: number }, cur) => {
              acc[cur as keyof typeof acc] =
                (acc[cur as keyof typeof acc] || 0) + 1;
              return acc;
            }, {} as { [key: string]: number });

            const bins = keys.map((key) => ({
              x0: key,
              x1: key,
              count: count[key] ? count[key] : 0,
            }));

            const xScale = scaleBand({
              domain: bins.map((bin) => bin.x0),
              range: [0, width],
              padding: 0.02,
            });

            const yScale = scaleLinear({
              domain: [0, Math.max(...bins.map((bin) => bin.count))],
              range: [height - margin.bottom, margin.top],
            });

            const calculateOverlayBins = () => {
              if (!clickedHparamValue) return [];

              return keys.map((key) => {
                const relevantTrials = exp?.trials.filter(
                  (trial) => trial.params[dist] === key
                );
                const overlayCount =
                  relevantTrials?.filter((trial) =>
                    clickedHparamValue.value.length === 1
                      ? trial.params[clickedHparamValue.name].toString() ===
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

            return (
              <Box display="flex" justifyContent="center" alignItems="center">
                <svg width={width} height={height}>
                  {bins.map((bin, i) => (
                    <g key={i}>
                      <Bar
                        x={xScale(bin.x0)}
                        y={yScale(Number(bin.count))}
                        width={xScale.bandwidth() - 1}
                        height={Math.max(
                          0,
                          height - margin.bottom - yScale(Number(bin.count))
                        )}
                        // fill={hparam.getColorByValue(bin.x0)}
                        fill="#C4CFDB"
                        // opacity={1}
                        opacity={opacity}
                      />
                      <Bar
                        x={xScale(bin.x0)}
                        width={xScale.bandwidth()}
                        height={height}
                        fill={"transparent"}
                        onMouseMove={(event) => {
                          showTooltip({
                            tooltipData: {
                              key: `${
                                hparam.displayName
                              } = ${bin.x0.toString()}`,
                              value: "",
                              count: bin.count,
                            },
                            tooltipLeft: event.clientX,
                            tooltipTop: event.clientY,
                          });
                        }}
                        onMouseLeave={hideTooltip}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBarClick(bin.x0.toString());
                        }}
                      />
                    </g>
                  ))}
                  {viewType === "hparam" &&
                    bins2.map((bin, i) => (
                      <Bar
                        key={i}
                        x={xScale(bin.x0)}
                        y={yScale(Number(bin.count))}
                        width={xScale.bandwidth() - 1}
                        height={Math.max(
                          0,
                          height - margin.bottom - yScale(Number(bin.count))
                        )}
                        fill={"url(#pattern)"}
                        opacity={1}
                        stroke="#030f1b"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBarClick(bin.x0);
                        }}
                        onMouseMove={(event) => {
                          showTooltip({
                            tooltipData: {
                              key: `${
                                hparam.displayName
                              } = ${bin.x0.toString()} & ${
                                clickedHparamValue.displayName
                              } = ${
                                typeof clickedHparamValue.value[0] === "string"
                                  ? clickedHparamValue.value[0]
                                  : `${clickedHparamValue.value[0]} ~ ${clickedHparamValue.value[1]}`
                              }`,
                              value: "",
                              count: bin.count,
                            },
                            tooltipLeft: event.clientX,
                            tooltipTop: event.clientY,
                          });
                        }}
                        onMouseLeave={hideTooltip}
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
                  <TooltipInPortal
                    top={tooltipTop}
                    left={tooltipLeft}
                    style={tooltipStyles}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        borderBottom: "1px solid white",
                        paddingBottom: "4px",
                        marginBottom: "4px",
                      }}
                    >
                      {tooltipData.key} {tooltipData.value}
                    </div>
                    <div>{formatting(tooltipData.count, "int")} trials</div>
                  </TooltipInPortal>
                )}
              </Box>
            );
          } else if (hparam instanceof ContinuousHyperparam) {
            const binCount = 5;
            const isInteger = data.every(Number.isInteger);

            const groupData = currentSelectedGroup
              ? currentSelectedGroup.trials.map(
                  (trial) => trial.params[dist] as number
                )
              : [];
            const groupData2 = currentSelectedGroup2
              ? currentSelectedGroup2.trials.map(
                  (trial) => trial.params[dist] as number
                )
              : [];

            const xMin = isGroup
              ? Math.min(
                  ...(groupData as number[]),
                  ...(groupData2 as number[])
                )
              : Math.min(...(allData as number[]));

            const xMax = isGroup
              ? Math.max(
                  ...(groupData as number[]),
                  ...(groupData2 as number[])
                )
              : Math.max(...(allData as number[]));

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
                ? Math.floor(niceXMin + i * binSize).toString()
                : (niceXMin + i * binSize).toFixed(2),
              x1: isInteger
                ? Math.floor(niceXMin + (i + 1) * binSize).toString()
                : (niceXMin + (i + 1) * binSize).toFixed(2),
              count: 0,
            }));

            data.forEach((d) => {
              const binIndex = Math.floor((Number(d) - niceXMin) / binSize);
              if (binIndex >= 0 && binIndex < binCount) {
                bins[binIndex].count++;
              } else if (Number(d) === xMax) {
                bins[binCount - 1].count++;
              }
            });

            const yScale = scaleLinear({
              domain: [0, Math.max(...bins.map((bin) => bin.count))],
              range: [height - margin.bottom, margin.top],
            });

            const calculateOverlayBins = () => {
              if (!clickedHparamValue) return [];

              return bins.map((bin, i) => {
                const relevantTrials = exp?.trials.filter((trial) => {
                  const val = Number(trial.params[dist]);
                  if (i < binCount - 1) {
                    return val >= Number(bin.x0) && val < Number(bin.x1);
                  } else {
                    return val >= Number(bin.x0) && val <= Number(bin.x1);
                  }
                });
                const overlayCount =
                  relevantTrials?.filter((trial) =>
                    clickedHparamValue.value.length === 1
                      ? trial.params[clickedHparamValue.name].toString() ===
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

            return (
              <Box display="flex" justifyContent="center" alignItems="center">
                <svg width={width} height={height}>
                  {bins.map((bin, i) => {
                    // console.log("bin", bin);
                    return (
                      <g key={i}>
                        <Bar
                          x={xScale(Number(bin.x0))}
                          y={yScale(Number(bin.count))}
                          width={Math.max(
                            0,
                            xScale(Number(bin.x1)) - xScale(Number(bin.x0)) - 2
                          )}
                          height={Math.max(
                            0,
                            height - margin.bottom - yScale(Number(bin.count))
                          )}
                          fill="#C4CFDB"
                          opacity={opacity}
                        />
                        <Bar
                          x={xScale(Number(bin.x0))}
                          width={Math.max(
                            0,
                            xScale(Number(bin.x1)) - xScale(Number(bin.x0)) - 2
                          )}
                          height={height}
                          fill={"transparent"}
                          onMouseMove={(event) => {
                            showTooltip({
                              tooltipData: {
                                key: `${hparam.displayName} = ${formatting(
                                  Number(bin.x0),
                                  isInteger ? "int" : "float"
                                )} ~ ${formatting(
                                  Number(bin.x1),
                                  isInteger ? "int" : "float"
                                )}`,
                                value: "",
                                count: bin.count,
                              },
                              tooltipLeft: event.clientX,
                              tooltipTop: event.clientY,
                            });
                          }}
                          onMouseLeave={hideTooltip}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBarClick([Number(bin.x0), Number(bin.x1)]);
                          }}
                        />
                      </g>
                    );
                  })}

                  {viewType === "hparam" &&
                    bins2.map((bin, i) => (
                      <Bar
                        key={i}
                        x={xScale(Number(bin.x0))}
                        y={yScale(Number(bin.count))}
                        width={Math.max(
                          0,
                          xScale(Number(bin.x1)) - xScale(Number(bin.x0)) - 2
                        )}
                        height={Math.max(
                          0,
                          height - margin.bottom - yScale(Number(bin.count))
                        )}
                        onMouseMove={(event) => {
                          showTooltip({
                            tooltipData: {
                              key: `${hparam.displayName} = ${formatting(
                                Number(bin.x0),
                                isInteger ? "int" : "float"
                              )} ~ ${formatting(
                                Number(bin.x1),
                                isInteger ? "int" : "float"
                              )} & ${clickedHparamValue.displayName} = ${
                                typeof clickedHparamValue.value[0] === "string"
                                  ? clickedHparamValue.value[0]
                                  : `${formatting(
                                      clickedHparamValue.value[0],
                                      isInteger ? "int" : "float"
                                    )} ~ ${formatting(
                                      clickedHparamValue.value[1],
                                      isInteger ? "int" : "float"
                                    )}`
                              }`,
                              value: "",
                              count: bin.count,
                            },
                            tooltipLeft: event.clientX,
                            tooltipTop: event.clientY,
                          });
                        }}
                        onMouseLeave={hideTooltip}
                        fill={"url(#pattern)"}
                        opacity={1}
                        stroke="#030f1b"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBarClick([Number(bin.x0), Number(bin.x1)]);
                        }}
                      />
                    ))}
                </svg>
                {tooltipOpen && tooltipData && (
                  <TooltipInPortal
                    top={tooltipTop}
                    left={tooltipLeft}
                    style={tooltipStyles}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        borderBottom: "1px solid white",
                        paddingBottom: "4px",
                        marginBottom: "4px",
                      }}
                    >
                      {tooltipData.key} {tooltipData.value}
                    </div>
                    <div>{formatting(tooltipData.count, "int")} trials</div>
                  </TooltipInPortal>
                )}
              </Box>
            );
          }

          return <Box>{dist}</Box>;
        }}
      </ParentSize>
    </div>
  );
};

export default BarChart;

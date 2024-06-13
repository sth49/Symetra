import { Box, Heading, Spinner, Tooltip } from "@chakra-ui/react";
import { Experiment } from "../model/experiment";
import { useState, useEffect, useMemo } from "react";
import * as d3 from "d3";
import { BinData } from "./OptimizedDataTable";
import { ViolinPlot } from "@visx/stats";
import { AxisBottom } from "@visx/axis";
import { generateBinnedData } from "../model/utils";
import { Bar } from "@visx/shape";
import { AxisLeft } from "@visx/axis";
import { scaleLinear } from "@visx/scale";
const EffectTable = (props: { data: Experiment | null }) => {
  const exp = props.data;

  const colorScale = useMemo(() => {
    if (!exp) {
      return null;
    }
    const maxEffect = Math.max(
      ...exp.hyperparams.map((hp) => Math.abs(hp.getEffect()))
    );
    return d3.scaleSequential(d3.interpolateReds).domain([0, maxEffect]);
  }, []);
  const textScale = useMemo(() => {
    if (!exp) {
      return null;
    }
    const maxEffect = Math.max(
      ...exp.hyperparams.map((hp) => Math.abs(hp.getEffect()))
    );
    return d3.scaleLinear().domain([0, maxEffect]).range([0, 1]);
  }, []);

  return (
    <Box height="600px" margin={1} bg={"white"} p={2}>
      <Heading as="h5" size="sm" color={"gray.600"} padding={2}>
        Hyperparameter Effect
      </Heading>

      <Box overflow={"auto"} height="90%" mt={3}>
        {exp.hyperparams
          .sort((a, b) => b.getEffect() - a.getEffect())
          .map((hp) => {
            const backgroundColor = colorScale
              ? colorScale(hp.getEffect())
              : "white";
            if (
              hp.name === "silent-klee-assume" ||
              hp.name === "sym-arg" ||
              hp.name === "sym-flies"
            ) {
              return <>{hp.name}</>;
            }

            const points = hp.shapValues;

            const width = 150;
            const height = 60;
            const margin = { top: 2, right: 2, bottom: 4, left: 4 };
            const binSize = 0.05;

            const xMin = Math.min(...points);
            const xMax = Math.max(...points);
            const xRange = xMax - xMin;
            const binCount = Math.ceil(xRange / binSize);
            const xScale = scaleLinear({
              domain: [xMin, xMax],
              range: [margin.left, width - margin.right],
            });

            const bins = Array.from({ length: binCount }, (_, i) => ({
              x0: xMin + i * binSize,
              x1: xMin + (i + 1) * binSize,
              count: 0,
            }));

            points.forEach((d) => {
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
              <Box
                key={hp.name}
                border={"1px solid white"}
                padding={1}
                background={backgroundColor}
                color={textScale(hp.getEffect()) < 0.5 ? "black" : "white"}
              >
                <Tooltip
                  label={<Box>Effect: {hp.getEffect().toFixed(2)}</Box>}
                  placement="right-end"
                >
                  <Box>{hp.name}</Box>
                </Tooltip>

                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  background={"white"}
                  p={2}
                >
                  <svg width={width} height={height}>
                    {bins.map((bin, i) => (
                      <Bar
                        key={i}
                        x={xScale(bin.x0)}
                        y={yScale(bin.count)}
                        width={xScale(bin.x1) - xScale(bin.x0) - 1}
                        height={height - margin.bottom - yScale(bin.count)}
                        fill="#48BB78"
                      />
                    ))}
                    <AxisLeft scale={yScale} left={margin.left} />
                    <AxisBottom
                      scale={xScale}
                      top={height - margin.bottom}
                      left={margin.left}
                      numTicks={binCount}
                    />
                  </svg>
                </Box>
              </Box>
            );
          })}
      </Box>
    </Box>
  );
};

export default EffectTable;

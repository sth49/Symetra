import { Box, Heading, Spinner } from "@chakra-ui/react";
import { Experiment } from "../model/experiment";
import { useState, useEffect, useMemo } from "react";
import * as d3 from "d3";
import { BinData } from "./OptimizedDataTable";
import { ViolinPlot } from "@visx/stats";
import { AxisBottom } from "@visx/axis";

const EffectColumn = (props: { data: Experiment | null }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const exp = props.data;
  const maxEffect = useMemo(() => {
    if (!exp) {
      return null;
    }
    return Math.max(
      ...exp.hyperparams.map((hp) => {
        if (hp.getEffect()) {
          return Math.abs(hp.getEffect());
        }
      })
    );
  }, [exp]);
  const colorScale = useMemo(() => {
    if (!exp) {
      return null;
    }
    const maxEffect = Math.max(
      ...exp.hyperparams.map((hp) => Math.abs(hp.getEffect()))
    );
    return d3.scaleSequential(d3.interpolateReds).domain([0, maxEffect]);
  }, [maxEffect]);

  return (
    <Box width={"20%"} height="800px" margin={1} bg={"white"} p={2}>
      <Heading as="h5" size="sm" color={"gray.600"} padding={2}>
        Hyperparameter Effect
      </Heading>

      <Box overflow={"auto"} height="95%">
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
            points.sort((a, b) => a - b);
            const sampleSize = points.length;
            const firstQuartile = points[Math.floor(sampleSize / 4)];
            const thirdQuartile = points[Math.floor((sampleSize * 3) / 4)];
            const IQR = thirdQuartile - firstQuartile;
            let min = Math.min(...points);
            let max = Math.max(...points);

            const outliers = points.filter((p) => p < min || p > max);
            if (outliers.length === 0) {
              min = Math.min(...points);
              max = Math.max(...points);
            }
            const binWidth =
              2 * IQR * (sampleSize - outliers.length) ** (-1 / 3) || 1;
            const binNum = Math.round((max - min) / binWidth);
            const actualBinWidth = (max - min) / binNum;
            const bins: number[] = new Array(binNum + 2).fill(0);
            const values: number[] = new Array(binNum + 2).fill(min);
            for (let ii = 1; ii <= binNum; ii += 1) {
              values[ii] += actualBinWidth * (ii - 0.5);
            }
            values[values.length - 1] = max;

            points
              .filter((p) => p >= min && p <= max)
              .forEach((p) => {
                bins[Math.floor((p - min) / actualBinWidth) + 1] += 1;
              });

            const binData: BinData[] = values.map((v: number, index) => ({
              value: v,
              count: bins[index],
            }));

            const height = 80;
            const width = 80;
            const yScale = d3
              .scaleLinear()
              .range([height, 0])
              .domain([min, max]);
            const xScale = d3
              .scaleLinear()
              .range([20, width])
              .domain([min, max]);
            return (
              <Box
                key={hp.name}
                border={"1px solid white"}
                padding={1}
                background={backgroundColor}
                onClick={() => {
                  if (selected === hp.name) {
                    setSelected(null);
                  } else {
                    setSelected(hp.name);
                  }
                }}
              >
                <Box>{hp.name}</Box>

                {selected === hp.name && (
                  <Box>
                    <Box>Effect: {hp.getEffect().toFixed(2)}</Box>
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      background={"white"}
                      p={2}
                    >
                      <svg width={width + 20} height={height}>
                        <ViolinPlot
                          // top={10}
                          data={binData}
                          width={width}
                          height={30}
                          fill="#48BB78"
                          valueScale={xScale}
                          horizontal
                        />
                        <AxisBottom
                          scale={xScale}
                          top={height / 2}
                          // left={20}
                          numTicks={3}
                        />
                      </svg>
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}
      </Box>
    </Box>
  );
};

export default EffectColumn;

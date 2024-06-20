import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Spinner,
  Tooltip,
} from "@chakra-ui/react";
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
import { Switch } from "@chakra-ui/react";
import CustomBoxPlot from "./CustomBoxPlot";
import { BooleanHyperparam, NumericalHyperparam } from "../model/hyperparam";
const EffectTable = (props: { data: Experiment | null }) => {
  const exp = props.data;
  const [showChartMap, setShowChartMap] = useState<{ [key: string]: boolean }>(
    {}
  );
  useEffect(() => {
    if (exp) {
      const initialShowChartMap = exp.hyperparams.reduce((map, hp) => {
        map[hp.name] = false;
        return map;
      }, {});
      setShowChartMap(initialShowChartMap);
    }
  }, [exp]);

  const toggleShowChart = (hpName: string) => {
    setShowChartMap((prevMap) => ({
      ...prevMap,
      [hpName]: !prevMap[hpName],
    }));
  };

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
    <Box height="585px" margin={1} bg={"white"} p={2}>
      <Heading as="h5" size="sm" color={"gray.600"} padding={2}>
        Hyperparameter Effects
      </Heading>

      {/* <Box overflow={"auto"} height="90%" mt={3}> */}
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

          const width = 20;
          const height = 20;
          const margin = { top: 1, right: 1, bottom: 1, left: 1 };
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
              display={"flex"}
            >
              {/* <Tooltip
                label={<Box>Effect: {hp.getEffect().toFixed(2)}</Box>}
                placement="right-end"
              > */}

              {/* </Tooltip> */}

              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                background={"white"}
                p={2}
              >
                <CustomBoxPlot
                  data={exp?.trials.map((trial) => trial.params[hp.name])}
                  width={width}
                  name={"all"}
                  height={height}
                  margin={margin}
                  type={
                    hp instanceof BooleanHyperparam
                      ? "boolean"
                      : hp instanceof NumericalHyperparam
                      ? "numerical"
                      : "categorical"
                  }
                  count={
                    exp?.trials.map((trial) => trial.params[hp.name]).length
                  }
                  keys={Array.from(
                    new Set(exp?.trials.map((trial) => trial.params[hp.name]))
                  ).sort()}
                  binCount={
                    hp instanceof BooleanHyperparam
                      ? 2
                      : hp instanceof NumericalHyperparam
                      ? 5
                      : 3
                  }
                />
              </Box>
              <Box
                display={"flex"}
                flexDir={"row"}
                justifyContent={"space-between"}
                alignItems={"center"}
              >
                <Box>{hp.displayName}</Box>
              </Box>
            </Box>
          );
        })}
    </Box>
    // </Box>
  );
};

export default EffectTable;

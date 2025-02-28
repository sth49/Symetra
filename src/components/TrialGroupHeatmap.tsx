import { useMemo, useCallback } from "react";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scaleOrdinal } from "@visx/scale";
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";
import { Group } from "@visx/group";
import { performStatisticalTest } from "../model/statistic";
import { useCustomStore } from "../store";
import { useConstDataStore } from "./store/constDataStore";
import { Box } from "@chakra-ui/react";
import { formatting, getTextColor } from "../model/utils";
import { useMetricScale } from "../model/colorScale";

interface TooltipData {
  group1: string;
  group2: string;
  diffCount: number;
  totalParams: number;
  differences: Array<{ param: string; pValue: number }>;
}

const margin = { top: 30, right: 10, bottom: 10, left: 90 };

const TrialGroupHeatmap = () => {
  const groups = useCustomStore((state) => state.groups);
  const { hyperparams } = useConstDataStore();

  const { hideTooltip, showTooltip } = useTooltip<TooltipData>();

  // Calculate statistical differences between groups
  const heatmapData = useMemo(() => {
    const data = [];
    const groupsList = groups.groups;

    for (let i = 0; i < groupsList.length; i++) {
      for (let j = 0; j < groupsList.length; j++) {
        const differences = hyperparams.map((param) => {
          const group1 = groupsList[i].getHyperparam(param.name);
          const group2 = groupsList[j].getHyperparam(param.name);
          const pValue =
            performStatisticalTest(group1, group2, param.type, param).pValue ||
            1;
          return {
            param: param.name,
            pValue,
          };
        });

        const diffCount = differences.filter((d) => d.pValue < 0.05).length;

        data.push({
          x: i,
          y: j,
          value: diffCount,
          group1: groupsList[i].name,
          group2: groupsList[j].name,
          differences,
        });
      }
    }
    return data;
  }, [groups, hyperparams]);

  // Scales
  const colorScale2 = useMemo(() => {
    return scaleLinear({
      domain: [0, hyperparams.length],
      range: ["#ffffff", "#ff0000"],
    });
  }, [hyperparams]);

  const HeatmapCell = ({ x, y, width, height, data, xScale, yScale }) => {
    const handleMouseOver = useCallback(
      (event, d) => {
        showTooltip({
          tooltipData: {
            group1: d.group1,
            group2: d.group2,
            diffCount: d.value,
            totalParams: hyperparams.length,
            differences: d.differences,
          },
          tooltipLeft: event.clientX,
          tooltipTop: event.clientY,
        });
      },
      [showTooltip]
    );

    return (
      <Group>
        {data.map((d) => (
          <>
            <rect
              key={`${d.x}-${d.y}`}
              x={xScale(d.x)}
              y={yScale(d.y)}
              width={width}
              height={height}
              fill={colorScale2(d.value)}
              stroke="#ffffff"
              strokeWidth={1}
              onMouseMove={(e) => handleMouseOver(e, d)}
              onMouseLeave={hideTooltip}
              style={{ cursor: "pointer" }}
            />
            <text
              x={xScale(d.x) + width / 2}
              y={yScale(d.y) + height / 2}
              fontSize={10}
              fill="#666"
              textAnchor="middle"
              dy=".32em"
            >
              {d.value} / {hyperparams.length}
            </text>
          </>
        ))}
      </Group>
    );
  };

  const BaseHeatmap = ({ width, height }) => {
    const xScale = scaleOrdinal({
      domain: groups.groups.map((_, i) => i),
      range: Array.from(
        { length: groups.groups.length },
        (_, i) =>
          i * ((width - margin.left - margin.right) / groups.groups.length)
      ),
    });

    const yScale = scaleOrdinal({
      domain: groups.groups.map((_, i) => i),
      range: Array.from(
        { length: groups.groups.length },
        (_, i) =>
          i * ((height - margin.top - margin.bottom) / groups.groups.length)
      ),
    });

    const cellWidth =
      (width - margin.left - margin.right) / groups.groups.length;
    const cellHeight =
      (height - margin.top - margin.bottom) / groups.groups.length;

    const setCurrentSelectedGroup = useCustomStore(
      (state) => state.setCurrentSelectedGroup
    );
    const currnetSelectedGroup = useCustomStore(
      (state) => state.currentSelectedGroup
    );

    const handleClick = useCallback(
      (id) => {
        if (currnetSelectedGroup && currnetSelectedGroup.id === id) {
          return;
        } else {
          setCurrentSelectedGroup(groups.getGroup(id));
        }
      },
      [currnetSelectedGroup, groups, setCurrentSelectedGroup]
    );
    const { metricScale, colorScale } = useMetricScale();

    return (
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top} onMouseLeave={hideTooltip}>
          <HeatmapCell
            data={heatmapData}
            x={0}
            y={0}
            width={cellWidth}
            height={cellHeight}
            xScale={xScale}
            yScale={yScale}
          />

          {/* Add X axis labels */}
          {groups.groups.map((group, i) => (
            <>
              <rect
                key={`xrect-${i}`}
                x={xScale(i)}
                y={-30}
                width={cellWidth}
                height={30}
                fill={colorScale(metricScale(Number(group.getStats().avg)))}
                stroke="white"
                strokeWidth={1}
                style={{ cursor: "pointer" }}
                onClick={() => handleClick(group.id)}
              ></rect>
              <text
                key={`xlabel-${i}`}
                x={xScale(i) + cellWidth / 2}
                y={-10}
                fontWeight={
                  group.id === currnetSelectedGroup?.id ? "bold" : "normal"
                }
                textAnchor="middle"
                fontSize={10}
                // fill="#666"
                fill={getTextColor(
                  colorScale(metricScale(Number(group.getStats().avg)))
                )}
                onClick={() => handleClick(group.id)}
                style={{ cursor: "pointer" }}
              >
                {group.name}
              </text>
            </>
          ))}

          {/* Add Y axis labels */}
          {groups.groups.map((group, i) => (
            <>
              <rect
                key={`yrect-${i}`}
                x={-85}
                y={yScale(i)}
                width={85}
                height={cellHeight}
                fill={colorScale(metricScale(Number(group.getStats().avg)))}
                stroke="white"
                strokeWidth={1}
                style={{ cursor: "pointer" }}
                onClick={() => handleClick(group.id)}
              ></rect>
              <text
                key={`ylabel-${i}`}
                x={-10}
                y={yScale(i) + cellHeight / 2}
                fontWeight={
                  group.id === currnetSelectedGroup?.id ? "bold" : "normal"
                }
                textAnchor="end"
                fontSize={10}
                // fill="#666"
                fill={getTextColor(
                  colorScale(metricScale(Number(group.getStats().avg)))
                )}
                dy=".32em"
                onClick={() => handleClick(group.id)}
                style={{ cursor: "pointer" }}
              >
                {group.name}
              </text>
            </>
          ))}
        </Group>
      </svg>
    );
  };

  return (
    <Box width="100%" height="100%" position="relative">
      <ParentSize>
        {({ width, height }) => <BaseHeatmap width={width} height={height} />}
      </ParentSize>

      {/* {tooltipOpen && tooltipData && (
        <TooltipInPortal
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div>
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
              {tooltipData.group1} vs {tooltipData.group2}
            </div>
            <div style={{ marginBottom: "4px" }}>
              Statistical Differences:{" "}
              {formatting(tooltipData.diffCount, "int")} /{" "}
              {tooltipData.totalParams}
            </div>
          </div>
        </TooltipInPortal>
      )} */}
    </Box>
  );
};

export default TrialGroupHeatmap;

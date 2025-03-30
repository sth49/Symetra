import React from "react";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import { Text } from "@visx/text";
import { ParentSize } from "@visx/responsive";
import { formatting } from "../model/utils";
import * as d3 from "d3";
interface BidirectionalChartProps {
  leftValue: number; // Value for left side
  rightValue: number; // Value for right side (positive)
  width?: number;
  height?: number;
  isHalf?: boolean;
}

// Default values if not provided
const defaultProps = {
  leftValue: 80.24,
  rightValue: 0,
  height: 30,
  isHalf: true,
};

const BaseBidirectionalChart: React.FC<
  BidirectionalChartProps & { width: number }
> = ({
  leftValue = defaultProps.leftValue,
  rightValue = defaultProps.rightValue,
  width,
  height = defaultProps.height,
  isHalf = defaultProps.isHalf,
}) => {
  const diff = leftValue - rightValue;
  const barScale = scaleLinear<number>({
    domain: [0, 100],
    range: [
      0,
      isHalf
        ? width / 2 - (width < 200 ? 10 : 40)
        : width - (width < 200 ? 40 : 60),
    ],
  });

  const barHeight = height * 0.5;
  const barY = (height - barHeight) / 2;

  const fontSize = width < 200 ? 10 : 12;

  const dir = diff > 0 ? "left" : "right";

  const leftBarWidth = barScale(dir === "left" ? Math.abs(diff) : 0);
  const rightBarWidth = barScale(dir === "right" ? Math.abs(diff) : 0);

  const centerX = isHalf ? width / 2 : dir === "left" ? width : 0;

  const colorIntensityBlue = d3.scaleSequential(
    [0, 100],
    d3.interpolateRgb("rgba(0, 0, 255, 0.2)", "rgba(0, 0, 255, 0.8)")
  );
  const colorIntensityRed = d3.scaleSequential(
    [0, 100],
    d3.interpolateRgb("rgba(255, 0, 0, 0.2)", "rgba(255, 0, 0, 0.8)")
  );

  return (
    <svg width={width} height={height}>
      <Group>
        {/* Center line */}
        <line
          x1={centerX}
          y1={0}
          x2={centerX}
          y2={height}
          stroke="#000"
          strokeWidth={1}
        />

        {/* Left bar */}
        <Bar
          x={centerX - leftBarWidth}
          y={barY}
          width={leftBarWidth}
          height={barHeight}
          fill={colorIntensityBlue(Math.abs(diff))}
          rx={0}
        />

        {/* Right bar */}
        <Bar
          x={centerX}
          y={barY}
          width={rightBarWidth}
          height={barHeight}
          fill={colorIntensityRed(Math.abs(diff))}
          rx={0}
        />

        {dir === "left" && (
          <Text
            x={centerX + rightBarWidth + 5}
            y={barY + barHeight / 2}
            verticalAnchor="middle"
            textAnchor="start"
            fontSize={fontSize}
          >
            {formatting(Math.abs(diff), "float") + " %p"}
          </Text>
        )}

        {dir === "right" && (
          <Text
            x={centerX - leftBarWidth - 5}
            y={barY + barHeight / 2}
            verticalAnchor="middle"
            textAnchor="end"
            fontSize={fontSize}
          >
            {formatting(Math.abs(diff), "float") + " %p"}
          </Text>
        )}
      </Group>
    </svg>
  );
};

const BidirectionalChart: React.FC<Omit<BidirectionalChartProps, "width">> = (
  props
) => {
  return (
    <ParentSize>
      {({ width }) => <BaseBidirectionalChart width={width} {...props} />}
    </ParentSize>
  );
};

export default BidirectionalChart;

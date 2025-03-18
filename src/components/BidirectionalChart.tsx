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
  // Calculate the center position
  const diff = leftValue - rightValue;

  // Find the maximum absolute value to create a symmetrical scale
  // Create scale for the bars (using absolute values for width calculation)
  const barScale = scaleLinear<number>({
    domain: [0, 100],
    range: [
      0,
      isHalf
        ? width / 2 - (width < 200 ? 10 : 40)
        : width - (width < 200 ? 40 : 60),
    ],
  });

  // Bar height
  const barHeight = height * 0.5;
  const barY = (height - barHeight) / 2;

  // Conditionally show labels based on available space
  const fontSize = width < 200 ? 10 : 12;

  const dir = diff > 0 ? "left" : "right";

  // Calculate bar width
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
  // const colorIntensity = Math.abs(diff) / 100;

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
          // fill={"rgba(0, 0, 255," + colorIntensity(Math.abs(diff)) + ")"}
          // opacity={colorIntensity}
          rx={0}
          // stroke="black"
        />

        {/* Right bar */}
        <Bar
          x={centerX}
          y={barY}
          width={rightBarWidth}
          height={barHeight}
          fill={colorIntensityRed(Math.abs(diff))}
          // fill={"rgba(255, 0, 0," + colorIntensity(Math.abs(diff)) + ")"}
          // fill="rgba(255, 0, 0)"
          // opacity={colorIntensity}
          rx={0}
          // stroke="black"
        />

        {dir === "left" && (
          <Text
            // x={centerX - leftBarWidth - 5}
            x={centerX + rightBarWidth + 5}
            y={barY + barHeight / 2}
            verticalAnchor="middle"
            // textAnchor="end"
            textAnchor="start"
            fontSize={fontSize}
          >
            {formatting(Math.abs(diff), "float") + " %p"}
          </Text>
        )}

        {dir === "right" && (
          <Text
            x={centerX - leftBarWidth - 5}
            // x={centerX + rightBarWidth + 5}
            y={barY + barHeight / 2}
            verticalAnchor="middle"
            // textAnchor="start"
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

// Wrapper component that uses ParentSize to make the chart responsive
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

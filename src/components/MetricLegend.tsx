import { useMetricScale } from "../model/colorScale";
import { Text } from "@chakra-ui/react";
import { formatting, getTextColor } from "../model/utils";
const MetricLegend = () => {
  const { metricScale, colorScale } = useMetricScale();
  const [minValue, maxValue] = metricScale.domain();
  const numThresholds = 5;

  const ranges = Array.from({ length: numThresholds }, (_, i) => {
    const rangeEnd =
      minValue + ((i + 1) * (maxValue - minValue)) / numThresholds;
    return {
      color: colorScale(i),
      label: `~ ${formatting(rangeEnd, "int")}`,
      value: i,
      textColor: getTextColor(colorScale(i)),
    };
  });

  return (
    <div style={{ display: "flex", width: "300px" }}>
      {ranges.map((range) => (
        <div
          style={{
            backgroundColor: range.color,
            color: range.textColor,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text fontSize="12px" color={range.textColor}>
            {range.label}
          </Text>
        </div>
      ))}
    </div>
  );
};

export default MetricLegend;

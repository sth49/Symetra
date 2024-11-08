import { formatting } from "../model/utils";

import { useMetricScale } from "../model/colorScale";
import { Badge } from "@chakra-ui/react";
import { getTextColor } from "../model/utils";
interface MetricBadgeProps {
  metricValue: number;
  type: string;
}
const MetricBadge = ({ metricValue, type = "int" }: MetricBadgeProps) => {
  const { metricScale, colorScale } = useMetricScale();
  return (
    <Badge
      backgroundColor={colorScale(metricScale(metricValue))}
      color={getTextColor(colorScale(metricScale(metricValue)))}
      display={"flex"}
      alignItems={"center"}
      fontWeight={"normal"}
      //   p={0.5}
    >
      {formatting(metricValue, type)}
    </Badge>
  );
};

export default MetricBadge;

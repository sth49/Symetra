import { Box, Icon } from "@chakra-ui/react";

import { TbCircleDotted, TbCircleFilled } from "react-icons/tb";
import { useMetricScale } from "../model/colorScale";
import { useCustomStore } from "../store";
const SelectIcon = () => {
  const { metricScale, colorScale } = useMetricScale();

  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  return (
    <Box position="relative" width="20px" height="20px">
      <Icon
        as={TbCircleFilled}
        color={colorScale(
          metricScale(
            currentSelectedGroup ? currentSelectedGroup.getStats().avg : 0
          )
        )}
        position="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, -50%)"
      />
      <Icon
        as={TbCircleDotted}
        color={"gray.600"}
        position="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, -50%)"
      />
    </Box>
  );
};

export default SelectIcon;

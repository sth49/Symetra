import { Box, Icon } from "@chakra-ui/react";

import { TbCircleDotted, TbCircleFilled } from "react-icons/tb";
import { useMetricScale } from "../model/colorScale";
import { useCustomStore } from "../store";

interface SelectIconProps {
  type?: string;
}

const SelectIcon = ({ type }: SelectIconProps) => {
  const { colorScale } = useMetricScale();

  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );
  const currentSelectedGroup2 = useCustomStore(
    (state) => state.currentSelectedGroup2
  );

  return (
    <Box position="relative" width="20px" height="20px">
      <Icon
        as={TbCircleFilled}
        // color={colorScale(
        //   type === "g1" && currentSelectedGroup
        //     ? currentSelectedGroup.getStats().avg
        //     : currentSelectedGroup2
        //     ? currentSelectedGroup2.getStats().avg
        //     : 0
        // )}

        color={type === "g1" ? `rgba(0,0,255,0.2)` : `rgba(255,0,0,0.5)`}
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

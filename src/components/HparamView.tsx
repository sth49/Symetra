import { Badge, Box, Button, Heading, Icon, Text } from "@chakra-ui/react";

import { useConstDataStore } from "./store/constDataStore";
import HparamTable from "./HparamTable";
import { formatting } from "../model/utils";

import { FaEyeSlash } from "react-icons/fa6";
import { useMetricScale } from "../model/colorScale";
const HparamView = () => {
  const { exp, hyperparams } = useConstDataStore();
  const { metricScale, colorScale } = useMetricScale();
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Parameter View ({hyperparams.filter((hp) => hp.visible).length}/
          {hyperparams.length} Visible)
        </Heading>
      </Box>
      <Box display={"flex"} justifyContent={"center"}>
        <Text fontSize={"xs"} align="center" color="gray.600">
          Base Branch Coverage
        </Text>
        <Badge
          backgroundColor={colorScale(metricScale(exp.metric.baseValue))}
          color={"black"}
          display={"flex"}
          alignItems={"center"}
          fontWeight={"normal"}
          ml={2}
        >
          {formatting(exp.metric.baseValue, "float")}
        </Badge>
      </Box>
      <HparamTable />
      <Box
        width={"100%"}
        display={"flex"}
        justifyContent={"space-around"}
        alignContent={"center"}
        p={2}
      >
        <Button size={"xs"} alignSelf={"center"} colorScheme={"blue"}>
          <Icon as={FaEyeSlash} mr={2} />
          Hide parameters with effect under 0.5
        </Button>
      </Box>
    </div>
  );
};

export default HparamView;

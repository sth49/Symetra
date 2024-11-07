import { Box, Button, Heading, Icon, Text } from "@chakra-ui/react";

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
          Hyperparameter View ({hyperparams.filter((hp) => hp.visible).length}/
          {hyperparams.length} Visible)
        </Heading>
      </Box>
      <HparamTable />
      <Box
        width={"100%"}
        height={"60px"}
        display={"flex"}
        flexDir={"column"}
        justifyContent={"space-around"}
        alignContent={"center"}
      >
        <Box display={"flex"} justifyContent={"center"}>
          <Text fontSize={"xs"} align="center" color="gray.600">
            Base value
          </Text>
          <Text
            fontSize={"xs"}
            align="center"
            color={exp.metric.baseValue < 1000 ? "white" : "black"}
            ml={2}
            background={colorScale(metricScale(exp.metric.baseValue))}
          >
            {formatting(exp.metric.baseValue, "float")}
          </Text>
        </Box>
        <Button size={"xs"} alignSelf={"center"} colorScheme={"blue"}>
          <Icon as={FaEyeSlash} mr={2} />
          Hide hyperparameters with effect under 0.5
        </Button>
      </Box>
    </div>
  );
};

export default HparamView;

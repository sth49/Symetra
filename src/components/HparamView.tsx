import { Box, Button, Heading, Icon, Text } from "@chakra-ui/react";

import { useConstDataStore } from "./store/constDataStore";
import HparamTable from "./HparamTable";

import { FaEyeSlash, FaEye } from "react-icons/fa6";
import MetricBadge from "./MetricBadge";
import { useEffect, useState } from "react";
const HparamView = () => {
  const { exp, hyperparams, setHyperparams } = useConstDataStore();
  const [buttonType, setButtonType] = useState("Show");
  const calculateRatio = () => {
    const invisible = hyperparams.filter(
      (hp) => hp.getMeanAbsoluteEffect() < 0.3
    );
    const visibleCount = invisible.filter((hp) => hp.visible).length;
    const ratio = visibleCount / hyperparams.length;
    if (ratio > 0.5) {
      setButtonType("Hide");
    } else {
      setButtonType("Show");
    }
  };
  const handleClick = () => {
    const invisible = hyperparams
      .filter((hp) => hp.getMeanAbsoluteEffect() < 0.3)
      .map((hp) => hp.name);

    if (buttonType === "Show") {
      const newHyperparams = hyperparams.map((hp) => {
        if (invisible.includes(hp.name)) {
          hp.visible = true;
        }
        return hp;
      });
      setHyperparams(newHyperparams);
    }
    if (buttonType === "Hide") {
      const newHyperparams = hyperparams.map((hp) => {
        if (invisible.includes(hp.name)) {
          hp.visible = false;
        }
        return hp;
      });
      setHyperparams(newHyperparams);
    }
    calculateRatio();
  };
  useEffect(() => {
    calculateRatio();
  }, [hyperparams]);

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
        <Text fontSize={"xs"} align="center" color="gray.600" mr={2}>
          Base Branch Coverage
        </Text>

        <MetricBadge metricValue={exp.metric.baseValue} type="float" />
      </Box>
      <HparamTable />
      <Box
        width={"100%"}
        display={"flex"}
        justifyContent={"space-around"}
        alignContent={"center"}
      >
        <Button
          size={"xs"}
          alignSelf={"center"}
          colorScheme={"blue"}
          onClick={handleClick}
        >
          <Icon as={buttonType === "Show" ? FaEye : FaEyeSlash} mr={2} />
          {buttonType} parameters with effect under 0.3
        </Button>
      </Box>
    </div>
  );
};

export default HparamView;

import { Box, Heading, Icon, Text, Tooltip } from "@chakra-ui/react";
import { HparamIcons, HyperparamTypes } from "../model/hyperparam";
import { formatting } from "../model/utils";

import { AiFillRocket } from "react-icons/ai";
import { useConstDataStore } from "./store/constDataStore";
import * as d3 from "d3";
import MetricLegend from "./MetricLegend";
import { FaCodeBranch } from "react-icons/fa6";
const Overview = () => {
  const { exp } = useConstDataStore();
  return (
    <Box
      w={"100%"}
      height={"100%"}
      display={"flex"}
      justifyContent={"space-between"}
      alignItems={"center"}
      userSelect={"none"}
    >
      <Box display={"flex"} alignItems={"center"}>
        <Icon as={FaCodeBranch} color="gray.600" mr={1} />
        <Heading as="h4" fontSize={"larger"} display={"flex"}>
          ViStrics
        </Heading>
      </Box>

      <Box display={"flex"} w={"90%"} justifyContent={"space-between"}>
        <Box display={"flex"} alignItems={"center"}>
          <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={3}>
            Dataset
          </Text>
          <Text fontSize="sm" color={"gray.600"}>
            {exp?.name}
          </Text>
        </Box>
        <Box display={"flex"} alignItems={"center"}>
          <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={3}>
            Trials
          </Text>
          <Text fontSize="sm" color={"gray.600"}>
            {formatting(exp.trials.length, "int")}
          </Text>
        </Box>
        <Box display={"flex"} alignItems={"center"}>
          <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={3}>
            Parameters
          </Text>
          <Text fontSize="sm" color={"gray.600"}>
            {exp?.hyperparams.length}
          </Text>
          {Object.keys(HyperparamTypes)
            .filter((key) => isNaN(Number(key)))
            .map((key, index) => {
              const icon = HparamIcons[key];
              return (
                <Box display={"flex"} alignItems={"center"} key={index} pl={6}>
                  <Icon as={icon} mr={1} />
                  <Text fontSize="sm" fontWeight={"bold"} pr={3}>
                    {key}
                  </Text>
                  <Text fontSize="sm">
                    {
                      exp?.hyperparams.filter(
                        (hp) => hp.type === HyperparamTypes[key]
                      ).length
                    }
                  </Text>
                </Box>
              );
            })}
        </Box>

        <Box display={"flex"} alignItems={"center"}>
          <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={3}>
            Branches
          </Text>
          <Box display={"flex"} alignItems={"center"} pr={5}>
            <Text fontSize="sm" color={"gray.600"} display={"flex"} mr={2}>
              <Tooltip label={"Total"}>
                {formatting(exp.metric.totalBranch, "int")}
              </Tooltip>
            </Text>
          </Box>
          <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={3}>
            Color Legend for Coverage
          </Text>
          <MetricLegend />
        </Box>
      </Box>
    </Box>
  );
};

export default Overview;

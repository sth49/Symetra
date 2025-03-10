import { Box, Heading, Icon, Text, Tooltip } from "@chakra-ui/react";
import { HparamIcons, HyperparamTypes } from "../model/hyperparam";
import { formatting } from "../model/utils";

import { useConstDataStore } from "./store/constDataStore";
import MetricLegend from "./MetricLegend";
import BranchIcon from "./BranchIcon";
// import { FaCodeBranch } from "react-icons/fa6";
const Overview = () => {
  const { exp, target } = useConstDataStore();
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
        <BranchIcon />
        <Heading as="h4" fontSize={"larger"} display={"flex"} ml={1}>
          Symetra
        </Heading>
      </Box>

      <Box display={"flex"} w={"93%"} justifyContent={"space-between"}>
        <Box display={"flex"} justifyContent={"space-between"} w={"60%"}>
          <Box display={"flex"} alignItems={"center"}>
            <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={3}>
              Target Program
            </Text>
            <Text fontSize="sm" color={"gray.600"}>
              {exp?.name.split("_")[0]}
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
              Branches
            </Text>
            <Text fontSize="sm" color={"gray.600"} display={"flex"} mr={2}>
              {/* {formatting(exp.metric.totalBranch, "int")} */}
              {formatting(
                target.filter((t) => t.name === exp.name)[0].total,
                "int"
              )}
            </Text>
          </Box>

          <Box display={"flex"} alignItems={"center"}>
            <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={3}>
              Parameters
            </Text>
            <Text fontSize="sm" color={"gray.600"}>
              {exp?.hyperparams.length}
            </Text>
          </Box>

          {Object.keys(HyperparamTypes)
            .filter((key) => isNaN(Number(key)))
            .map((key, index) => {
              const icon = HparamIcons[key];
              return (
                <Box display={"flex"} alignItems={"center"} key={index}>
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
            Color Legend for Coverage
          </Text>
          <MetricLegend />
        </Box>
      </Box>
    </Box>
  );
};

export default Overview;

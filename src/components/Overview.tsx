import {
  Badge,
  Box,
  Heading,
  Icon,
  IconButton,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { HparamIcons, HyperparamTypes } from "../model/hyperparam";
import { formatting } from "../model/utils";

import { AiFillRocket } from "react-icons/ai";
import { IoMdSettings } from "react-icons/io";
import { useConstDataStore } from "./store/constDataStore";
import { useMetricScale } from "../model/colorScale";
import * as d3 from "d3";
const Overview = () => {
  const { metricScale, colorScale } = useMetricScale();

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
        <Icon as={AiFillRocket} color="gray.600" />
        <Heading as="h4" fontSize={"larger"} display={"flex"}>
          ViSTrics
        </Heading>
      </Box>

      <Box display={"flex"} w={"90%"} justifyContent={"space-around"}>
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
        </Box>

        {Object.keys(HyperparamTypes)
          .filter((key) => isNaN(Number(key)))
          .map((key, index) => {
            const icon = HparamIcons[key];
            return (
              <Box display={"flex"} alignItems={"center"}>
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
        <Box display={"flex"} alignItems={"center"}>
          <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={3}>
            Branch Coverage
          </Text>
          <Box display={"flex"} alignItems={"center"}>
            <Text fontSize="sm" color={"gray.600"} display={"flex"} mr={2}>
              <Tooltip label={"Total"}>
                {formatting(exp.metric.totalBranch, "float")}
              </Tooltip>
            </Text>
            (
            <Tooltip label={"Median"}>
              <Badge
                backgroundColor={colorScale(
                  metricScale(d3.median(exp.trials.map((t) => t.metric)))
                )}
                color={"black"}
                display={"flex"}
                alignItems={"center"}
                fontWeight={"normal"}
                p={0.5}
              >
                {formatting(d3.median(exp.trials.map((t) => t.metric)), "int")}
              </Badge>
            </Tooltip>
            )
          </Box>
        </Box>
      </Box>
      {/* <IconButton
        mr={"2px"}
        size={"sm"}
        aria-label="Settings"
        icon={<IoMdSettings />}
        color={"gray.600"}
      ></IconButton> */}
    </Box>
  );
};

export default Overview;

import {
  Badge,
  Box,
  Heading,
  Icon,
  IconButton,
  Tag,
  TagLabel,
  Text,
} from "@chakra-ui/react";
import { HparamIcons, HyperparamTypes } from "../model/hyperparam";
import { formatting } from "../model/utils";

import { AiFillRocket } from "react-icons/ai";
import { useCustomStore } from "../store";
import { IoMdSettings } from "react-icons/io";
const Overview = () => {
  // console.log(
  //   data.data.hyperparams.filter((hp) => hp.type === HyperparamTypes.Boolean)
  //     .length
  // );
  const { exp } = useCustomStore();
  return (
    <Box
      w={"100%"}
      height={"100%"}
      display={"flex"}
      justifyContent={"space-between"}
      alignItems={"center"}
      // pr={1}
      // pl={1}
    >
      {/* <Heading as="h5" size="sm" color={"blackAlpha.600"} padding={4}>
        Dataset
      </Heading> */}
      <Heading fontSize={"larger"} display={"flex"}>
        <Icon as={AiFillRocket} color="gray.600" />
        ViSTrics
      </Heading>
      <Box display={"flex"} w={"70%"} justifyContent={"space-between"}>
        <Box display={"flex"}>
          <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={3}>
            Dataset
          </Text>
          <Text fontSize="sm" color={"gray.600"}>
            {exp?.name}
          </Text>
        </Box>
        <Box display={"flex"}>
          <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={3}>
            Trials
          </Text>
          <Text fontSize="sm" color={"gray.600"}>
            {formatting(exp.trials.length, "int")}
          </Text>
        </Box>
        <Box display={"flex"}>
          <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={3}>
            Hyperparameters
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
      </Box>
      <IconButton
        mr={"2px"}
        size={"sm"}
        aria-label="Settings"
        icon={<IoMdSettings />}
        color={"gray.600"}
        // colorScheme="blue"
        // variant="outline"
      ></IconButton>

      {/* <Badge variant={"solid"} colorScheme={"green"}>
        <Box display={"flex"} alignItems={"center"}>
          <Icon as={MdTimeline} mr={1} />
          <Text fontSize="10px" fontWeight={"bold"} pr={1}>
            Continuous
          </Text>
          <Text fontSize="10px">
            {
              data.data.hyperparams.filter(
                (hp) => hp.type === HyperparamTypes.Continuous
              ).length
            }
          </Text>
        </Box>
      </Badge>
      <Badge variant={"solid"} colorScheme={"green"}>
        <Box display={"flex"} alignItems={"center"}>
          <Icon as={MdOutlineLeaderboard} mr={1} />
          <Text fontSize="10px" fontWeight={"bold"} pr={1}>
            Discrete
          </Text>
          <Text fontSize="10px">
            {
              data.data.hyperparams.filter(
                (hp) => hp.type === HyperparamTypes.Discrete
              ).length
            }
          </Text>
        </Box>
      </Badge>
      <Badge variant={"solid"} colorScheme={"green"}>
        <Box display={"flex"} alignItems={"center"}>
          <Icon as={RxComponentBoolean} mr={1} />
          <Text fontSize="10px" fontWeight={"bold"} pr={1}>
            Binary
          </Text>
          <Text fontSize="10px">
            {
              data.data.hyperparams.filter(
                (hp) => hp.type === HyperparamTypes.Binary
              ).length
            }
          </Text>
        </Box>
      </Badge>

      <Badge variant={"solid"} colorScheme={"green"}>
        <Box display={"flex"} alignItems={"center"}>
          <Icon as={MdCategory} mr={1} />
          <Text fontSize="10px" fontWeight={"bold"} pr={1}>
            Nominal
          </Text>
          <Text fontSize="10px">
            {
              data.data.hyperparams.filter(
                (hp) => hp.type === HyperparamTypes.Nominal
              ).length
            }
          </Text>
        </Box>
      </Badge>
      <Badge variant={"solid"} colorScheme={"green"}>
        <Box display={"flex"} alignItems={"center"}>
          <Icon as={MdOutlineHdrStrong} mr={1} />
          <Text fontSize="10px" fontWeight={"bold"} pr={1}>
            Ordinal
          </Text>
          <Text fontSize="10px">
            {
              data.data.hyperparams.filter(
                (hp) => hp.type === HyperparamTypes.Ordinal
              ).length
            }
          </Text>
        </Box>
      </Badge> */}
    </Box>
  );
};

export default Overview;

import { Badge, Box, Icon, Tag, TagLabel, Text } from "@chakra-ui/react";
import { HparamIcons, HyperparamTypes } from "../model/hyperparam";
interface OverviewProps {
  data: any;
}

const Overview = (data: OverviewProps) => {
  // console.log(
  //   data.data.hyperparams.filter((hp) => hp.type === HyperparamTypes.Boolean)
  //     .length
  // );
  return (
    <Box
      w={"100%"}
      height={"100%"}
      display={"flex"}
      justifyContent={"space-between"}
      alignItems={"center"}
      pr={2}
      pl={2}
    >
      {/* <Heading as="h5" size="sm" color={"blackAlpha.600"} padding={4}>
        Dataset
      </Heading> */}
      <Box display={"flex"}>
        <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={1}>
          Dataset
        </Text>
        <Text fontSize="sm" color={"gray.600"}>
          {data.data.name}
        </Text>
      </Box>
      <Box display={"flex"}>
        <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={1}>
          Trials
        </Text>
        <Text fontSize="sm" color={"gray.600"}>
          {data.data.trials.length}
        </Text>
      </Box>
      <Box display={"flex"}>
        <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={1}>
          Hyperparameters
        </Text>
        <Text fontSize="sm" color={"gray.600"}>
          {data.data.hyperparams.length}
        </Text>
      </Box>

      {Object.keys(HyperparamTypes)
        .filter((key) => isNaN(Number(key)))
        .map((key, index) => {
          const icon = HparamIcons[key];
          return (
            <Box display={"flex"} alignItems={"center"}>
              <Icon as={icon} mr={1} />
              <Text fontSize="sm" fontWeight={"bold"} pr={1}>
                {key}
              </Text>
              <Text fontSize="sm">
                {
                  data.data.hyperparams.filter(
                    (hp) => hp.type === HyperparamTypes[key]
                  ).length
                }
              </Text>
            </Box>
          );
        })}
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

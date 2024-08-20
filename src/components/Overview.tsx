import {
  Box,
  Grid,
  GridItem,
  Heading,
  Tag,
  TagLabel,
  Text,
} from "@chakra-ui/react";
import { HyperparamTypes } from "../model/hyperparam";

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
        <Box display={"flex"}>
          {/* <Box>{data.data.name}</Box> */}
          <Tag
            size={"sm"}
            borderRadius="full"
            variant="solid"
            colorScheme="teal"
          >
            <TagLabel>{data.data.name}</TagLabel>
          </Tag>
        </Box>
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

      <Box display={"flex"}>
        <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={1}>
          Boolean
        </Text>
        <Text fontSize="sm" color={"gray.600"}>
          {
            data.data.hyperparams.filter(
              (hp) => hp.type === HyperparamTypes.Boolean
            ).length
          }
        </Text>
      </Box>
      <Box display={"flex"}>
        <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={1}>
          Numerical
        </Text>
        <Text fontSize="sm" color={"gray.600"}>
          {
            data.data.hyperparams.filter(
              (hp) => hp.type === HyperparamTypes.Numerical
            ).length
          }
        </Text>
      </Box>
      <Box display={"flex"}>
        <Text fontSize="sm" color={"gray.600"} fontWeight={"bold"} pr={1}>
          Categorical
        </Text>
        <Text fontSize="sm" color={"gray.600"}>
          {
            data.data.hyperparams.filter(
              (hp) => hp.type === HyperparamTypes.Categorical
            ).length
          }
        </Text>
      </Box>
    </Box>
  );
};

export default Overview;

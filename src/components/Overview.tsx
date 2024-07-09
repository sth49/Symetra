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
      bg={"white"}
      p={2}
      display={"flex"}
      justifyContent={"space-between"}
      alignItems={"center"}
      m={2}
      width={"79%"}
    >
      <Heading as="h5" size="sm" color={"gray.600"} padding={2}>
        Dataset Information
      </Heading>
      <Box display={"flex"} flexDir={"row"} pl={2} pt={1}>
        <Box pr={2}>
          <Text fontSize="sm">Dataset:</Text>
        </Box>
        <Box>
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
      <Box display={"flex"} flexDir={"row"} pl={4} pt={1}>
        <Box pr={2}>
          <Text fontSize="sm"># Trials:</Text>
        </Box>
        <Box>
          <Text fontSize="sm">{data.data.trials.length}</Text>
        </Box>
      </Box>
      <Box display={"flex"} flexDir={"row"} pl={4} pt={1}>
        <Box pr={2}>
          <Text fontSize="sm"># Attributes:</Text>
        </Box>
        <Box>
          <Text fontSize="sm">{data.data.hyperparams.length}</Text>
        </Box>
      </Box>
      <Box display={"flex"} p={"0px 4px"} pl={4}>
        <Box display={"flex"} flexDir={"row"} pt={1}>
          <Box pr={2}>
            <Text fontSize="sm">Boolean:</Text>
          </Box>
          <Box>
            <Text fontSize="sm">
              {
                data.data.hyperparams.filter(
                  (hp) => hp.type === HyperparamTypes.Boolean
                ).length
              }
            </Text>
          </Box>
        </Box>
        <Box display={"flex"} flexDir={"row"} pl={4} pt={1}>
          <Box pr={2}>
            <Text fontSize="sm">Numerical:</Text>
          </Box>
          <Box>
            <Text fontSize="sm">
              {
                data.data.hyperparams.filter(
                  (hp) => hp.type === HyperparamTypes.Numerical
                ).length
              }
            </Text>
          </Box>
        </Box>
        <Box display={"flex"} flexDir={"row"} pl={4} pt={1}>
          <Box pr={2}>
            <Text fontSize="sm">Categorical:</Text>
          </Box>
          <Box>
            <Text fontSize="sm">
              {
                data.data.hyperparams.filter(
                  (hp) => hp.type === HyperparamTypes.Categorical
                ).length
              }
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Overview;

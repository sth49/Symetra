import {
  Box,
  Grid,
  GridItem,
  Heading,
  Tag,
  TagLabel,
  Text,
} from "@chakra-ui/react";

interface OverviewProps {
  data: any;
}

const Overview = (data: OverviewProps) => {
  console.log(data);
  return (
    <Box height="200px" margin={1} bg={"white"} p={2}>
      <Heading as="h5" size="sm" color={"gray.600"} padding={2}>
        Overview
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
      <Box display={"flex"} flexDir={"row"} pl={2} pt={1}>
        <Box pr={2}>
          <Text fontSize="sm"># of Trials:</Text>
        </Box>
        <Box>
          <Text fontSize="sm">{data.data.trials.length}</Text>
        </Box>
      </Box>
      <Box display={"flex"} flexDir={"row"} pl={2} pt={1}>
        <Box pr={2}>
          <Text fontSize="sm"># of Attributes:</Text>
        </Box>
        <Box>
          <Text fontSize="sm">{data.data.hyperparams.length}</Text>
        </Box>
      </Box>
    </Box>
  );
};

export default Overview;

import { Box, Heading } from "@chakra-ui/react";

const GroupComparisonView = () => {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      {/* <h1>Group Comparison View</h1> */}
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Group Comparison View
        </Heading>
      </Box>
    </div>
  );
};

export default GroupComparisonView;

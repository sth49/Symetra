import { Box, Heading } from "@chakra-ui/react";

const AnalysisView = () => {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Analysis View
        </Heading>
      </Box>
    </div>
  );
};

export default AnalysisView;

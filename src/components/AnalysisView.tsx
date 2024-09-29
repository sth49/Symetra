import { Box, Heading } from "@chakra-ui/react";
import { useCustomStore } from "../store";

const AnalysisView = () => {
  const { selectedGroup } = useCustomStore();
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Analysis View
        </Heading>
      </Box>
      <Box>
        {selectedGroup && (
          <Heading as="h6" size="xs" color="gray.600" p={2}>
            Selected Group: {selectedGroup}
          </Heading>
        )}
      </Box>
    </div>
  );
};

export default AnalysisView;

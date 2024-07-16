import { Box, Heading } from "@chakra-ui/react";

const GroupView = () => {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box>
        <Heading as="h5" size="sm" color="gray.600" p={4}>
          Groups
        </Heading>
      </Box>
    </div>
  );
};

export default GroupView;

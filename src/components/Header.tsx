import React from "react";
import { Box } from "@chakra-ui/react";
import { Text } from "@chakra-ui/react";
const Header = () => {
  return (
    <header>
      <Box bg="gray.200" w="100%" p={4}>
        <Text fontSize="2xl">
          {" "}
          Visualization for Hyperparameter Optimization
        </Text>
      </Box>
    </header>
  );
};
export default Header;

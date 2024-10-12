import { Box, Heading, IconButton, Text } from "@chakra-ui/react";
import { FaEdit } from "react-icons/fa";
import { useCustomStore } from "../store";
import { useState } from "react";
import { MdDelete } from "react-icons/md";
const GroupDetailView = () => {
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );
  const [mode, setMode] = useState("normal");

  return (
    <div style={{ height: "100%", width: "100%" }}>
      {/* <h1>Group Comparison View</h1> */}
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Group Comparison View
        </Heading>
        <Box display={"flex"} p={2}>
          <IconButton
            aria-label="Lasso"
            icon={<FaEdit />}
            onClick={() => {
              setMode(mode === "edit" ? "normal" : "edit");
            }}
            size="xs"
            colorScheme={mode === "edit" ? "red" : "blue"}
            mr={1}
          />
          <IconButton
            aria-label="Lasso"
            icon={<MdDelete />}
            size="xs"
            // colorScheme={"blue"}
            mr={1}
          />
        </Box>
      </Box>
      <Box height={`calc(100% - 36px)`} p={3} overflow={"auto"}>
        {currentSelectedGroup ? (
          <Heading as="h5" size="sm" color="gray.600" p={2}>
            {currentSelectedGroup.name}
          </Heading>
        ) : (
          <Text fontSize="md">
            Please select one group from the Trial Group View
          </Text>
        )}
      </Box>
    </div>
  );
};

export default GroupDetailView;

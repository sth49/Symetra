import {
  Box,
  ButtonGroup,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  Heading,
  IconButton,
  Input,
  Text,
  useEditableControls,
} from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { useEffect, useState } from "react";
import { MdDelete } from "react-icons/md";
import { formatting } from "../model/utils";
import { CheckIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
const GroupDetailView = () => {
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  const groups = useCustomStore((state) => state.groups);

  const setCurrentSelectedGroup = useCustomStore(
    (state) => state.setCurrentSelectedGroup
  );

  const setGroups = useCustomStore((state) => state.setGroups);
  const [editName, setEditName] = useState(
    currentSelectedGroup ? currentSelectedGroup.name : ""
  );

  useEffect(() => {
    console.log("current selected group", currentSelectedGroup);
  }, [currentSelectedGroup]);

  function EditableControls() {
    const {
      isEditing,
      getSubmitButtonProps,
      getCancelButtonProps,
      getEditButtonProps,
    } = useEditableControls();

    return isEditing ? (
      <ButtonGroup justifyContent="center" size="sm">
        <IconButton
          size={"xs"}
          aria-label="Submit"
          icon={<CheckIcon />}
          // {...getSubmitButtonProps()}
          onClick={() => {
            getSubmitButtonProps();
            const editGroup = currentSelectedGroup.clone();
            editGroup.editName(editName);
            setCurrentSelectedGroup(editGroup);
            const editGroups = groups.clone();
            editGroups.editGroup(editGroup);
            setGroups(editGroups);
          }}
        />
        <IconButton
          size={"xs"}
          aria-label="Cancel"
          icon={<CloseIcon />}
          {...getCancelButtonProps()}
        />
      </ButtonGroup>
    ) : (
      <Flex justifyContent="center">
        <IconButton
          aria-label="Edit"
          size="xs"
          colorScheme={"blue"}
          icon={<EditIcon />}
          {...getEditButtonProps()}
        />
      </Flex>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      {/* <h1>Group Comparison View</h1> */}
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Group Detail View
        </Heading>
        <Box display={"flex"} p={2}>
          <IconButton
            aria-label="Lasso"
            icon={<MdDelete />}
            size="xs"
            // colorScheme={"blue"}
            mr={1}
          />
        </Box>
      </Box>
      <Box height={`calc(100% - 36px)`} p={2} pt={0} overflow={"auto"}>
        {currentSelectedGroup ? (
          <Box display={"flex"} width={"100%"} height={"100%"}>
            <Box width={"50%"}>
              <Box
                // width={"40%"}
                height={"100%"}
                display={"flex"}
                flexDir={"column"}
                justifyContent={"space-evenly"}
              >
                <Box display={"flex"} justifyContent={"space-between"}>
                  <Text fontSize="sm" fontWeight={"bold"} color="gray.600">
                    Group Name
                  </Text>
                  <Editable
                    textAlign="center"
                    // defaultValue={currentSelectedGroup.name}
                    defaultValue={editName}
                    fontSize="sm"
                    isPreviewFocusable={false}
                    display={"flex"}
                    justifyContent={"space-between"}
                    alignItems={"center"}
                    width={"50%"}
                  >
                    <EditablePreview p={0} pr={2} />
                    <Input as={EditableInput} size={"xs"} p={0} pr={2} />
                    <EditableControls />
                  </Editable>
                </Box>

                <Box display={"flex"} justifyContent={"space-between"}>
                  <Text fontSize="sm" fontWeight={"bold"} color="gray.600">
                    Trial Counts
                  </Text>
                  <Text fontSize="sm" align={"right"}>
                    {formatting(currentSelectedGroup.trials.length, "int")}
                  </Text>
                </Box>
                <Box display={"flex"} justifyContent={"space-between"}>
                  <Text fontSize="sm" fontWeight={"bold"} color="gray.600">
                    Maximum CVRG
                  </Text>
                  <Text fontSize="sm" align={"right"}>
                    {formatting(currentSelectedGroup.getStats().max, "int")}
                  </Text>
                </Box>
                <Box display={"flex"} justifyContent={"space-between"}>
                  <Text fontSize="sm" fontWeight={"bold"} color="gray.600">
                    Averge CVRG
                  </Text>
                  <Text fontSize="sm" align={"right"}>
                    {formatting(currentSelectedGroup.getStats().avg, "float")}
                  </Text>
                </Box>
                <Box display={"flex"} justifyContent={"space-between"}>
                  <Text fontSize="sm" fontWeight={"bold"} color="gray.600">
                    Minimun CVRG
                  </Text>
                  <Text fontSize="sm" align={"right"}>
                    {formatting(currentSelectedGroup.getStats().min, "int")}
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>
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

import {
  Box,
  Button,
  ButtonGroup,
  Icon,
  IconButton,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { useEffect, useRef, useState } from "react";
import { MdDelete } from "react-icons/md";
import { formatting } from "../model/utils";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { useConstDataStore } from "./store/constDataStore";
import { IoMdCheckboxOutline } from "react-icons/io";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { MdEdit } from "react-icons/md";
import { calculateCorrelation } from "../model/correlation";
import MetricBadge from "./MetricBadge";
import SelectIcon from "./SelectIcon";
const GroupDetailView = () => {
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );
  const groups = useCustomStore((state) => state.groups);
  const setCurrentSelectedGroup = useCustomStore(
    (state) => state.setCurrentSelectedGroup
  );

  const setSelectFlag = useCustomStore((state) => state.setSelectFlag);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  const setGroups = useCustomStore((state) => state.setGroups);
  const [editName, setEditName] = useState("");
  const [mode, setMode] = useState("view");

  const { exp } = useConstDataStore();

  useEffect(() => {
    if (currentSelectedGroup) {
      setEditName(currentSelectedGroup.name);
      calculateCorrelation(
        currentSelectedGroup.trials,
        exp.hyperparams[5],
        exp.hyperparams[2]
      );
    }
  }, [currentSelectedGroup, exp.hyperparams]);

  return (
    <Box p={2} pt={1} height={"35px"}>
      {currentSelectedGroup ? (
        <Box
          width={"100%"}
          height={"100%"}
          display={"flex"}
          flexDir={"column"}
          justifyContent={"space-between"}
        >
          <Box display={"flex"} justifyContent={"space-between"} width={"100%"}>
            {mode === "view" ? (
              <Box display={"flex"} alignItems={"center"} width={"120px"}>
                <Text
                  fontSize="xs"
                  align={"right"}
                  pr={2}
                  fontWeight={"bold"}
                  color={"gray.600"}
                  display={"flex"}
                  alignItems={"center"}
                >
                  {/* <SelectIcon type="g1" /> */}
                  {currentSelectedGroup.name}{" "}
                  {/* {`(${formatting(currentSelectedGroup.trials.length, "int")})`} */}
                </Text>
                <IconButton
                  variant={"outline"}
                  aria-label="Delete"
                  icon={<MdEdit />}
                  colorScheme={"blue"}
                  size="xs"
                  onClick={() => setMode("edit")}
                />
              </Box>
            ) : (
              <Box
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                width={"120px"}
              >
                <input
                  style={{
                    width: "50%",
                    fontSize: "14px",
                  }}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <ButtonGroup>
                  <IconButton
                    aria-label="Save"
                    variant={"outline"}
                    icon={<CheckIcon />}
                    size={"xs"}
                    colorScheme={"blue"}
                    onClick={() => {
                      const newCurrentSelectedGroup =
                        currentSelectedGroup.clone();
                      newCurrentSelectedGroup.editName(editName);
                      setCurrentSelectedGroup(newCurrentSelectedGroup);
                      const newGroups = groups.clone();
                      newGroups.editGroup(newCurrentSelectedGroup);
                      setGroups(newGroups);
                      setMode("view");
                    }}
                  />
                  <IconButton
                    size={"xs"}
                    aria-label="Cancel"
                    variant={"outline"}
                    icon={<CloseIcon />}
                    onClick={() => setMode("view")}
                    colorScheme={"red"}
                  />
                </ButtonGroup>
              </Box>
            )}

            <Button
              size={"xs"}
              alignSelf={"center"}
              colorScheme={"blue"}
              variant={"outline"}
              onClick={() => {
                setSelectFlag(true);
              }}
            >
              <Icon mr={2} as={IoMdCheckboxOutline} />
              Select trials of this group in Trial View
            </Button>
            <Button
              size={"xs"}
              alignSelf={"center"}
              colorScheme={"blue"}
              onClick={onOpen}
              variant={"outline"}
            >
              <Icon mr={2} as={MdDelete} />
              Delete this group
            </Button>
          </Box>
        </Box>
      ) : (
        <Text fontSize="md">
          Please select one group from the Trial Group View
        </Text>
      )}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Group
            </AlertDialogHeader>

            <AlertDialogBody>
              Do you want to delete the group and all its trials? You can't undo
              this action afterwards.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => {
                  const newGroups = groups.clone();
                  newGroups.deleteGroup(currentSelectedGroup.id);
                  setCurrentSelectedGroup(newGroups.groups[0]);
                  setGroups(newGroups);
                  onClose();
                }}
                ml={3}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default GroupDetailView;

import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Heading,
  Icon,
  IconButton,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { useEffect, useRef, useState } from "react";
import { MdDelete } from "react-icons/md";
import { formatting, hexToRgb } from "../model/utils";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { useConstDataStore } from "./store/constDataStore";

import { TbCircleDotted, TbCircleFilled } from "react-icons/tb";
import { useMetricScale } from "../model/colorScale";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";

import { calculateCorrelation } from "../model/correlation";
const GroupDetailView = () => {
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );
  const groups = useCustomStore((state) => state.groups);
  const setCurrentSelectedGroup = useCustomStore(
    (state) => state.setCurrentSelectedGroup
  );

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  const setGroups = useCustomStore((state) => state.setGroups);
  const [editName, setEditName] = useState("");
  const [mode, setMode] = useState("view");

  const { exp } = useConstDataStore();

  const { metricScale, colorScale } = useMetricScale();

  useEffect(() => {
    if (currentSelectedGroup) {
      setEditName(currentSelectedGroup.name);
      calculateCorrelation(
        currentSelectedGroup.trials,
        exp.hyperparams[5],
        exp.hyperparams[2]
      );
    }
  }, [currentSelectedGroup]);

  return (
    <Box style={{ height: "100%", width: "100%" }} p={1}>
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
              <Box display={"flex"} alignItems={"center"} width={"50%"}>
                <Text
                  fontSize="sm"
                  align={"right"}
                  pr={2}
                  onClick={() => setMode("edit")}
                  fontWeight={"bold"}
                  color={"gray.600"}
                  display={"flex"}
                  alignItems={"center"}
                >
                  <Box position="relative" width="24px" height="24px">
                    <Icon
                      as={TbCircleFilled}
                      color={colorScale(
                        metricScale(currentSelectedGroup.getStats().avg)
                      )}
                      opacity={0.7}
                      position="absolute"
                      left="50%"
                      top="50%"
                      transform="translate(-50%, -50%)"
                    />
                    <Icon
                      as={TbCircleDotted}
                      color={"gray.600"}
                      position="absolute"
                      left="50%"
                      top="50%"
                      transform="translate(-50%, -50%)"
                    />
                  </Box>
                  {currentSelectedGroup.name}{" "}
                  {`(${formatting(currentSelectedGroup.trials.length, "int")})`}
                </Text>
                <IconButton
                  aria-label="Delete"
                  icon={<MdDelete />}
                  size="xs"
                  onClick={onOpen}
                />
              </Box>
            ) : (
              <Box
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                width={"50%"}
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
                    icon={<CloseIcon />}
                    onClick={() => setMode("view")}
                    colorScheme={"red"}
                  />
                </ButtonGroup>
              </Box>
            )}
            <Box
              display={"flex"}
              justifyContent={"space-between"}
              width={"50%"}
              pl={2}
            >
              <Text fontSize="sm" fontWeight={"bold"} color="gray.600">
                Mean Coverage
              </Text>
              <Badge
                backgroundColor={`rgba(${hexToRgb(
                  colorScale(metricScale(currentSelectedGroup.getStats().avg))
                ).join(", ")}, 0.7)`}
                color={"black"}
                display={"flex"}
                alignItems={"center"}
                fontWeight={"normal"}
              >
                {formatting(currentSelectedGroup.getStats().avg, "float")}
              </Badge>
            </Box>
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

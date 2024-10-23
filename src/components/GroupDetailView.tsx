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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdDelete } from "react-icons/md";
import { formatting, hexToRgb } from "../model/utils";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { useConstDataStore } from "./store/constDataStore";
import BarChart from "./BarChart";
import { useMetricScale } from "../model/colorScale";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import {
  getAttributeSilhouetteCoefficient,
  getBranchSilhouetteCoefficient,
} from "../model/silhouetteCoefficient";
import { FaLightbulb } from "react-icons/fa";
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

  const { exp, hyperparams } = useConstDataStore();
  const [trialIds, setTrialIds] = useState<number[]>([]);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "none", // ascending or descending
  });
  const [sortedData, setSortedData] = useState([]);
  const { metricScale, colorScale } = useMetricScale();
  const requestSort = useCallback((key) => {
    setSortConfig((prevConfig) => ({
      key:
        prevConfig.key === key && prevConfig.direction === "descending"
          ? null
          : key,
      direction:
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }, []);

  const data = useMemo(
    () =>
      exp?.hyperparams
        .sort(
          (a, b) =>
            Math.abs(b.getEffect(trialIds)) - Math.abs(a.getEffect(trialIds))
        )
        .map((hp, index) => ({
          id: index,
          name: hp.displayName,
          fullName: hp.name,
          displayName: hp.displayName,
          effect: hp.getEffect(trialIds),
          trialIds: trialIds,
          dist: hp.name,
          type: hp.type,
        })),

    [exp, trialIds]
  );

  useEffect(() => {
    let sortedItems = [...data];
    if (sortConfig.key !== null) {
      sortedItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    setSortedData(sortedItems);
  }, [data, sortConfig]);

  useEffect(() => {
    if (currentSelectedGroup) {
      setEditName(currentSelectedGroup.name);
      setTrialIds(currentSelectedGroup.trials.map((trial) => trial.id));
      // console.log(
      //   getBranchSilhouetteCoefficient(
      //     exp.trials,
      //     currentSelectedGroup.trials,
      //     exp.metric.totalBranch
      //   )
      // );
      calculateCorrelation(
        currentSelectedGroup.trials,
        exp.hyperparams[5],
        exp.hyperparams[2]
      );
    }
  }, [currentSelectedGroup]);

  const columns = useMemo(
    () => [
      { key: "name", label: "Name", width: 65, align: "left" },
      { key: "effect", label: "Effect", width: 45, align: "right" },
      {
        key: "dist",
        label: "Distribution",
        width: 100,
        align: "center",
      },
    ],
    [exp]
  );

  return (
    <Box style={{ height: "100%", width: "100%" }} p={2}>
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
              <Box
                display={"flex"}
                alignItems={"center"}
                width={"50%"}
                justifyContent={"space-between"}
              >
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
                  <Icon as={FaLightbulb} color={"gray.600"} mr={1} />
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
                      console.log(newGroups);
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
                Mean CVRG
              </Text>
              <Badge
                backgroundColor={`rgba(${hexToRgb(
                  colorScale(metricScale(currentSelectedGroup.getStats().avg))
                ).join(", ")}, 0.5)`}
                color={"black"}
                display={"flex"}
                alignItems={"center"}
              >
                {formatting(currentSelectedGroup.getStats().avg, "float")}
              </Badge>
            </Box>
          </Box>
          <Box display={"flex"} justifyContent={"space-between"} width={"100%"}>
            <Text fontSize="sm" fontWeight={"bold"} color="gray.600">
              Silhouette Coefficient (Branch)
            </Text>
            <Text fontSize="sm" align={"right"}></Text>
          </Box>
          <Box display={"flex"} justifyContent={"space-between"} width={"100%"}>
            <Text fontSize="sm" fontWeight={"bold"} color="gray.600">
              Silhouette Coefficient (Hyperparameter)
            </Text>
            <Text fontSize="sm" align={"right"}></Text>
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
                  setGroups(newGroups);
                  setCurrentSelectedGroup(null);
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

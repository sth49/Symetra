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
import { formatting } from "../model/utils";
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
        exp.hyperparams[6],
        exp.hyperparams[11]
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

  const totalWidth = useMemo(
    () => columns.reduce((sum, col) => sum + col.width, 0),
    [columns]
  );

  const Row = useCallback(({ item, index }) => {
    // const isSelected = selectedRows.has(item.id);
    // const isExpanded = expandedRows.has(item.id);
    // const isLastSelected =
    //   selectedRows.size > 0 &&
    //   Array.from(selectedRows).sort((a, b) => data[a].id - data[b].id)[
    //     selectedRows.size - 1
    //   ] === index;
    const hp = hyperparams.find((hp) => hp.displayName === item.name);
    const hparamIcon = hp?.icon;

    return (
      <>
        <div
          className={`hyperparameter-table-row`}
          style={{
            display: "flex",
            width: totalWidth,
            alignItems: "center",
          }}
          // onClick={(e) => toggleRowSelection(index, e.shiftKey)}
        >
          {columns.map((column) => (
            <div
              key={column.key}
              style={{
                width: `${column.width}px`,
                padding: "2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flexShrink: 0,
                display: "flex",
                justifyContent: column.align,
              }}
            >
              {column.key === "dist" ? (
                <BarChart
                  dist={item.dist}
                  trialIds={item.trialIds}
                  width={90}
                  height={30}
                />
              ) : column.key === "name" ? (
                <Box
                  display={"flex"}
                  alignItems={"center"}
                  // onMouseEnter={(e) => {
                  //   showTooltip({
                  //     tooltipLeft: e.clientX,
                  //     tooltipTop: e.clientY,
                  //     tooltipData: { key: item.fullName, value: item.name },
                  //   });
                  // }}
                  // onMouseLeave={hideTooltip}
                >
                  <Text
                    userSelect={"none"}
                    display={"flex"}
                    alignItems={"center"}
                  >
                    <Icon as={hparamIcon} mr={1} color={"gray.600"} />
                    {item[column.key]}
                  </Text>
                </Box>
              ) : column.key === "effect" ? (
                <Text userSelect={"none"}>{item[column.key].toFixed(1)}</Text>
              ) : column.key === "expander" ? (
                <IconButton
                  size={"xs"}
                  // icon={
                  //   !isExpanded ? (
                  //     <Icon as={FaAngleDown} color={"gray.500"} />
                  //   ) : (
                  //     <Icon as={FaAngleUp} color={"gray.500"} />
                  //   )
                  // }
                  // onClick={(e) => toggleRowExpansion(item.id, e)}
                  aria-label={""}
                />
              ) : (
                <div>asdf</div>
              )}
            </div>
          ))}
        </div>

        {/* {isExpanded && (
          <div style={{ padding: "10px", backgroundColor: "#f9f9f9" }}>
            <HparamExtended item={item} />
          </div>
        )} */}
        {/* {isSelected && isLastSelected && (
            <Box
              display={"flex"}
              width={"100%"}
              justifyContent={"space-between"}
              p={"10px 0"}
              bgColor={"#f9f9f9"}
            >
              <Button
                size={"xs"}
                width={"48%"}
                height={"40px"}
                isDisabled={selectedRows.size === 0}
                onClick={() => toggleVisibilityForSelected(true)}
                colorScheme="blue"
                whiteSpace="normal"
                display={"flex"}
                wordBreak="break-word"
                ml={0.5}
                fontSize={"10px"}
              >
                <Icon as={FaEye} />
                Show selected hyperparameters ({selectedRows.size})
              </Button>
              <Button
                size={"xs"}
                width={"48%"}
                height={"40px"}
                isDisabled={selectedRows.size === 0}
                onClick={() => toggleVisibilityForSelected(false)}
                colorScheme="blue"
                display={"flex"}
                whiteSpace="normal"
                wordBreak="break-word"
                mr={0.5}
                fontSize={"10px"}
              >
                <Icon as={FaEyeSlash} />
                Hide selected hyperparameters ({selectedRows.size})
              </Button>
            </Box>
          )} */}
      </>
    );
  }, []);

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
                width={"100%"}
                justifyContent={"space-between"}
              >
                <Text
                  fontSize="sm"
                  align={"right"}
                  pr={2}
                  onClick={() => setMode("edit")}
                  fontWeight={"bold"}
                  color={"gray.600"}
                >
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
                width={"100%"}
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
          </Box>
          <Box
            display={"flex"}
            justifyContent={"space-between"}
            // width={"50%"}
            // pr={2}
          >
            <Text fontSize="sm" fontWeight={"bold"} color="gray.600">
              Mean CVRG
            </Text>
            {/* <Text
              fontSize="sm"
              align={"right"}
              backgroundColor={colorScale(
                metricScale(currentSelectedGroup.getStats().avg + 1000)
              )}
              color={"white"}
            >
              {formatting(currentSelectedGroup.getStats().avg, "float")}
            </Text> */}
            <Badge
              backgroundColor={colorScale(
                metricScale(currentSelectedGroup.getStats().avg)
              )}
              color={"white"}
            >
              {formatting(currentSelectedGroup.getStats().avg, "float")}
            </Badge>
          </Box>
          <Box display={"flex"} justifyContent={"space-between"} width={"100%"}>
            <Text fontSize="sm" fontWeight={"bold"} color="gray.600">
              Silhouette Coefficient
            </Text>
            <Text fontSize="sm" align={"right"}>
              {/* {formatting(
                currentSelectedGroup
                  ? getBranchSilhouetteCoefficient(
                      exp.trials,
                      currentSelectedGroup.trials,
                      exp.metric.totalBranch
                    )
                  : 0,
                "float"
              )} */}
            </Text>
            <Text fontSize="sm" fontWeight={"bold"} color="gray.600">
              Silhouette Coefficient
            </Text>
            <Text fontSize="sm" align={"right"}>
              {/* {formatting(
                currentSelectedGroup
                  ? getAttributeSilhouetteCoefficient(
                      exp.trials,
                      currentSelectedGroup.trials,
                      exp.hyperparams
                    )
                  : 0,
                "float"
              )} */}
            </Text>
          </Box>
          {/* <Box width={"50%"} height={"100%"} pl={2}>
              <AutoSizer>
                {({ height, width }) => (
                  <div
                    style={{
                      height: height,
                      width,
                      overflowX: "auto",
                      overflowY: "hidden",
                      // padding: "2px 2px",
                    }}
                    // ref={scrollContainerRef}
                    // onScroll={handleScroll}
                  >
                    <div style={{ width: totalWidth }}>
                      <div
                        // ref={headerRef}
                        style={{
                          display: "flex",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                          backgroundColor: "white",
                        }}
                      >
                        {columns.map((column) => (
                          <div
                            key={column.key}
                            style={{
                              display: "flex",
                              width: `${column.width}px`,
                              padding: "2px",
                              borderBottom: "1px solid #ddd",
                              cursor: "pointer",
                              flexShrink: 0,
                              justifyContent: column.align,
                              alignItems: "center",
                              height: "35px",
                              fontSize: "smaller",
                            }}
                            onClick={() => {
                              if (
                                column.key === "name" ||
                                column.key === "effect"
                              ) {
                                requestSort(column.key);
                              }
                            }}
                          >
                            {(column.key === "name" ||
                              column.key === "effect") && (
                              <Icon
                                color={"gray"}
                                width={2}
                                mr={1}
                                as={
                                  sortConfig.key === column.key
                                    ? sortConfig.direction === "ascending"
                                      ? FaSortUp
                                      : FaSortDown
                                    : FaSort
                                }
                              />
                            )}
                            <Text fontWeight={"bold"}>{column.label}</Text>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div
                      className={`hyperparameter-table`}
                      style={{
                        height: height,
                        overflowY: "scroll",
                        overflowX: "hidden",
                        position: "relative",
                      }}
                    >
                      {sortedData.map((item, index) => (
                        <Row key={item.id} item={item} index={index} />
                      ))}
                    </div>
                  </div>
                )}
              </AutoSizer>
            </Box> */}
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

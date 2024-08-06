import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Icon,
  IconButton,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { formatting, generateBinnedData } from "../model/utils";
import { ViolinPlot } from "@visx/stats";
import { CloseIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { Trial } from "../model/trial";
import { mean, standardDeviation as std, quantile } from "simple-statistics";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import StatTest from "./StatTest";

const GroupView = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    groups,
    setHoveredGroup,
    setGroups,
    setSelectedGroup,
    selectedGroup,
    hyperparams,
    exp,
  } = useCustomStore();

  const setHoverGroup = (group) => {
    if (!group) {
      setHoveredGroup(new Set());
      return;
    }
    const selected = new Set(group.trials.map((trial) => trial.id));
    setHoveredGroup(selected);
  };

  // if (groups.length) {
  //   console.log(calculateCorrelation(groups[0].trials));
  // }
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box height={"10%"} display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={4}>
          Groups
        </Heading>

        <Button
          m={2}
          size={"sm"}
          isDisabled={selectedGroup.size === 0}
          colorScheme="blue"
          onClick={() => {
            if (selectedGroup.size === 0) {
              return;
            } else if (selectedGroup.size === 1) {
              console.log("Single group selected");
              onOpen();
            } else if (selectedGroup.size === 2) {
              onOpen();
            }
          }}
        >
          Analysis
        </Button>
      </Box>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setSelectedGroup(new Set());
          onClose();
        }}
        size={"full"}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text fontSize="lg">Analysis</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box>
              <Text fontWeight={"bold"}>
                {selectedGroup.size === 1
                  ? "Group " + Array.from(selectedGroup)[0] + " vs Others"
                  : "Group " +
                    Array.from(selectedGroup)[0] +
                    " vs Group" +
                    Array.from(selectedGroup)[1]}
              </Text>
              <Text></Text>
              <Text></Text>
              <Text></Text>
            </Box>
            <StatTest
              isOpen={isOpen}
              selectedGroup={selectedGroup}
              groups={groups}
              hyperparams={hyperparams}
              exp={exp}
            />
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => {
                setSelectedGroup(new Set());
                onClose();
              }}
            >
              Close
            </Button>
            <Button variant="ghost">Secondary Action</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {groups?.getLength() > 0 ? (
        <Box
          width={"100%"}
          overflowX={"auto"}
          height="90%" // 뷰포트 높이에서 적절한 값을 뺀 높이
          p={2}
          display="flex"
        >
          {groups?.groups.map((group, idx) => {
            console.log(group);
            const coverages = group.trials.map((trial) => trial.metric);

            let { binData, yScale } = generateBinnedData(
              coverages,
              100,
              150,
              "y"
            );

            return (
              <Card key={idx} m={2} height={"95%"} width={"150px"}>
                <CardHeader
                  display={"flex"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                >
                  <input
                    type="checkbox"
                    onClick={() => {
                      if (selectedGroup.has(group.id)) {
                        selectedGroup.delete(group.id);
                      } else {
                        if (selectedGroup.size === 2) {
                          selectedGroup.delete(
                            selectedGroup.values().next().value
                          );
                        }
                        selectedGroup.add(group.id);
                      }
                      setSelectedGroup(selectedGroup);
                      console.log(selectedGroup);
                    }}
                    checked={selectedGroup.has(group.id)}
                  ></input>
                  <Text fontSize="md">
                    {group.id} ({group.trials.length})
                  </Text>
                  <CloseIcon
                    w={3}
                    h={3}
                    onClick={() => {
                      groups.deleteGroup(group.id);
                      setGroups(groups);
                    }}
                  />
                </CardHeader>
                <CardBody
                  onMouseEnter={() => setHoverGroup(group)}
                  onMouseLeave={() => setHoverGroup(null)}
                >
                  <svg width={100} height={150}>
                    <ViolinPlot
                      data={binData}
                      stroke="#ECC94B"
                      left={0}
                      width={100}
                      valueScale={yScale}
                      fill="#F6E05E"
                    />
                  </svg>
                  <Box mt={4}>
                    <Text fontSize="sm">Min : {Math.min(...coverages)}</Text>
                    <Text fontSize="sm">
                      Mean:{" "}
                      {formatting(
                        coverages.reduce((a, b) => a + b, 0) / coverages.length,
                        false
                      )}
                    </Text>
                    <Text fontSize="sm">Max : {Math.max(...coverages)}</Text>
                  </Box>
                </CardBody>
              </Card>
            );
          })}
        </Box>
      ) : (
        <Box p={4} bg="gray.100" m={2} height={"85%"}>
          There are no groups to display. Pleas create a group by clicking the
          "+ Group" button.
        </Box>
      )}
    </div>
  );
};

export default GroupView;

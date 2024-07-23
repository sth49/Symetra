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
import CorrelationHeatmap from "./CorrelationHeatmap";
function calculateCorrelation(group: Trial[]) {
  const params = Object.keys(group[0].params);
  console.log(params);
  const correlationMatrix: { [key: string]: { [key: string]: number } } = {};
  params.forEach((param) => {
    correlationMatrix[param] = {};
  });

  for (let i = 0; i < params.length; i++) {
    correlationMatrix[params[i]] = {};
    for (let j = i; j < params.length; j++) {
      const param1 = params[i];
      const param2 = params[j];

      // console.log(param1, param2);

      let correlation: number;

      if (
        typeof group[0].params[param1] === "number" &&
        typeof group[0].params[param2] === "number"
      ) {
        // console.log("number and number");
        correlation = pearsonCorrelation(group, param1, param2);
      } else if (
        typeof group[0].params[param1] === "boolean" &&
        typeof group[0].params[param2] === "boolean"
      ) {
        // console.log("boolean and boolean");
        correlation = phiCoefficient(group, param1, param2);
      } else if (
        typeof group[0].params[param1] === "string" &&
        typeof group[0].params[param2] === "string"
      ) {
        // console.log("string and string");
        correlation = cramersV(group, param1, param2);
      } else if (
        (typeof group[0].params[param1] === "number" &&
          typeof group[0].params[param2] === "boolean") ||
        (typeof group[0].params[param1] === "boolean" &&
          typeof group[0].params[param2] === "number")
      ) {
        // console.log("number and boolean");
        // console.log(
        //   typeof group[0].params[param1],
        //   typeof group[0].params[param2]
        // );
        correlation = pointBiserialCorrelation(group, param1, param2);
      } else {
        correlation = 0; // 다른 조합의 경우 상관관계를 0으로 설정
      }

      correlationMatrix[param1][param2] = correlation;
      correlationMatrix[param2][param1] = correlation;
    }
  }

  return correlationMatrix;
}

function pearsonCorrelation(
  group: Trial[],
  param1: string,
  param2: string
): number {
  const values1 = group.map((trial) => trial.params[param1] as number);
  const values2 = group.map((trial) => trial.params[param2] as number);

  const mean1 = mean(values1);
  const mean2 = mean(values2);
  const std1 = std(values1);
  const std2 = std(values2);

  const covariance =
    values1.reduce(
      (sum, _, i) => sum + (values1[i] - mean1) * (values2[i] - mean2),
      0
    ) / values1.length;

  return covariance / (std1 * std2);
}

function phiCoefficient(
  group: Trial[],
  param1: string,
  param2: string
): number {
  const n11 = group.filter(
    (trial) => trial.params[param1] === true && trial.params[param2] === true
  ).length;
  const n10 = group.filter(
    (trial) => trial.params[param1] === true && trial.params[param2] === false
  ).length;
  const n01 = group.filter(
    (trial) => trial.params[param1] === false && trial.params[param2] === true
  ).length;
  const n00 = group.filter(
    (trial) => trial.params[param1] === false && trial.params[param2] === false
  ).length;

  const n1_ = n11 + n10;
  const n0_ = n01 + n00;
  const n_1 = n11 + n01;
  const n_0 = n10 + n00;
  const n = n11 + n10 + n01 + n00;

  // console.log((n11 * n00 - n10 * n01) / Math.sqrt(n1_ * n0_ * n_1 * n_0));

  return (n11 * n00 - n10 * n01) / Math.sqrt(n1_ * n0_ * n_1 * n_0);
}

function cramersV(group: Trial[], param1: string, param2: string): number {
  const categories1 = [...new Set(group.map((trial) => trial.params[param1]))];
  const categories2 = [...new Set(group.map((trial) => trial.params[param2]))];

  const contingencyTable = categories1.map((cat1) =>
    categories2.map(
      (cat2) =>
        group.filter(
          (trial) =>
            trial.params[param1] === cat1 && trial.params[param2] === cat2
        ).length
    )
  );

  const chiSquare = calculateChiSquare(contingencyTable);
  const n = group.length;
  const minDimension = Math.min(categories1.length, categories2.length);

  return Math.sqrt(chiSquare / (n * (minDimension - 1)));
}

function calculateChiSquare(contingencyTable: number[][]): number {
  const rowSums = contingencyTable.map((row) => row.reduce((a, b) => a + b, 0));
  const colSums = contingencyTable[0].map((_, i) =>
    contingencyTable.reduce((sum, row) => sum + row[i], 0)
  );
  const total = rowSums.reduce((a, b) => a + b, 0);

  return contingencyTable.reduce((chi, row, i) => {
    return (
      chi +
      row.reduce((rowChi, cell, j) => {
        const expected = (rowSums[i] * colSums[j]) / total;
        return rowChi + Math.pow(cell - expected, 2) / expected;
      }, 0)
    );
  }, 0);
}

function pointBiserialCorrelation(
  group: Trial[],
  param1: string,
  param2: string
): number {
  const [numericParam, booleanParam] =
    typeof group[0].params[param1] === "number"
      ? [param1, param2]
      : [param2, param1];

  const numericValues = group.map(
    (trial) => trial.params[numericParam] as number
  );
  const booleanValues = group.map(
    (trial) => trial.params[booleanParam] as boolean
  );

  const meanTrue = mean(numericValues.filter((_, i) => booleanValues[i]));
  const meanFalse = mean(numericValues.filter((_, i) => !booleanValues[i]));
  const stdDev = std(numericValues);

  const proportionTrue =
    booleanValues.filter((v) => v).length / booleanValues.length;

  return (
    ((meanTrue - meanFalse) / stdDev) *
    Math.sqrt(proportionTrue * (1 - proportionTrue))
  );
}

// 사용 예:
// const correlationMatrix = calculateCorrelation(group);
// console.log(correlationMatrix);

const GroupView = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    groups,
    setHoveredGroup,
    setGroups,
    setSelectedGroup,
    selectedGroup,
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
              console.log("More than 2 groups selected");
            }
          }}
        >
          Analysis
        </Button>
      </Box>
      <Modal isOpen={isOpen} onClose={onClose} size={"full"}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text fontSize="lg">Analysis</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="md">
              The correlation matrix of the selected groups is shown below:
            </Text>
            {/* <Text fontSize="md">{calculateCorrelation(groups[0].trials)}</Text> */}
            {isOpen && selectedGroup.size !== 0 ? (
              <CorrelationHeatmap
                correlationMatrix={calculateCorrelation(
                  groups.filter((group) => selectedGroup.has(group.id))[0]
                    .trials
                )}
                // width={600}
                // height={600}
              />
            ) : (
              <Text fontSize="md">Please select one or more groups</Text>
            )}
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant="ghost">Secondary Action</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {groups.length > 0 ? (
        <Box
          width={"100%"}
          overflowX={"auto"}
          height="90%" // 뷰포트 높이에서 적절한 값을 뺀 높이
          p={2}
          display="flex"
        >
          {groups.map((group, idx) => {
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
                        selectedGroup.add(group.id);
                      }
                      setSelectedGroup(selectedGroup);
                      console.log(selectedGroup);
                    }}
                  ></input>
                  <Text fontSize="md">
                    {group.id.slice(0, 3).toUpperCase()} ({group.trials.length})
                  </Text>
                  <CloseIcon
                    w={3}
                    h={3}
                    onClick={() => {
                      const newGroups = groups.filter((g) => g.id !== group.id);
                      setGroups(newGroups);
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

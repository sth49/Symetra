import React from "react";
import { Box, Table, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { Group } from "../model/group";
import { performStatisticalTest } from "../model/statistic";
import { HyperparamTypes } from "../model/hyperparam";

interface StatTestProps {
  isOpen: boolean;
  selectedGroup: Set<string>;
  groups: any; // 정확한 타입을 지정해야 합니다
  hyperparams: any[]; // 정확한 타입을 지정해야 합니다
  exp: any; // 정확한 타입을 지정해야 합니다
}

const StatTest: React.FC<StatTestProps> = ({
  isOpen,
  selectedGroup,
  groups,
  hyperparams,
  exp,
}) => {
  if (!isOpen || selectedGroup.size === 0) {
    return <Text fontSize="md">Please select one or more groups</Text>;
  }

  let metricResult, hparamResults;

  let group1, group2;

  if (selectedGroup.size === 1) {
    const groupName = Array.from(selectedGroup)[0];
    group1 = groups.getGroup(groupName);
    const group1Trials = group1.trials;
    group2 = new Group(
      -1,
      //   exp.trials
      exp.trials.filter((t) => !group1Trials.includes(t))
    );

    metricResult = performStatisticalTest(
      group1.getCoverages(),
      group2.getCoverages(),
      HyperparamTypes.Numerical,
      exp.metric
    );
    hparamResults = hyperparams.map((param) =>
      performStatisticalTest(
        group1.getHyperparam(param.name),
        group2.getHyperparam(param.name),
        param.type,
        param
      )
    );
  }

  if (selectedGroup.size === 2) {
    const groupName1 = Array.from(selectedGroup)[0];
    const groupName2 = Array.from(selectedGroup)[1];
    group1 = groups.getGroup(groupName1);
    group2 = groups.getGroup(groupName2);

    metricResult = performStatisticalTest(
      group1.getCoverages(),
      group2.getCoverages(),
      HyperparamTypes.Numerical,
      exp.metric
    );
    hparamResults = hyperparams.map((param) =>
      performStatisticalTest(
        group1.getHyperparam(param.name),
        group2.getHyperparam(param.name),
        param.type,
        param
      )
    );
    // return (
    //   <>
    //     <Text>Numerical : T-Test</Text>
    //     <Box display={"flex"} overflow={"auto"}>
    //       <Box pr={2} mr={2} borderRight={"0.5px solid gray"}>
    //         <Text>Name</Text>
    //         <Text>p-val</Text>
    //         <Text> statistic</Text>
    //       </Box>
    //       <Box pr={2} mr={2} borderRight={"0.5px solid gray"}>
    //         <Text>{exp.metric.displayName}</Text>
    //         <Text>{Number(metricResult.pValue).toFixed(2)}</Text>
    //         <Text> {Number(metricResult.statistic).toFixed(2)}</Text>
    //       </Box>

    //       {hparamResults
    //         .filter((result) => result.param.type === HyperparamTypes.Numerical)
    //         .sort((a, b) => a.pValue - b.pValue)
    //         .map((result, index) => (
    //           <Box pr={2} mr={2} borderRight={"0.5px solid gray"} key={index}>
    //             <Text>{result.param.displayName}</Text>
    //             <Text>{Number(result.pValue).toFixed(2)}</Text>
    //             <Text> {Number(result.statistic).toFixed(2)}</Text>
    //           </Box>
    //         ))}
    //     </Box>

    //     <Text>Boolean: Fisher Exact Test</Text>
    //     <Box display={"flex"} overflow={"auto"}>
    //       <Box pr={2} mr={2} borderRight={"0.5px solid gray"}>
    //         <Text>Name</Text>
    //         <Text>p-val</Text>
    //       </Box>
    //       {hparamResults
    //         .filter((result) => result.param.type === HyperparamTypes.Boolean)
    //         .sort((a, b) => a.pValue - b.pValue)
    //         .map((result, index) => (
    //           <Box key={index} pr={2} mr={2} borderRight={"0.5px solid gray"}>
    //             <Text key={index}>{result.param.displayName}</Text>
    //             <Text key={index}>{Number(result.pValue).toFixed(2)}</Text>
    //           </Box>
    //         ))}
    //     </Box>
    //     <Text>Categorical : Chi-Square Test</Text>
    //     <Box display={"flex"} overflow={"auto"}>
    //       <Box pr={2} mr={2} borderRight={"0.5px solid gray"}>
    //         <Text>Name</Text>
    //         <Text>p-val</Text>
    //         <Text> statistic</Text>
    //       </Box>
    //       {hparamResults
    //         .filter(
    //           (result) => result.param.type === HyperparamTypes.Categorical
    //         )
    //         .sort((a, b) => a.pValue - b.pValue)
    //         .map((result, index) => (
    //           <Box pr={2} mr={2} borderRight={"0.5px solid gray"} key={index}>
    //             <Text>{result.param.displayName}</Text>
    //             <Text>{Number(result.pValue).toFixed(2)}</Text>
    //             <Text> {Number(result.statistic).toFixed(2)}</Text>
    //           </Box>
    //         ))}
    //     </Box>
    //   </>
    // );
  }
  if (metricResult === undefined || hparamResults === undefined) {
    return <Text fontSize="md">Please select only one or two groups</Text>;
  }
  return (
    <>
      <Text fontWeight={"bold"}>Statistical Test Results</Text>
      <Box display={"flex"}>
        <Box>
          <Text>Numerical : T-Test</Text>
          <Box display={"flex"} overflow={"auto"}>
            <Table width={"100px"}>
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Group</Th>
                  <Th>Max</Th>
                  <Th>Mean</Th>
                  <Th>Min</Th>
                  <Th>p-val</Th>
                  <Th>Statistic</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td rowSpan={2}>{exp.metric.displayName}</Td>
                  <Td>{Array.from(selectedGroup)[0]}</Td>
                  <Td>{group1.getHparamMax(exp.metric.name)}</Td>
                  <Td>{group1.getHparamMean(exp.metric.name)}</Td>
                  <Td>{group1.getHparamMin(exp.metric.name)}</Td>
                  <Td rowSpan={2}>{Number(metricResult.pValue).toFixed(4)}</Td>
                  <Td rowSpan={2}>
                    {Number(metricResult.statistic).toFixed(2)}
                  </Td>
                </Tr>
                <Tr>
                  <Td>
                    {selectedGroup.size === 2
                      ? Array.from(selectedGroup)[1]
                      : "others"}
                  </Td>
                  <Td>{group2.getHparamMax(exp.metric.name)}</Td>
                  <Td>{group2.getHparamMean(exp.metric.name)}</Td>
                  <Td>{group2.getHparamMin(exp.metric.name)}</Td>
                </Tr>
                {hparamResults
                  .filter(
                    (result) => result.param.type === HyperparamTypes.Numerical
                  )
                  .sort((a, b) => a.pValue - b.pValue)
                  .map((result, index) => (
                    <React.Fragment key={index}>
                      <Tr>
                        <Td rowSpan={2}>{result.param.displayName}</Td>
                        <Td>{Array.from(selectedGroup)[0]}</Td>
                        <Td>{group1.getHparamMax(result.param.name)}</Td>
                        <Td>{group1.getHparamMean(result.param.name)}</Td>
                        <Td>{group1.getHparamMin(result.param.name)}</Td>
                        <Td rowSpan={2}>{Number(result.pValue).toFixed(4)}</Td>
                        <Td rowSpan={2}>
                          {Number(result.statistic).toFixed(2)}
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          {selectedGroup.size === 2
                            ? Array.from(selectedGroup)[1]
                            : "others"}
                        </Td>
                        <Td>{group2.getHparamMax(result.param.name)}</Td>
                        <Td>{group2.getHparamMean(result.param.name)}</Td>
                        <Td>{group2.getHparamMin(result.param.name)}</Td>
                      </Tr>
                    </React.Fragment>
                  ))}
              </Tbody>
            </Table>

            {/* {hparamResults
          .filter((result) => result.param.type === HyperparamTypes.Numerical)
          .sort((a, b) => a.pValue - b.pValue)
          .map((result, index) => (
            <Box pr={2} mr={2} borderRight={"0.5px solid gray"} key={index}>
              <Text align={"center"}> {result.param.displayName}</Text>
              <Box display={"flex"}>
                <Text borderRight="1px solid gray" mr={1} pr={1}>
                  {Array.from(selectedGroup)[0]}
                </Text>
                <Text>
                  {selectedGroup.size === 2
                    ? Array.from(selectedGroup)[1]
                    : "others"}
                </Text>
              </Box>
              <Box display={"flex"}>
                <Text borderRight="1px solid gray" mr={1} pr={1}>
                  {group1.getHparamMax(result.param.name)}
                </Text>
                <Text>{group2.getHparamMax(result.param.name)}</Text>
              </Box>
              <Box display={"flex"}>
                <Text borderRight="1px solid gray" mr={1} pr={1}>
                  {group1.getHparamMean(result.param.name)}
                </Text>
                <Text>{group2.getHparamMean(result.param.name)}</Text>
              </Box>
              <Box display={"flex"}>
                <Text borderRight="1px solid gray" mr={1} pr={1}>
                  {group1.getHparamMin(result.param.name)}
                </Text>
                <Text>{group2.getHparamMin(result.param.name)}</Text>
              </Box>
              <Text>{Number(result.pValue).toFixed(2)}</Text>
              <Text>{Number(result.statistic).toFixed(2)}</Text>
            </Box>
          ))} */}
          </Box>
        </Box>
        <Box borderLeft={"1px solid #E2E8F0"}>
          <Text>Boolean: Fisher Exact Test</Text>
          <Box display={"flex"} overflow={"auto"}>
            <Table width={"100px"}>
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Group</Th>
                  <Th>Mean</Th>
                  <Th>p-val</Th>
                </Tr>
              </Thead>
              <Tbody>
                {hparamResults
                  .filter(
                    (result) => result.param.type === HyperparamTypes.Boolean
                  )
                  .sort((a, b) => a.pValue - b.pValue)
                  .map((result, index) => (
                    <React.Fragment key={index}>
                      <Tr>
                        <Td rowSpan={2}>{result.param.displayName}</Td>
                        <Td>{Array.from(selectedGroup)[0]}</Td>
                        <Td>{group1.getHparamMean(result.param.name)}</Td>
                        <Td rowSpan={2}>{Number(result.pValue).toFixed(4)}</Td>
                      </Tr>
                      <Tr>
                        <Td>
                          {selectedGroup.size === 2
                            ? Array.from(selectedGroup)[1]
                            : "others"}
                        </Td>
                        <Td>{group2.getHparamMean(result.param.name)}</Td>
                      </Tr>
                    </React.Fragment>
                  ))}
              </Tbody>
            </Table>
          </Box>
        </Box>
        <Box borderLeft={"1px solid #E2E8F0"}>
          <Text>Categorical : Chi-Square Test</Text>
          <Box display={"flex"} overflow={"auto"}>
            <Table width={"100px"}>
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Group</Th>
                  <Th>p-val</Th>
                  <Th>statistic</Th>
                </Tr>
              </Thead>
              <Tbody>
                {hparamResults
                  .filter(
                    (result) =>
                      result.param.type === HyperparamTypes.Categorical
                  )
                  .sort((a, b) => a.pValue - b.pValue)
                  .map((result, index) => (
                    <React.Fragment key={index}>
                      <Tr>
                        <Td rowSpan={2}>{result.param.displayName}</Td>
                        <Td>{Array.from(selectedGroup)[0]}</Td>
                        <Td rowSpan={2}>{Number(result.pValue).toFixed(4)}</Td>
                        <Td rowSpan={2}>
                          {Number(result.statistic).toFixed(2)}
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          {selectedGroup.size === 2
                            ? Array.from(selectedGroup)[1]
                            : "others"}
                        </Td>
                      </Tr>
                    </React.Fragment>
                  ))}
              </Tbody>
            </Table>

            {/* {hparamResults
              .filter(
                (result) => result.param.type === HyperparamTypes.Categorical
              )
              .sort((a, b) => a.pValue - b.pValue)
              .map((result, index) => (
                <Box pr={2} mr={2} borderRight={"0.5px solid gray"} key={index}>
                  <Text>{result.param.displayName}</Text>
                  <Text>{Number(result.pValue).toFixed(2)}</Text>
                  <Text> {Number(result.statistic).toFixed(2)}</Text>
                </Box>
              ))} */}
          </Box>
        </Box>
      </Box>
    </>
  );
  //   return <Text fontSize="md">Please select only one or two groups</Text>;
};

export default StatTest;

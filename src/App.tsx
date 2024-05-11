import Content from "./components/Content";
import Header from "./components/Header";
import React, { useState, useEffect, ReactNode } from "react";
import trialData from "./data/ParaSuit";
import configData from "./data/config";
import {
  CategoricalHyperparam,
  Hyperparam,
  HyperparamTypes,
  NumericalHyperparam,
} from "./model/hyperparam";
import { Experiment } from "./model/experiment";

import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Box,
} from "@chakra-ui/react";
function App() {
  const [exp, setExp] = useState<Experiment | null>(null);

  useEffect(() => {
    const experiment = Experiment.fromJson(configData, trialData);
    setExp(experiment);
    console.log(experiment);
  }, []);

  return (
    <>
      <Header />
      <Box p={2}>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th p={2}>id</Th>
                <Th p={2}>{exp?.metric.displayName}</Th>
                {exp?.hyperparams.map((hp: Hyperparam, index: number) => {
                  return (
                    <Th key={index} p={0} pr={2} pl={2}>
                      {hp.displayName}
                    </Th>
                  );
                })}
              </Tr>
            </Thead>
            <Tbody>
              {exp?.trials
                .sort((a, b) => b.metric - a.metric)
                .map((trial, index) => {
                  return (
                    <Tr key={index}>
                      <Td p={0}>{trial.id}</Td>
                      <Td p={0}>
                        <Box
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                        >
                          {trial.metric}
                        </Box>
                      </Td>
                      {exp?.hyperparams.map((hp, index) => {
                        if (hp instanceof CategoricalHyperparam) {
                          return (
                            <Td p={0} key={index}>
                              <Box
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                              >
                                <svg width={12} height={12}>
                                  <rect
                                    width={12}
                                    height={12}
                                    fill={hp.getColor(
                                      trial.params[hp.name] as string
                                    )}
                                  ></rect>
                                </svg>
                              </Box>
                            </Td>
                          );
                        } else if (hp instanceof NumericalHyperparam) {
                          return (
                            <Td key={index} p={0}>
                              {hp.formatting(trial.params[hp.name] as number)}
                            </Td>
                          );
                        }
                        switch (hp.type) {
                          case HyperparamTypes.Boolean:
                            return (
                              <Td key={index} p={0}>
                                {trial.params[hp.name] ? (
                                  <Box
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                  >
                                    <svg width={12} height={12}>
                                      <circle
                                        cx="6"
                                        cy="6"
                                        r="5"
                                        fill="gray"
                                      ></circle>
                                    </svg>
                                  </Box>
                                ) : (
                                  <Box
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                  >
                                    <svg width={12} height={12}>
                                      <circle
                                        cx="6"
                                        cy="6"
                                        r="5"
                                        fill="white"
                                        stroke="gray"
                                      ></circle>
                                    </svg>
                                  </Box>
                                )}
                              </Td>
                            );

                          default:
                            return <Td p={0}>d</Td>;
                        }
                      })}
                    </Tr>
                  );
                })}
              {/* <Tr>
              <Td>inches</Td>
              <Td>millimetres (mm)</Td>
              <Td isNumeric>25.4</Td>
            </Tr>
            <Tr>
              <Td>feet</Td>
              <Td>centimetres (cm)</Td>
              <Td isNumeric>30.48</Td>
            </Tr>
            <Tr>
              <Td>yards</Td>
              <Td>metres (m)</Td>
              <Td isNumeric>0.91444</Td>
            </Tr> */}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}

export default App;

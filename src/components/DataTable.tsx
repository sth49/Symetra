import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Text,
  Button,
  Center,
} from "@chakra-ui/react";
import {
  CategoricalHyperparam,
  Hyperparam,
  HyperparamTypes,
  NumericalHyperparam,
} from "../model/hyperparam";
import { Experiment } from "../model/experiment";
import { useState } from "react";

interface TableProps {
  data: Experiment | null;
}

const DataTable = (props: TableProps) => {
  console.log(props.data);
  const exp = props.data;
  const [sort, setSort] = useState<string>("metric");
  const [direction, setDirection] = useState<string>("asc"); // asc or desc

  function TableHead(props: { colName: string }) {
    return (
      <Th p={2}>
        <Box>
          <Center>
            <Text as="b">{props.colName}</Text>
          </Center>
          <Box>
            <Button size={"small"}>sort</Button>
            <Button size={"small"}>group</Button>
          </Box>
        </Box>
      </Th>
    );
  }
  let boolCount = 0;
  return (
    <Box p={2}>
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <TableHead colName={"ID"} />
              <TableHead colName={exp ? exp.metric.displayName : "Metric"} />

              {exp?.hyperparams.map((hp: Hyperparam, index: number) => {
                return <TableHead colName={hp.displayName} />;
              })}
            </Tr>
          </Thead>
          <Tbody>
            {exp?.trials
              .sort(
                (a, b) => (b[sort] - a[sort]) * (direction === "asc" ? 1 : -1)
              )
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
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};
export default DataTable;

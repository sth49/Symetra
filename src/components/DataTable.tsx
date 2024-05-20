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
  const [direction, setDirection] = useState<number>(-1); // -1 is desc, 1 is asc

  function TableHead(props: { colName: string | Hyperparam }) {
    return (
      <Th p={2}>
        <Box>
          <Center>
            <Text as="b">
              {props.colName instanceof Hyperparam
                ? props.colName.displayName
                : props.colName}
            </Text>
          </Center>
          <Box>
            <Button
              size={"small"}
              onClick={() => {
                console.log("sort", props, sort, direction);
                if (
                  props.colName instanceof Hyperparam
                    ? props.colName.name === sort
                    : props.colName === sort
                ) {
                  setDirection(direction * -1);
                } else {
                  setSort(
                    props.colName instanceof Hyperparam
                      ? props.colName.name
                      : props.colName
                  );
                  setDirection(-1);
                }
              }}
            >
              sort
            </Button>
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
              <TableHead colName={"id"} />
              <TableHead colName={"metric"} />

              {exp?.hyperparams.map((hp: Hyperparam, index: number) => {
                return <TableHead colName={hp} />;
              })}
            </Tr>
          </Thead>
          <Tbody>
            {exp?.trials
              .sort((a, b) => {
                if (sort === "metric" || sort === "id") {
                  return (a[sort] - b[sort]) * direction;
                } else {
                  return (a.params[sort] - b.params[sort]) * direction;
                }
              })
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

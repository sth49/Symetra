import {
  Badge,
  Box,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Text,
} from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { useEffect, useMemo, useState } from "react";
import { calculateCorrelation } from "../model/correlation";
import { useConstDataStore } from "./store/constDataStore";
import { formatting } from "../model/utils";
import { HparamIcons, HyperparamTypes } from "../model/hyperparam";
import * as d3 from "d3";
const IntraGroupView = () => {
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  const { exp } = useConstDataStore();

  const [result, setResult] = useState(null);

  const [binaryCorrelations, setBinaryCorrelations] = useState<Record<
    string,
    { totalCorrelation: number }
  > | null>(null);

  const colorScale = d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]);
  useEffect(() => {
    if (currentSelectedGroup) {
      const binaryHparams = exp.hyperparams.filter(
        (param) => param.type === HyperparamTypes.Binary
      );
      const results = {};
      for (let i = 0; i < binaryHparams.length; i++) {
        // results[binaryHparams[i].name] = {};
        for (let j = i + 1; j < binaryHparams.length; j++) {
          const result = calculateCorrelation(
            currentSelectedGroup.trials,
            binaryHparams[i],
            binaryHparams[j]
          );
          results[`${binaryHparams[i].name} X ${binaryHparams[j].name}`] =
            result;
        }
      }
      setBinaryCorrelations(results);
      setResult({
        value:
          results[
            Object.keys(results).sort(
              (a, b) =>
                results[b].totalCorrelation - results[a].totalCorrelation
            )[0]
          ],
        key: Object.keys(results).sort(
          (a, b) => results[b].totalCorrelation - results[a].totalCorrelation
        )[0],
      });
    }
  }, [currentSelectedGroup]);

  // useEffect(() => {
  //   if (currentSelectedGroup) {
  //     const result = calculateCorrelation(
  //       currentSelectedGroup.trials,
  //       exp.hyperparams[2],
  //       exp.hyperparams[5]
  //     );
  //     setResult(result);
  //   }
  // }, [currentSelectedGroup, exp.hyperparams]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2} width={"70%"}>
          Intra Group Correlation
        </Heading>
      </Box>
      <Box
        height={`calc(100% - 35px)`}
        p={2}
        pt={0}
        pb={0}
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"space-between"}
      >
        <Box display={"flex"} justifyContent={"space-between"}>
          <Box>{result && result.key}</Box>
          <Grid templateColumns="repeat(2, 1fr)" gap={0} width={"100%"}>
            {result &&
              Object.keys(result.value.correlations).map((key) => (
                <GridItem
                  key={key}
                  bgColor={colorScale(result.value.correlations[key])}
                  display={"flex"}
                  flexDir={"column"}
                  alignItems={"center"}
                  justifyContent={"center"}
                >
                  <Text fontWeight={"bold"}>{key.toUpperCase()}</Text>
                  <p>
                    {formatting(result.value.correlations[key], "float", 2)} (
                    {formatting(
                      result.value.statistics[key].mean.true,
                      "float"
                    )}
                    )
                  </p>
                </GridItem>
              ))}
          </Grid>
        </Box>

        <HStack spacing={2} width={"100%"} overflowX={"auto"} display={"flex"}>
          {binaryCorrelations &&
            Object.entries(binaryCorrelations)
              .sort((a, b) => b[1].totalCorrelation - a[1].totalCorrelation)
              .slice(0, 20)
              .map(([key, value]: [string, { totalCorrelation: number }]) => (
                <Badge
                  size={"sm"}
                  key={key}
                  borderRadius="full"
                  variant={result && result.key === key ? "solid" : "subtle"}
                  colorScheme="green"
                  onClick={() => {
                    setResult({
                      key: key,
                      value: value,
                    });
                  }}
                >
                  <Icon as={HparamIcons["Binary"]} />
                  <Icon as={HparamIcons["Binary"]} />
                </Badge>
              ))}
        </HStack>
      </Box>
    </div>
  );
};

export default IntraGroupView;

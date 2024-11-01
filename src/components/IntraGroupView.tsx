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
import { HparamIcons, HyperparamTypes } from "../model/hyperparam";
import ScatterPlot from "./ScatterPlot";
import { formatting } from "../model/utils";
import Heatmap from "./Heatmap";

const IntraGroupView = () => {
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  const { exp } = useConstDataStore();

  const [result, setResult] = useState(null);

  const [correlations, setCorrelations] = useState<Record<
    string,
    { correlation: number }
  > | null>(null);

  useEffect(() => {
    if (currentSelectedGroup) {
      const binaryHparams = exp.hyperparams.filter(
        (param) => param.type === HyperparamTypes.Binary
      );
      const continuousHparams = exp.hyperparams.filter(
        (param) => param.type === HyperparamTypes.Continuous
      );

      const results = {};
      for (let i = 0; i < binaryHparams.length; i++) {
        for (let j = i + 1; j < binaryHparams.length; j++) {
          const result = calculateCorrelation(
            currentSelectedGroup.trials,
            binaryHparams[i],
            binaryHparams[j]
          );
          results[`${binaryHparams[i].name} X ${binaryHparams[j].name}`] =
            result;
        }
        for (let j = 0; j < continuousHparams.length; j++) {
          const result = calculateCorrelation(
            currentSelectedGroup.trials,
            binaryHparams[i],
            continuousHparams[j]
          );
          results[`${binaryHparams[i].name} X ${continuousHparams[j].name}`] =
            result;
        }
      }

      for (let i = 0; i < continuousHparams.length; i++) {
        for (let j = i + 1; j < continuousHparams.length; j++) {
          const result = calculateCorrelation(
            currentSelectedGroup.trials,
            continuousHparams[i],
            continuousHparams[j]
          );
          results[
            `${continuousHparams[i].name} X ${continuousHparams[j].name}`
          ] = result;
        }
      }

      setResult({
        key: Object.keys(results).sort(
          (a, b) => results[b].correlation - results[a].correlation
        )[0],
        value:
          results[
            Object.keys(results).sort(
              (a, b) => results[b].correlation - results[a].correlation
            )[0]
          ],
      });
      console.log(results);
      setCorrelations(results);
    }
  }, [currentSelectedGroup]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2} width={"70%"}>
          Intra Group Correlation
        </Heading>
      </Box>
      <Box
        w={"100%"}
        height={`calc(100% - 35px)`}
        p={2}
        pt={0}
        pb={0}
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"space-between"}
      >
        <Box w={"100%"} display={"flex"} justifyContent={"space-between"}>
          <Box w={"100%"}>
            {result && (
              <Box display={"flex"} w={"100%"} justifyContent={"space-around"}>
                <Text fontSize={"sm"}>
                  {`${result.value.hp.hp1.displayName} X ${result.value.hp.hp2.displayName}`}
                </Text>
                <Text fontSize={"sm"} align={"center"}>
                  {formatting(result.value.correlation, "float")}
                </Text>
              </Box>
            )}
          </Box>
          {result &&
          (result.value.type === "pearson" ||
            result.value.type === "point-biserial") ? (
            <>
              <ScatterPlot result={result} />
            </>
          ) : result && result.value.type === "phi" ? (
            <>
              <Heatmap result={result} />
            </>
          ) : (
            <></>
          )}
        </Box>
        <HStack spacing={2} width={"100%"} overflowX={"auto"} display={"flex"}>
          {correlations &&
            Object.entries(correlations)
              .sort((a, b) => b[1].correlation - a[1].correlation)
              .slice(0, 20)
              .map(([key, value]) => (
                <Badge
                  size={"sm"}
                  key={key}
                  borderRadius="full"
                  variant={result && result.key === key ? "solid" : "subtle"}
                  // colorScheme="green"
                  onClick={() => {
                    setResult({
                      key: key,
                      value: value,
                    });
                  }}
                >
                  <Icon
                    as={
                      value.hp.hp1.type === HyperparamTypes.Binary
                        ? HparamIcons["Binary"]
                        : HparamIcons["Continuous"]
                    }
                  />
                  <Icon
                    as={
                      value.hp.hp2.type === HyperparamTypes.Binary
                        ? HparamIcons["Binary"]
                        : HparamIcons["Continuous"]
                    }
                  />
                </Badge>
              ))}
        </HStack>
      </Box>
    </div>
  );
};

export default IntraGroupView;

import {
  Badge,
  Box,
  Heading,
  Icon,
  Select,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { useEffect, useMemo, useState } from "react";
import { calculateCorrelation } from "../model/correlation";
import { useConstDataStore } from "./store/constDataStore";
import { HparamIcons, Hyperparam, HyperparamTypes } from "../model/hyperparam";
import ScatterPlot from "./ScatterPlot";
import { formatting } from "../model/utils";
import Heatmap from "./Heatmap";
import { IoClose } from "react-icons/io5";
import SelectIcon from "./SelectIcon";
const IntraGroupView = () => {
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  const { exp } = useConstDataStore();

  const [result, setResult] = useState(null);

  const [correlations, setCorrelations] = useState<Record<
    string,
    {
      hp: {
        hp1: Hyperparam;
        hp2: Hyperparam;
      };
      correlation: number;
    }
  > | null>(null);

  useEffect(() => {
    if (currentSelectedGroup) {
      const binaryHparams = exp.hyperparams.filter(
        (param) => param.type === HyperparamTypes.Binary && param.visible
      );
      const continuousHparams = exp.hyperparams.filter(
        (param) => param.type === HyperparamTypes.Continuous && param.visible
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
        key: Object.keys(results)
          .filter((a) => !Number.isNaN(results[a].correlation))
          .sort((a, b) => results[b].correlation - results[a].correlation)[0],
        value:
          results[
            Object.keys(results)
              .filter((a) => !Number.isNaN(results[a].correlation))
              .sort(
                (a, b) => results[b].correlation - results[a].correlation
              )[0]
          ],
      });
      setCorrelations(
        Object.keys(results)
          .filter((a) => !Number.isNaN(results[a].correlation))
          .reduce((acc, key) => {
            acc[key] = results[key];
            return acc;
          }, {})
      );
    }
  }, [currentSelectedGroup]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Heading
          as="h5"
          size="sm"
          color="gray.600"
          p={2}
          display={"flex"}
          alignItems={"center"}
        >
          Correlation View {"("}
          <SelectIcon />
          {currentSelectedGroup?.name} {" )"}
        </Heading>
      </Box>
      <Box
        w={"100%"}
        height={`calc(100% - 35px)`}
        p={2}
        pt={0}
        pb={2}
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"space-between"}
      >
        <Box
          w={"100%"}
          display={"flex"}
          justifyContent={"space-between"}
          height={"100%"}
        >
          <Box w={"50%"} overflowY={"auto"} height={"100%"} pr={2}>
            {correlations &&
              Object.entries(correlations)
                .sort(
                  (a, b) =>
                    Math.abs(b[1].correlation) - Math.abs(a[1].correlation)
                )
                .slice(0, 20)
                .map(([key, value]) => (
                  <Badge
                    size={"sm"}
                    width={"100%"}
                    key={key}
                    borderRadius="full"
                    variant={result && result.key === key ? "solid" : "subtle"}
                    justifyContent={"space-between"}
                    display={"flex"}
                    alignItems={"center"}
                    mb={1}
                    p={1}
                    pl={4}
                    pr={4}
                    cursor={"pointer"}
                    userSelect={"none"}
                    onClick={() => {
                      setResult({
                        key: key,
                        value: value,
                      });
                    }}
                  >
                    <Box display={"flex"} alignItems={"center"} width={"85%"}>
                      <Tooltip
                        label={
                          <div>
                            <Text
                              fontSize="xs"
                              borderBottom={"1px solid white"}
                            >
                              {value.hp.hp1.name} (default:{" "}
                              {value.hp.hp1.defaultString})
                            </Text>
                            <Text fontSize="xs">
                              {value.hp.hp1.description}
                            </Text>
                          </div>
                        }
                        aria-label={value.hp.hp1.displayName}
                      >
                        <Text
                          fontSize={"sm"}
                          display={"flex"}
                          alignItems={"center"}
                          width={"35%"}
                        >
                          <Icon
                            mr={1}
                            as={
                              value.hp.hp1.type === HyperparamTypes.Binary
                                ? HparamIcons["Binary"]
                                : HparamIcons["Continuous"]
                            }
                          />
                          {value.hp.hp1.displayName}
                        </Text>
                      </Tooltip>
                      <Icon m={"0 10px"} as={IoClose} />

                      <Tooltip
                        label={
                          <div>
                            <Text
                              fontSize="xs"
                              borderBottom={"1px solid white"}
                            >
                              {value.hp.hp2.name} (default:{" "}
                              {value.hp.hp2.defaultString})
                            </Text>
                            <Text fontSize="xs">
                              {value.hp.hp2.description}
                            </Text>
                          </div>
                        }
                        aria-label={value.hp.hp2.displayName}
                      >
                        <Text
                          fontSize={"sm"}
                          display={"flex"}
                          align={"right"}
                          alignItems={"center"}
                          width={"35%"}
                          justifyContent={"right"}
                        >
                          <Icon
                            mr={1}
                            as={
                              value.hp.hp2.type === HyperparamTypes.Binary
                                ? HparamIcons["Binary"]
                                : HparamIcons["Continuous"]
                            }
                          />
                          {value.hp.hp2.displayName}
                        </Text>
                      </Tooltip>
                    </Box>
                    <Text fontSize={"sm"} align={"right"}>
                      {formatting(value.correlation, "float")}
                    </Text>
                  </Badge>
                ))}
          </Box>
          <Box w={"50%"} height={"100%"}>
            {result &&
            (result.value.type === "pearson" ||
              result.value.type === "point-biserial") ? (
              <>
                <ScatterPlot
                  result={result}
                  ids={currentSelectedGroup.trials.map((trial) => trial.id)}
                  metrics={currentSelectedGroup.trials.map(
                    (trial) => trial.metric
                  )}
                />
              </>
            ) : result && result.value.type === "phi" ? (
              <>
                <Heatmap result={result} />
              </>
            ) : (
              <></>
            )}
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default IntraGroupView;

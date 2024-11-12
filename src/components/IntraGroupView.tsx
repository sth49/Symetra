import { Badge, Box, Heading, Icon, Text, Tooltip } from "@chakra-ui/react";
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
      hp: Hyperparam;
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
      <Box display={"flex"}>
        <Heading
          as="h5"
          size="sm"
          color="gray.600"
          p={2}
          display={"flex"}
          alignItems={"center"}
        >
          Intra Group Correlation {"("}
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
                .sort((a, b) => b[1].correlation - a[1].correlation)
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
                        label={value.hp.hp1.name}
                        aria-label={value.hp.hp1.displayName}
                      >
                        <Text
                          fontSize={"sm"}
                          display={"flex"}
                          alignItems={"center"}
                          width={"35%"}
                        >
                          <Icon
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
                        label={value.hp.hp2.name}
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
        </Box>
      </Box>
    </div>
  );
};

export default IntraGroupView;

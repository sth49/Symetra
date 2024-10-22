import { Box, Heading, Text } from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { useEffect, useMemo, useState } from "react";
import { calculateCorrelation } from "../model/correlation";
import { useConstDataStore } from "./store/constDataStore";
import { formatting } from "../model/utils";

const Heatmap = () => {
  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  const { exp } = useConstDataStore();

  const [result, setResult] = useState(null);

  // const heatmapData = useMemo(() => {
  //   if (currentSelectedGroup) {
  //     return calculateCorrelation(
  //       currentSelectedGroup.trials,
  //       exp.hyperparams[5],
  //       exp.hyperparams[2]
  //     );
  //   }
  // }, [currentSelectedGroup, exp.hyperparams]);

  useEffect(() => {
    if (currentSelectedGroup) {
      const result = calculateCorrelation(
        currentSelectedGroup.trials,
        exp.hyperparams[5],
        exp.hyperparams[2]
      );
      setResult(result);
    }
  }, [currentSelectedGroup, exp.hyperparams]);

  // console.log(heatmapData);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Heatmap
        </Heading>
      </Box>
      <Box height={`calc(100% - 35px)`}>
        <Text>
          {exp.hyperparams[2].name} X {exp.hyperparams[5].name}
        </Text>
        {result &&
          result.correlations &&
          Object.keys(result.correlations).map((key) => (
            <div key={key}>
              <p>
                {key}: {formatting(result.correlations[key], "float")}
              </p>
            </div>
          ))}
      </Box>
    </div>
  );
};

export default Heatmap;

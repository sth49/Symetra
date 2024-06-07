import { Box } from "@chakra-ui/react";
import { Experiment } from "../model/experiment";

const EffectColumn = (props: { data: Experiment | null }) => {
  console.log(props.data);
  const exp = props.data;
  return (
    <Box width={"20%"} height="800px" overflow={"auto"}>
      {exp?.hyperparams
        .sort((a, b) => b.getEffect() - a.getEffect())
        .map((hp) => {
          return (
            <Box>
              <Box>{hp.name}</Box>
            </Box>
          );
        })}
    </Box>
  );
};
export default EffectColumn;

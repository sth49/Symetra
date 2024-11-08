import { Box, Heading } from "@chakra-ui/react";
import TrialTable from "./TrialTable";
import { formatting } from "../model/utils";
import { useConstDataStore } from "./store/constDataStore";
const TrialView = () => {
  const { exp } = useConstDataStore();
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Trial View ({formatting(exp.trials.length, "int")} Trials)
        </Heading>
      </Box>
      <div style={{ height: `calc(100% - 35px)` }}>
        <TrialTable />
      </div>
    </div>
  );
};

export default TrialView;

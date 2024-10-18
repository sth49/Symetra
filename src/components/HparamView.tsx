import { Box, Heading } from "@chakra-ui/react";

import { useConstDataStore } from "./store/constDataStore";
import HparamTable from "./HparamTable";

const HparamView = () => {
  const { hyperparams } = useConstDataStore();
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Hyperparameter View ({hyperparams.filter((hp) => hp.visible).length}/
          {hyperparams.length} Visible)
        </Heading>
      </Box>
      <HparamTable />
    </div>
  );
};

export default HparamView;

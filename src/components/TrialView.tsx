import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Switch,
  Text,
} from "@chakra-ui/react";
import TrialTable from "./TrialTable";
import { formatting } from "../model/utils";
import { useConstDataStore } from "./store/constDataStore";
import { useState } from "react";

const TrialView = () => {
  const { exp } = useConstDataStore();
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ height: "100%", width: "100%" }}>
      {/* <h1>Trial View</h1> */}
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Heading as="h5" size="sm" color="gray.600" p={2} userSelect={"none"}>
          Trial View ({formatting(exp.trials.length, "int")} Trials)
        </Heading>
        <FormControl
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="140px"
        >
          <FormLabel htmlFor="metric-switch" mb={0}>
            <Text fontSize="xs" color="gray.600" userSelect={"none"}>
              Show controls
            </Text>
          </FormLabel>
          <Switch
            id="metric-switch"
            onChange={() => setVisible(!visible)}
            isChecked={visible}
            size={"sm"}
          />
        </FormControl>
      </Box>
      <div style={{ height: `calc(100% - 35px)` }}>
        <TrialTable showControls={visible} />
      </div>
    </div>
  );
};

export default TrialView;

import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Switch,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import TrialGroupGraph from "./TrialGroupGraph";
import { useConstDataStore } from "./store/constDataStore";
import { useCustomStore } from "../store";
import GroupDetailView from "./GroupDetailView";
import TrialGroupTable from "./TrialGroupTable";

const TrialGroupView = () => {
  const [visible, setVisible] = useState(true);
  const { exp } = useConstDataStore();
  const groups = useCustomStore((state) => state.groups);
  const setGroups = useCustomStore((state) => state.setGroups);
  const setCurrnetSelectedGroup = useCustomStore(
    (state) => state.setCurrentSelectedGroup
  );
  useEffect(() => {
    console.log("TrialGroupView initialized");
    const updatedGroups = groups.clone();
    updatedGroups.addGroup(
      exp?.trials
        .sort((a, b) => b.metric - a.metric)
        .slice(0, exp?.trials.length * 0.1) ?? [],
      "Top 10%"
    );
    updatedGroups.addGroup(
      exp?.trials
        .sort((a, b) => a.metric - b.metric)
        .slice(0, exp?.trials.length * 0.1) ?? [],
      "Bottom 10%"
    );
    setGroups(updatedGroups);

    setCurrnetSelectedGroup(updatedGroups.groups[0]);
  }, []);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Trial Group View
        </Heading>

        <FormControl
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="140px"
        >
          <FormLabel htmlFor="metric-switch" mb={0}>
            <Text fontSize="xs" color="gray.600" userSelect={"none"}>
              Show Graph
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
      <Box height={`calc(100% - 35px - 35px)`}>
        {visible ? <TrialGroupGraph /> : <TrialGroupTable />}
      </Box>
      <GroupDetailView />
    </div>
  );
};

export default TrialGroupView;

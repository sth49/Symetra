import { Box, Heading } from "@chakra-ui/react";
import { useEffect } from "react";
import TrialGroupGraph from "./TrialGroupGraph";
import { useConstDataStore } from "./store/constDataStore";
import { useCustomStore } from "../store";
import GroupDetailView from "./GroupDetailView";
import { Groups } from "../model/group";

const TrialGroupView = () => {
  // const [visible, setVisible] = useState(true);
  const { exp } = useConstDataStore();
  const setGroups = useCustomStore((state) => state.setGroups);
  const setCurrnetSelectedGroup = useCustomStore(
    (state) => state.setCurrentSelectedGroup
  );
  useEffect(() => {
    console.log("TrialGroupView initialized");
    const updatedGroups = new Groups();

    updatedGroups.addGroup(exp?.trials, "All");

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
  }, [exp]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box display={"flex"} justifyContent={"space-between"}>
        <Heading as="h5" size="sm" color="gray.600" p={2}>
          Trial Group View
        </Heading>
      </Box>
      <Box height={`calc(100% - 35px - 65px)`}>
        <TrialGroupGraph />
      </Box>
      <GroupDetailView />
    </div>
  );
};

export default TrialGroupView;

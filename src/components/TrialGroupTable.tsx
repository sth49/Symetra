import { Box, Text } from "@chakra-ui/react";
import { useCustomStore } from "../store";
import AreaChart from "./AreaChart";
import { formatting } from "../model/utils";
import { useCallback } from "react";

const TrialGroupTable = () => {
  const groups = useCustomStore((state) => state.groups);
  const setHoveredGroup = useCustomStore((state) => state.setHoveredGroup);
  const setCurrentSelectedGroup = useCustomStore(
    (state) => state.setCurrentSelectedGroup
  );

  const handleMouseEnter = useCallback(
    (group) => {
      setHoveredGroup(new Set(group.trials.map((trial) => trial.id)));
    },
    [setHoveredGroup]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredGroup(new Set());
  }, [setHoveredGroup]);

  return (
    <div style={{ height: "100%", width: "100%", padding: "4px" }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid #ddd",
          padding: "4px",
        }}
      >
        <Box width={"20%"}>
          <Text align={"center"} fontWeight={"bold"} color={"gray.600"}>
            Name
          </Text>
        </Box>

        <Box width={"20%"} display={"flex"} justifyContent={"center"}>
          <Text align={"center"} fontWeight={"bold"} color={"gray.600"}>
            Count
          </Text>
        </Box>
        <Box width={"60%"} display={"flex"} justifyContent={"center"}>
          <Text align={"center"} fontWeight={"bold"} color={"gray.600"}>
            Branch Distribution
          </Text>
        </Box>
      </div>
      <div
        style={{ height: `calc(100% - 35px)` }}
        onMouseLeave={handleMouseLeave}
      >
        {groups.groups.map((group, idx) => (
          <div
            key={idx} // key값은 index로 설정
            style={{
              display: "flex",
              alignItems: "center",
              padding: "4px",
              height: "35px",
              overflowY: "auto",
              userSelect: "none",
            }}
            className="trial-group-table-row"
            onMouseEnter={() => handleMouseEnter(group)}
            onMouseLeave={handleMouseLeave}
            onClick={() => setCurrentSelectedGroup(group)}
          >
            <Box width={"20%"}>
              <Text align={"left"} fontSize={"sm"}>
                {group.name}
              </Text>
            </Box>
            <Box
              width={"20%"}
              display={"flex"}
              justifyContent={"right"}
              fontSize={"sm"}
            >
              <Text align={"center"}>
                {formatting(group.trials.length, "int")}
              </Text>
            </Box>
            <Box
              width={"60%"}
              height={"100%"}
              display={"flex"}
              justifyContent={"center"}
            >
              <AreaChart trialGroup={group} />
            </Box>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrialGroupTable;

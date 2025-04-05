import { Box, Heading, Select, Text } from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { useEffect } from "react";
import { useConstDataStore } from "./store/constDataStore";

import CodeFileTable from "./CodeFileTable";
import SelectIcon from "./SelectIcon";
import { formatting } from "../model/utils";

function CodeDetail() {
  const setSelectBranchId = useCustomStore(
    (state) => state.setSelectedBranchId
  );
  const experiment = useConstDataStore((state) => state.exp);

  useEffect(() => {
    setSelectBranchId(experiment.branchInfo[0].branch);
  }, [experiment, setSelectBranchId]);

  const currentSelectedGroup = useCustomStore(
    (state) => state.currentSelectedGroup
  );

  const currentSelectedGroup2 = useCustomStore(
    (state) => state.currentSelectedGroup2
  );

  const setCurrentSelectedGroup2 = useCustomStore(
    (state) => state.setCurrentSelectedGroup2
  );

  const groups = useCustomStore((state) => state.groups);

  return (
    <div style={{ height: "100%", width: "100%", userSelect: "none" }}>
      <Box display={"flex"} alignItems={"center"}>
        <Heading
          as="h5"
          size="sm"
          color="gray.600"
          p={2}
          display={"flex"}
          alignItems={"center"}
        >
          Code View
        </Heading>
        <Text display={"flex"} justifyContent={"flex-end"} fontSize={"sm"}>
          {" ("}
          <SelectIcon type="g1" />
          {currentSelectedGroup?.name} (
          {formatting(currentSelectedGroup?.getLength(), "int")})
          <Box mr={3} ml={3}>
            {" vs "}
          </Box>
          <SelectIcon type="g2" />
          <Select
            cursor={"pointer"}
            w={"130px"}
            value={
              currentSelectedGroup2 ? currentSelectedGroup2.id.toString() : ""
            }
            size={"xs"}
            mr={1}
            onChange={(e) => {
              const newGroup = groups.getGroup(parseInt(e.target.value));
              setCurrentSelectedGroup2(newGroup);
            }}
          >
            {groups.groups
              .filter((g) => g.id !== currentSelectedGroup.id)
              .map((group) => (
                <option key={group.id} value={group.id.toString()}>
                  {group.name} ({formatting(group.getLength(), "int")})
                </option>
              ))}
          </Select>
          {" )"}
        </Text>
      </Box>
      <CodeFileTable />
    </div>
  );
}

export default CodeDetail;

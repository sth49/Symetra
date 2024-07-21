import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Icon,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { useCustomStore } from "../store";
import { formatting, generateBinnedData } from "../model/utils";
import { ViolinPlot } from "@visx/stats";
import { CloseIcon } from "@chakra-ui/icons";

const GroupView = () => {
  const { groups, setGroupSelected, setGroups } = useCustomStore();

  const setHoverGroup = (group) => {
    if (!group) {
      setGroupSelected(new Set());
      return;
    }
    const selected = new Set(group.trials.map((trial) => trial.id));
    setGroupSelected(selected);
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Box height={"10%"}>
        <Heading as="h5" size="sm" color="gray.600" p={4}>
          Groups
        </Heading>
      </Box>

      {groups.length > 0 ? (
        <Box
          width={"100%"}
          overflowX={"auto"}
          height="90%" // 뷰포트 높이에서 적절한 값을 뺀 높이
          p={2}
          display="flex"
        >
          {groups.map((group, idx) => {
            console.log(group);
            const coverages = group.trials.map((trial) => trial.metric);
            // console.log(coverages);
            const branches = group.getBranches();
            console.log(branches);

            let { binData, yScale } = generateBinnedData(
              coverages,
              100,
              150,
              "y"
            );

            return (
              <Card key={idx} m={2} height={"95%"} width={"150px"}>
                <CardHeader
                  display={"flex"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                >
                  <Text fontSize="md">
                    ID {group.id.slice(0, 3).toUpperCase()} (
                    {group.trials.length})
                  </Text>
                  <CloseIcon
                    w={3}
                    h={3}
                    onClick={() => {
                      const newGroups = groups.filter((g) => g.id !== group.id);
                      setGroups(newGroups);
                    }}
                  />
                </CardHeader>
                <CardBody
                  onMouseEnter={() => setHoverGroup(group)}
                  onMouseLeave={() => setHoverGroup(null)}
                >
                  <svg width={100} height={150}>
                    <ViolinPlot
                      data={binData}
                      stroke="#ECC94B"
                      left={0}
                      width={100}
                      valueScale={yScale}
                      fill="#F6E05E"
                    />
                  </svg>
                  <Box mt={4}>
                    <Text fontSize="sm">Min : {Math.min(...coverages)}</Text>
                    <Text fontSize="sm">
                      Mean:{" "}
                      {formatting(
                        coverages.reduce((a, b) => a + b, 0) / coverages.length,
                        false
                      )}
                    </Text>
                    <Text fontSize="sm">Max : {Math.max(...coverages)}</Text>
                  </Box>
                </CardBody>
              </Card>
            );
          })}
        </Box>
      ) : (
        <Box p={4} bg="gray.100" m={2} height={"85%"}>
          There are no groups to display. Pleas create a group by clicking the
          "+ Group" button.
        </Box>
      )}
    </div>
  );
};

export default GroupView;

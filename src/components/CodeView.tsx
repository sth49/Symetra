import { Box, FormControl, FormLabel, Select, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useCustomStore } from "../store";
import { useConstDataStore } from "./store/constDataStore";
import { BranchInfo } from "../model/experiment";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

function sliceAroundLine(
  content: string,
  targetLine: number,
  context: number = 3
): { content: string; startLine: number } {
  // 반환 타입 변경
  const lines = content.split("\n");
  if (context < 0) return { content: lines.join("\n"), startLine: 1 };

  const start = Math.max(0, targetLine - context - 1);
  const end = Math.min(lines.length, targetLine + context);

  return {
    content: lines.slice(start, end).join("\n"),
    startLine: start + 1, // 시작 라인 번호 반환
  };
}
interface CodeViewProps {
  item: any;
}
const CodeView: React.FC<CodeViewProps> = ({ item }) => {
  console.log("CodeView item:", item);

  const [branchInfo, setBranchInfo] = useState<BranchInfo | undefined>(
    undefined
  );

  const viewType = useCustomStore((state) => state.viewType);

  const [fileContent, setFileContent] = useState<string>("");
  const [numLine, setNumLine] = useState<number>(20);

  const selectedBranchId = useCustomStore((state) => state.selectedBranchId);

  const experiment = useConstDataStore((state) => state.exp);

  useEffect(() => {
    if (selectedBranchId) {
      const branch = experiment.branchInfo.find(
        (b) => b.branch === selectedBranchId
      );
      console.log("Setting branch info:", branch);
      setBranchInfo(branch);
    }
  }, [selectedBranchId, experiment.branchInfo]);

  useEffect(() => {
    if (viewType === "file") {
      setNumLine(-1);
    } else {
      setNumLine(20);
    }
  }, [viewType]);

  useEffect(() => {
    async function loadFile() {
      if (branchInfo?.filePath) {
        try {
          // base path를 고려한 URL 구성
          const basePath = "/Symetra/"; // vite.config.ts의 base 설정값
          const url = `${basePath}${branchInfo.filePath}`;
          console.log("Attempting to fetch from:", url);

          const response = await fetch(url);
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);

          const content = await response.text();
          console.log("File content loaded successfully");
          console.log("Content length:", content.length);
          setFileContent(content);
        } catch (error) {
          console.error("Error reading file:", error);
          setFileContent("// Error loading file content");
        }
      }
    }

    loadFile();
  }, [branchInfo?.filePath]);

  const displayContent = useMemo(() => {
    if (!fileContent || !branchInfo?.line)
      return {
        content: "// There is no branch information.",
        startLine: 1,
      };
    if (viewType === "file") return { content: fileContent, startLine: 1 };
    return sliceAroundLine(fileContent, branchInfo?.line, numLine);
  }, [fileContent, branchInfo?.line, viewType, numLine]);

  const lines = useMemo(() => {
    if (viewType === "line") return [branchInfo?.line];
    if (!item || item?.children.length === 0) return [];
    if (viewType === "file" && item && item.children)
      return item.children.map((c) => c.line);
  }, [branchInfo?.line, item, viewType]);

  if (item === undefined) {
    return (
      <Box
        width="100%"
        height="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Text fontSize="md">Please select a branch</Text>
      </Box>
    );
  }

  return (
    <Box w={"100%"} height={`calc(78% - 30px)`} overflowY={"hidden"}>
      <Box
        width="100%"
        height="100%"
        position={"relative"}
        overflowY={"hidden"}
      >
        <Box
          display={"flex"}
          justifyContent={"space-between"}
          position={"absolute"}
          top={0}
          right={0}
          zIndex={1000}
          width={"100%"}
          padding={2}
        >
          <Box backgroundColor={"white"} p={1} display={"flex"}>
            <Text fontSize={"xs"}>{branchInfo?.filePath}</Text>
          </Box>
          <FormControl
            display="flex"
            justifyContent="right"
            width={"30%"}
            alignItems={"center"}
            backgroundColor={"white"}
            mr={1}
          >
            <FormLabel htmlFor="branch" mr={1} mb={0}>
              <Text fontSize="xs" color="gray.600">
                # Lines
              </Text>
            </FormLabel>
            <Select
              cursor={"pointer"}
              size={"xs"}
              width={"60%"}
              onChange={(e) => {
                console.log("Selected branch:", e.target.value);
                setNumLine(
                  e.target.value === "All" ? -1 : parseInt(e.target.value)
                );
              }}
              value={numLine}
            >
              {["20", "25", "50", "All"].map((num) => (
                <option key={num} value={num === "All" ? -1 : parseInt(num)}>
                  {num}
                </option>
              ))}
            </Select>
          </FormControl>
        </Box>
        <div style={{ width: "100%", height: "100%" }}>
          <SyntaxHighlighter
            customStyle={{
              fontSize: "12px",
              width: "100%",
              height: "100%",
              backgroundColor: "white",
            }}
            startingLineNumber={displayContent.startLine}
            language="c"
            wrapLines={true}
            showLineNumbers={true}
            lineProps={(lineNumber) => {
              const style: React.CSSProperties = {
                display: "block",
                width: "100%",
                minWidth: "100%",
                boxSizing: "border-box",
              };

              console.log("items:", item);

              if (lines.includes(lineNumber)) {
                const lineItem = item.children.find(
                  (c) => c.line === lineNumber
                );
                style.backgroundColor =
                  lineItem.group1 > lineItem.group2
                    ? "rgba(0, 0, 255, 0.2)"
                    : "rgba(255, 0, 0, 0.2)";
                style.borderLeft =
                  lineItem.group1 > lineItem.group2
                    ? "3px solid rgba(0, 0, 255, 0.8)"
                    : "3px solid rgba(255, 0, 0, 0.8)";
                style.width = "150%";
                style.position = "relative";
                style.left = 0;
                style.right = 0;
              }

              return { style };
            }}
          >
            {displayContent.content}
          </SyntaxHighlighter>
        </div>
      </Box>
    </Box>
  );
};

export default CodeView;

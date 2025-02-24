import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Text,
} from "@chakra-ui/react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialOceanic } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useCustomStore } from "../store";
import { useEffect, useMemo, useState } from "react";
import { useConstDataStore } from "./store/constDataStore";
import { BranchInfo } from "../model/experiment";
import { formatting } from "../model/utils";

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

function CodeDetail() {
  const [fileContent, setFileContent] = useState<string>("");
  const [numLine, setNumLine] = useState<number>(5);
  const selectedBranchId = useCustomStore((state) => state.selectedBranchId);
  const setSelectBranchId = useCustomStore(
    (state) => state.setSelectedBranchId
  );
  const experiment = useConstDataStore((state) => state.exp);

  const [branchInfo, setBranchInfo] = useState<BranchInfo | undefined>(
    undefined
  );

  const data = useMemo(() => {
    // file에 해당하는 브랜치 개수 구하기
    const branchCount = {};
    experiment.branchInfo.forEach((branch) => {
      if (branchCount[branch.filePath]) {
        branchCount[branch.filePath]++;
      } else {
        branchCount[branch.filePath] = 1;
      }
    });

    return Object.keys(branchCount).map((filePath) => ({
      filePath: filePath,
      count: branchCount[filePath],
    }));
  }, [experiment.branchInfo]);

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

  // const displayContent = useMemo(() => {
  //   if (!fileContent || !branchInfo?.line) return "// Loading file content...";
  //   return sliceAroundLine(fileContent, branchInfo.line, numLine);
  // }, [fileContent, branchInfo, numLine]);
  // CodeDetail 컴포넌트에서
  const displayContent = useMemo(() => {
    if (!fileContent || !branchInfo?.line)
      return {
        content: "// Loading file content...",
        startLine: 1,
      };
    return sliceAroundLine(fileContent, branchInfo.line, numLine);
  }, [fileContent, branchInfo, numLine]);

  return (
    <div style={{ height: "100%", width: "100%", userSelect: "none" }}>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Heading
          as="h5"
          size="sm"
          color="gray.600"
          p={2}
          display={"flex"}
          alignItems={"space-between"}
          gap={2}
        >
          Code Detail View
        </Heading>
        <FormControl
          display="flex"
          justifyContent="right"
          width={"35%"}
          alignItems={"center"}
          mr={1}
        >
          <FormLabel htmlFor="branch" mr={1} mb={0}>
            <Text fontSize="xs" color="gray.600">
              Branch
            </Text>
          </FormLabel>
          <Select
            cursor={"pointer"}
            size={"xs"}
            width={"90%"}
            onChange={(e) => {
              console.log("Selected branch:", e.target.value);
              setSelectBranchId(e.target.value);
            }}
            value={selectedBranchId}
          >
            <option value={""}>Select Branch</option>
            {experiment.branchInfo.map((branch) => (
              <option key={branch.branch} value={branch.branch}>
                {branch.branch}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl
          display="flex"
          justifyContent="right"
          width={"30%"}
          alignItems={"center"}
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
            {["All", "5", "10", "20"].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </Select>
        </FormControl>
      </Box>
      {selectedBranchId !== "" ? (
        <>
          <Box pl={2} pr={2} display={"flex"} justifyContent={"space-between"}>
            {branchInfo && (
              <>
                <Text fontSize={"sm"}>File: {branchInfo.fileName}</Text>
                <Text fontSize={"sm"}>Line: {branchInfo.line}</Text>
                <Text fontSize={"sm"}>Branch: {branchInfo.condition}</Text>
              </>
            )}
          </Box>
          <Box w={"100%"} p={1} height={`calc(100% - 55px)`}>
            <SyntaxHighlighter
              customStyle={{
                fontSize: "12px",
                width: "100%",
                height: "100%",
              }}
              startingLineNumber={displayContent.startLine}
              language="c"
              style={materialOceanic}
              wrapLines={true}
              showLineNumbers={true}
              lineProps={(lineNumber) => {
                let style: React.CSSProperties = {
                  display: "block",
                  width: "100%", // 전체 너비 차지
                  minWidth: "100%", // 최소 너비 설정
                  boxSizing: "border-box", // 패딩과 보더를 포함한 너비 계산
                };

                if (lineNumber === branchInfo?.line) {
                  style.backgroundColor = "rgba(40, 200, 40, 0.2)";
                  style.borderLeft = "3px solid rgba(40, 200, 40, 0.8)";
                  style.width = "150%";
                  style.position = "relative"; // 상대 위치 설정
                  style.left = 0; // 왼쪽 정렬
                  style.right = 0; // 오른쪽 끝까지 확장
                }

                return { style };
              }}
            >
              {displayContent.content}
            </SyntaxHighlighter>
          </Box>
        </>
      ) : (
        <Box w={"100%"} p={1} height={`calc(100% - 55px)`} overflowY={"auto"}>
          {data &&
            data
              .sort(
                (a, b) =>
                  b.count - a.count || a.filePath.localeCompare(b.filePath)
              )
              .map((d) => (
                <Box key={d.filePath} p={1}>
                  <Text fontSize="sm" color="gray.600">
                    {d.filePath} ({formatting(d.count, "int")} /{" "}
                    {formatting(experiment.branchInfo.length, "int")},{" "}
                    {formatting(
                      (d.count / experiment.branchInfo.length) * 100,
                      "float"
                    )}
                    %)
                  </Text>
                </Box>
              ))}
        </Box>
      )}
    </div>
  );
}

export default CodeDetail;

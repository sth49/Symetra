import { ParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { useMemo, useState, useCallback } from "react";
import { AreaClosed } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { Group as TrialGroup } from "../model/group";
import { useCustomStore } from "../store";
import { useConstDataStore } from "./store/constDataStore";
import { Line } from "@visx/shape";
import { localPoint } from "@visx/event";
import { TooltipWithBounds, defaultStyles } from "@visx/tooltip";

interface AreaChartProps {
  trialGroup: TrialGroup;
}

interface TooltipData {
  x: number;
  y: number;
  branch: string;
}

const tooltipStyles = {
  ...defaultStyles,
  background: "rgba(0, 0, 0, 0.8)",
  color: "white",
  padding: "8px",
  borderRadius: "4px",
  zIndex: 1000,
};

const AreaChartBase = ({ trialGroup, width, height }) => {
  const { currentSelectedGroup } = useCustomStore();
  const { exp } = useConstDataStore();
  const margin = { top: 0, right: 0, bottom: 0, left: 0 };
  const setSelectedBranchId = useCustomStore(
    (state) => state.setSelectedBranchId
  );
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipLeft, setTooltipLeft] = useState<number | null>(null);

  const setIsBranchClicked = useCustomStore(
    (state) => state.setIsBranchClicked
  );

  const selectedBranchId = useCustomStore((state) => state.selectedBranchId);

  const selectedData = useMemo(() => {
    const branches = currentSelectedGroup.getBranches(exp.branchInfo);
    return branches
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map((b, i) => ({
        x: i,
        y: b[1], // value
        branch: b[0], // branch ID
      }));
  }, [currentSelectedGroup, exp.branchInfo]);

  const data = useMemo(() => {
    const branches = trialGroup.getBranches(exp.branchInfo);

    return selectedData.map((d) => {
      const branchData = branches.find((b) => b[0] === d.branch);
      const branchData2 = exp.branchInfo.find((b) => b.branch === d.branch);

      return {
        x: d.x,
        y: branchData ? branchData[1] : 0,
        branch: d.branch,
        temp: branchData2,
      };
    });
  }, [trialGroup, exp.branchInfo, selectedData]);

  const xAccessor = (d: { x: number }) => d.x;
  const yAccessor = (d: { y: number }) => d.y;

  const xScale = useMemo(
    () =>
      scaleLinear({
        range: [margin.left, width - margin.right],
        domain: [0, Math.max(...data.map(xAccessor))],
      }),
    [data, margin.left, margin.right, width]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [height - margin.bottom, margin.top],
        domain: [0, Math.max(...data.map(yAccessor))],
        nice: true,
      }),
    [data, height, margin.bottom, margin.top]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = xScale.invert(x);
      const index = Math.round(x0);

      if (index >= 0 && index < data.length) {
        const d = data.find((d) => d.x === index);
        setTooltipData(d);
        setTooltipLeft(xScale(d.x));
      }
    },
    [data, xScale]
  );

  const handleMouseLeave = () => {
    setTooltipData(null);
    setTooltipLeft(null);
  };
  const setViewType = useCustomStore((state) => state.setViewType);

  const handleTooltipClick = useCallback(() => {
    if (tooltipData) {
      console.log("Selected Branch ID:", tooltipData);

      setSelectedBranchId(tooltipData.branch);
      setViewType("line");
      setIsBranchClicked(true);
    }
  }, [setIsBranchClicked, setSelectedBranchId, setViewType, tooltipData]);

  return (
    <>
      <svg
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleTooltipClick}
      >
        <AreaClosed
          data={data}
          x={(d) => xScale(xAccessor(d))}
          y={(d) => yScale(yAccessor(d))}
          yScale={yScale}
          curve={curveMonotoneX}
          fill={currentSelectedGroup.id === trialGroup.id ? "blue" : "red"}
          opacity={currentSelectedGroup.id === trialGroup.id ? 0.2 : 0.5}
        />

        {selectedBranchId && (
          <>
            <Line
              x1={xScale(
                xAccessor(
                  data.find((d) => d.branch === selectedBranchId) || { x: 0 }
                )
              )}
              x2={xScale(
                xAccessor(
                  data.find((d) => d.branch === selectedBranchId) || { x: 0 }
                )
              )}
              y1={margin.top}
              y2={height - margin.bottom}
              stroke="black"
              strokeWidth={1}
              opacity={data.find((d) => d.branch === selectedBranchId) ? 1 : 0}
            />
          </>
        )}
        {tooltipLeft && (
          <Line
            from={{ x: tooltipLeft, y: 0 }}
            to={{ x: tooltipLeft, y: height }}
            stroke="rgba(0, 0, 0, 0.3)"
            strokeWidth={0.5}
            strokeDasharray="3,3"
            pointerEvents="none"
          />
        )}
      </svg>
      {tooltipData && (
        <TooltipWithBounds
          key={Math.random()}
          top={yScale(tooltipData.y)}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div
            style={{
              fontWeight: "bold",
              borderBottom: "1px solid white",
              paddingBottom: "4px",
              marginBottom: "4px",
            }}
          >
            ID: {tooltipData.branch}
          </div>
          <div>Value: {tooltipData.y.toFixed(2)}</div>
        </TooltipWithBounds>
      )}
    </>
  );
};

const AreaChart = ({ trialGroup }: AreaChartProps) => {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <ParentSize>
        {({ width, height }) => (
          <AreaChartBase
            trialGroup={trialGroup}
            width={width}
            height={height}
          />
        )}
      </ParentSize>
    </div>
  );
};

export default AreaChart;

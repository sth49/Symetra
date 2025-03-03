const calculateDominance = (a, b) => {
  const group1Coverage = a;
  const group2Coverage = b;

  const totalCoverage = group1Coverage + group2Coverage;
  if (totalCoverage === 0) return 0;

  const difference = group1Coverage - group2Coverage;
  const maxPossibleDiff = totalCoverage;

  // -100 ~ 100 사이의 값으로 정규화
  return Math.round((difference / maxPossibleDiff) * 100);
};

const SpeedometerGauge = ({ group1Value, group2Value, size = "30px" }) => {
  const value = calculateDominance(group1Value, group2Value);

  // value는 -100(완전 그룹2 우세)에서 100(완전 그룹1 우세) 사이의 값
  const needleRotation = -(-90 + ((value + 100) * 180) / 200); // -90도에서 90도 사이로 변환

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      {/* 게이지 배경 */}
      <svg width={size} height={size} viewBox="0 0 120 60">
        <defs>
          <linearGradient
            id={`gradient-${group1Value}-${group2Value}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={"rgba(0, 0, 255, 0.2)"} />
            <stop offset="50%" stopColor="#E5E7EB" />
            <stop offset="100%" stopColor={"rgba(255, 0, 0, 0.5)"} />
          </linearGradient>
        </defs>

        {/* 반원 게이지 배경 */}
        <path
          d="M10,50 A50,50 0 0,1 110,50"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* 게이지 채우기 (그라데이션) */}
        <path
          d="M10,50 A50,50 0 0,1 110,50"
          fill="none"
          stroke={`url(#gradient-${group1Value}-${group2Value})`}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* 중앙 마커 */}
        <line
          x1="60"
          y1="50"
          x2="60"
          y2="42"
          stroke="#6B7280"
          strokeWidth="2"
        />

        {/* 게이지 마커들 */}
        <line
          x1="20"
          y1="50"
          x2="20"
          y2="44"
          stroke="#6B7280"
          strokeWidth="1"
        />
        <line
          x1="40"
          y1="50"
          x2="40"
          y2="44"
          stroke="#6B7280"
          strokeWidth="1"
        />
        <line
          x1="80"
          y1="50"
          x2="80"
          y2="44"
          stroke="#6B7280"
          strokeWidth="1"
        />
        <line
          x1="100"
          y1="50"
          x2="100"
          y2="44"
          stroke="#6B7280"
          strokeWidth="1"
        />

        {/* 바늘 */}
        <line
          x1="60"
          y1="50"
          x2="60"
          y2="20"
          stroke={"#6B7280"}
          strokeWidth="4"
          style={{
            transformOrigin: "60px 50px",
            transform: `rotate(${needleRotation}deg)`,
            transition: "transform 0.3s ease-out",
          }}
        />

        {/* 바늘 중앙 원 */}
        <circle cx="60" cy="50" r="3" fill={"#6B7280"} />
      </svg>
    </div>
  );
};

export default SpeedometerGauge;

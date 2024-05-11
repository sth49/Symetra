import Content from "./components/layout/Content";
import Header from "./components/layout/Header";
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
function App() {
  const [data, setData] = useState([]);
  useEffect(() => {
    // CSV 파일의 URL 지정
    const csvFileUrl = "./src/data/ParaSuit_t.csv";

    async function fetchData() {
      const response = await fetch(csvFileUrl);
      console.log(response);
      const reader = response.body?.getReader(); // Add null check for response.body
      const result = await reader?.read(); // Add null check for reader
      const decoder = new TextDecoder("utf-8");
      const csv = decoder.decode(result?.value); // Add null check for result

      // 파싱된 데이터를 상태로 설정
      Papa.parse(csv, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          setData(results.data);
        },
      });
    }

    fetchData();
  }, []);
  console.log(data);
  return (
    <>
      <Header />
      <Content />
    </>
  );
}

export default App;

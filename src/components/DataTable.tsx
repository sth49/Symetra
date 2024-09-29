import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useCustomStore } from "../store";
import { useTable, useBlockLayout } from "react-table";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Switch,
  Text,
} from "@chakra-ui/react";
import { HyperparamTypes } from "../model/hyperparam";
import { FaSort } from "react-icons/fa6";
import { FaSortUp } from "react-icons/fa6";
import { FaSortDown } from "react-icons/fa6";
import { formatting } from "../model/utils";
import * as d3 from "d3";

interface DataTableProps {
  onSelectTrial: any;
}

const DataTable: React.FC<DataTableProps> = ({ onSelectTrial }) => {
  const { exp, hyperparams, setGroups, groups } = useCustomStore();
  const [sortedData, setSortedData] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "metric",
    direction: "descending", // ascending or descending
  });
  const rowRefs = useRef({});
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef(null);

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [isMultiSelect, setIsMultiSelect] = useState(false);

  const [visible, setVisible] = useState(false);
  const [columnGroup, setColumnGroup] = useState(null);
  const scrollContainerRef = useRef(null);
  const headerRef = useRef(null);

  const data = useMemo(
    () =>
      exp?.trials.map((trial) => ({
        id: trial.id,
        metric: trial.metric,
        ...trial.params,
      })) || [],
    [exp]
  );

  const columns = useMemo(
    () => [
      {
        key: "checked",
        label: (
          <input
            type="checkbox"
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedRows(new Set(data.map((item) => item.id)));
              } else {
                setSelectedRows(new Set());
                // updateSelectedTrials(new Set());
              }
            }}
          />
        ),
        width: 30,
        visibility: true,
        type: "checkbox",
        hp: null,
        canGroup: false,
        isGroup: false,
      },
      {
        key: "id",
        label: "ID",
        width: 40,
        visibility: true,
        type: "string",
        hp: null,
        canGroup: false,
        isGroup: false,
      },
      {
        key: "metric",
        label: "Coverage",
        width: 60,
        visibility: true,
        type: "numerical",
        hp: null,
        canGroup: true,
        isGroup: false,
      },
      ...(exp?.hyperparams.map((hp) => ({
        key: hp.name,
        label: hp.displayName,
        width: 55,
        visibility: hp.visible,
        type: hp.type,
        hp: hp,
        canGroup: true,
        isGroup: false,
      })) || []),
    ],
    [exp, hyperparams]
  );
  const defaultColumn = React.useMemo(
    () => ({
      width: 150,
    }),
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    totalColumnsWidth,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
    },
    useBlockLayout
  );

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}></div>
  );
};

export default DataTable;

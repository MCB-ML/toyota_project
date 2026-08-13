import { useEffect, useReducer } from "react";
import { type Edge, useEdgesState, useNodesState } from "reactflow";
import { toast } from "sonner";
import { useGenerateRelationTable } from "../../../services/api/dataset/fabric/generateRelationTable";
import { useGetSampleData } from "../../../services/api/dataset/fabric/getSampleData";
import { useGetSchemaSourceList } from "../../../services/api/dataset/getSchemaSourceList";
import type { ColumnList, DatasetReducerState } from "../../../types/dataset.types";
import type {
  GenereteSampleDataRequest,
  TableData,
  TableRelationRequest,
} from "../../../types/datasetFabric.types";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import type { CompanyAction } from "../CompanyInfo/Company.reducer";
import { getUUID } from "../DataAgent/DataAgent.reducer";
import type { DatasetAction } from "./Dataset.reducer";
import { DatasetFabricStateInit, DatasetFabricStateReducer } from "./DatasetFabric.reducer";
import { DatasetFabricButton } from "./molecules/button/DatasetFabricButton";
import DatasetFabricConnection from "./organism/step/fabric/DatasetFabricConnection";
import DatasetFabricGenerateSource from "./organism/step/fabric/DatasetFabricGenerateSource";
import DatsetFabricCreateSource from "./organism/step/fabric/DatsetFabricCreateSource";
import { DatasetConfig } from "./organism/step/importFile/DatasetConfig";
import DatasetReview from "./organism/step/importFile/DatasetReview";

interface DatasetFabricComponentProps {
  stateDataset: DatasetReducerState;
  dispatchCompany: React.Dispatch<CompanyAction>;
  dispatchDataset: React.Dispatch<DatasetAction>;
  companyId: string;
  setFooterButtons: (buttons: React.ReactNode) => void;
}

const DatasetFabricComponent = ({
  stateDataset,
  dispatchCompany,
  dispatchDataset,
  companyId,
  setFooterButtons,
}: DatasetFabricComponentProps) => {
  const { data: datasetSchemaSourceList, isLoading: isfetchSql } = useGetSchemaSourceList("", "");
  const [state, dispatch] = useReducer(DatasetFabricStateReducer, DatasetFabricStateInit);

  const [edges, setEdges] = useEdgesState([]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);

  const { mutate: sampleData, isPending: isFetchingSampleData } = useGetSampleData();

  const { mutate: generateRelationTable, isPending: isGeneratingRelation } =
    useGenerateRelationTable();

  const deleteEdgeById = (id: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== id));
  };

  const executeGenerate = (value: string) => {
    const par: TableRelationRequest = {
      companyId: companyId,
      query: value,
      mode: state.fabricMode === "E" ? 1 : 0,
    };
    const edgesToAdd: Edge[] = [];

    generateRelationTable(par, {
      onSuccess: (res) => {
        if (res?.success) {
          const parseResult = JSON.parse(res.result);

          dispatch({
            type: "getQueryBuilder",
            payload: parseResult.sqlQuery,
            fabricColumnList: parseResult.columnList,
          });

          dispatch({ type: "getColumnDataType", payload: parseResult.columnList });

          if (state.fabricMode === "C") {
            if (
              nodes.length > 1 &&
              (parseResult.relation.length === 0 || parseResult.relation === undefined)
            ) {
              toast.error("Failed  ", {
                description: "There's no relation column match , please edit manual relationship !",
              });

              return;
            }

            if (nodes.length > 1) {
              nodes.forEach((n: any) => {
                parseResult.relation.forEach((rel: any) => {
                  if (n.data.table === rel.tableTarget) {
                    const sourceNode = nodes.find(
                      (node: any) => node.data.table === rel.tableSource,
                    );

                    if (!sourceNode) return;

                    edgesToAdd.push({
                      id: `edge-${getUUID()}`,

                      source: sourceNode.id,
                      sourceHandle: `${rel.tableSource},${rel.columnSource},source`,
                      target: n.id,
                      targetHandle: `${rel.tableTarget},${rel.columnTarget},target`,

                      animated: false,
                      type: "deletable",
                      data: { onDelete: deleteEdgeById },

                      style: {
                        stroke: "#347298",
                        strokeWidth: 2,
                      },
                    });
                  }
                });
              });
              setEdges((eds) => [...eds, ...edgesToAdd]);
            }
          } else {
            dispatch({ type: "editErdFabric", payload: "C" });
          }

          onExecuteQuery(parseResult);
        }
      },
    });
  };

  const generateRelation = () => {
    //  dispatch({ type: "setQueryResult", payload: [] })

    dispatch({
      type: "getQueryBuilder",
      payload: "",
      fabricColumnList: [],
    });

    dispatch({ type: "getColumnDataType", payload: [] });

    //   dispatch({ type: "setQueryResult", payload: [] });

    dispatch({
      type: "previewData",
      payload: {
        data: [],
        header: [],
        typeDataValue: [],
      },
    });

    if (nodes.length === 0) {
      toast.error("Failed", {
        description: getErrorMessage("Please choose  table / source!"),
      });

      return;
    }

    const param: TableData = {
      tableList: [],
      relationList: [],
    };
    let r: string = "";

    nodes.forEach((data: any) => {
      param.tableList.push({ tableName: data.data.table, column: data.data.columns });
    });

    if (state.fabricMode === "E") {
      edges.forEach((rel: any) => {
        var getTableSource = rel.sourceHandle.split(",")[0];
        var getColumnSource = rel.sourceHandle.split(",")[1];
        var getTableTarget = rel.targetHandle.split(",")[0];
        var getColumnTarget = rel.targetHandle.split(",")[1];

        nodes.forEach((data: any) => {
          if (getTableSource === data.data.table)
            param.relationList.push({
              tableSource: getTableSource,
              columnSource: getColumnSource,
              columnTarget: getColumnTarget,
              tableTarget: getTableTarget,
            });
        });
      });
    }

    r = JSON.stringify(state.fabricMode === "C" ? param.tableList : param);

    executeGenerate(r);
  };

  const getSampleData = (par: GenereteSampleDataRequest, query: any) => {
    sampleData(par, {
      onSuccess: (res) => {
        if (res) {
          if (res.success) {
            const normalizeDataType = (dbType: string): string => {
              switch (dbType.toLowerCase()) {
                case "varchar":
                case "nvarchar":
                case "text":
                  return "String";

                case "int":
                case "smallint":
                  return "Integer";

                case "date":
                case "datetime":
                  return "Date";

                case "bigint":
                case "decimal":
                case "numeric":
                case "float":
                  return "Decimal";

                default:
                  return "";
              }
            };
            const normalizedColumnList = query.columnList.map((col: ColumnList) => ({
              ...col,
              dataType: normalizeDataType(col.dataType),
            }));
            dispatch({
              type: "previewData",
              payload: {
                data: res.result,
                header: query.columnList.map((e: ColumnList) => e.columnName),
                typeDataValue: normalizedColumnList,
              },
            });
          } else {
            dispatch({
              type: "previewData",
              payload: {
                data: [],
                header: [],
                typeDataValue: [],
              },
            });
          }
        }
      },
      onError: (error) => {
        toast.error("Failed to get sample data  ", {
          description: getErrorMessage(error),
        });
      },
    });
  };

  const onExecuteQuery = (query: any) => {
    if (!state.queryBuilder && !query.sqlQuery) {
      toast.error("Failed", {
        description: getErrorMessage("There's no Query to execute"),
      });

      return;
    }

    const par: GenereteSampleDataRequest = {
      query: query.sqlQuery ? query.sqlQuery : state.queryBuilder,
      serverName: state.dbConnection.serverName,
      dbName: state.dbConnection.dbName,
      page: 1,
      limit: 10,
      paging: true,
    };

    getSampleData(par, query);
  };

  const renderStepFabric = () => {
    switch (stateDataset.datasetStep) {
      case 2:
        return <DatasetFabricConnection state={state} dispatch={dispatch} />;
      case 3:
        return (
          <DatsetFabricCreateSource
            edges={edges}
            setEdges={setEdges}
            nodes={nodes}
            setNodes={setNodes}
            onNodesChange={onNodesChange}
            state={state}
            companyId={companyId}
            stateDataset={stateDataset}
            dispatch={dispatch}
            generatingRelation={generateRelation}
            dispatchState={dispatchDataset}
            isGeneratingRelation={isGeneratingRelation}
          />
        );
      case 4:
        return (
          <DatasetFabricGenerateSource
            edges={edges}
            setEdges={setEdges}
            nodes={nodes}
            setNodes={setNodes}
            onNodesChange={onNodesChange}
            state={state}
            companyId={companyId}
            stateDataset={stateDataset}
            dispatch={dispatch}
            dispatchState={dispatchDataset}
            onExecuteQuery={onExecuteQuery}
            generatingRelation={generateRelation}
            isGeneratingRelation={isGeneratingRelation}
            isFetchingSampleData={isFetchingSampleData}
          />
        );
      case 5:
        return (
          <DatasetConfig
            state={state}
            dispatch={dispatch}
            sourceList={/*datasetSchemaSourceList?.result ||*/ []}
            companyId={""}
          />
        );
      case 6:
        return <DatasetReview state={state} />;
      default:
        return null;
    }
  };

  useEffect(() => {
    setFooterButtons(
      <DatasetFabricButton
        state={stateDataset}
        stateFabric={state}
        dispatchCompany={dispatchCompany}
        dispatchDataset={dispatchDataset}
        dispatch={dispatch}
        companyId={companyId}
        nodes={nodes}
        edges={edges}
        setEdges={setEdges}
        onExecuteQuery={onExecuteQuery}
        setNodes={setNodes}
        generateRelation={generateRelation}
        isGeneratingRelation={isGeneratingRelation}
      />,
    );
  }, [
    stateDataset.datasetStep,
    state,
    stateDataset.importMethod.ext,
    state.fabricMode,
    nodes,
    edges,
  ]);

  return <>{renderStepFabric()}</>;
};

export default DatasetFabricComponent;

import { sql } from "@codemirror/lang-sql";
import CodeMirror from "@uiw/react-codemirror";
import { Play, SendHorizontal } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { format } from "sql-formatter";
import { useGenerateQuery } from "../../../../../../services/api/dataset/fabric/generateQuery";
import type { DatasetReducerState } from "../../../../../../types/dataset.types";
import type {
  DatasetFabricReducerState,
  FabricTableList,
  GenereteQueryRequest,
} from "../../../../../../types/datasetFabric.types";
import { getErrorMessage } from "../../../../../../utils/getErrorMessage";
import LoadingPage from "../../../../../reusable/loadingPage";
import type { DatasetFabricAction } from "../../../DatasetFabric.reducer";

interface DatasetFabricPromptProps {
  companyId: string;
  state: DatasetFabricReducerState;
  stateDataset: DatasetReducerState;
  dispatch: React.Dispatch<DatasetFabricAction>;
  nodes: any;

  onExecuteQuery: (val: string) => void;
}

const DatasetFabricPrompt = ({
  companyId,
  state,
  stateDataset,
  dispatch,
  nodes,
  onExecuteQuery,
}: DatasetFabricPromptProps) => {
  const { mutate: generateQuery, isPending: isGeneratingRelation } = useGenerateQuery();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const divtextareaRef = useRef<HTMLDivElement>(null);

  const autoResize = () => {
    const divtextarea = divtextareaRef.current;
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }

    if (divtextarea) {
      divtextarea.style.height = "auto";
      divtextarea.style.height = `${divtextarea.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;

    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();

      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newValue = `${target.value.substring(0, start)}\n${target.value.substring(end)}`;

      target.value = newValue;
      target.selectionStart = target.selectionEnd = start + 1;

      setTimeout(() => {
        autoResize();
        target.scrollTop = target.scrollHeight;
      }, 0);

      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      onGenerateQuery();
    }
  };

  const onGenerateQuery = async () => {
    if (!state.queryPrompt) {
      toast.error("Failed", {
        description: getErrorMessage("Prompt cannot empty!"),
      });

      return;
    }

    const tableList: FabricTableList[] = [];

    nodes.forEach((data: any) => {
      tableList.push({ tableName: data.data.table, columnList: data.data.columns });
    });

    const p = { sqlSyntax: state.queryBuilder, tableSchema: tableList };

    const par: GenereteQueryRequest = {
      query: JSON.stringify(p),
      prompt: state.queryPrompt,
      companyId: companyId,
    };

    if (state.queryPrompt) {
      generateQuery(par, {
        onSuccess: (res) => {
          if (res?.success) {
            const r = JSON.parse(res.result);

            dispatch({ type: "setQueryBuilder", payload: r.sqlQuery, editQuery: false });
            dispatch({ type: "getColumnDataType", payload: r.columnList });

            onExecuteQuery(r.sqlQuery);
          } else {
          }
        },
      });
    }
  };

  const formattedSQL =
    state.queryBuilder && stateDataset.datasetStep === 4 && state.fabricMode === "C"
      ? format(state.queryBuilder, { language: "sql" })
      : "";

  return (
    <div className="h-full">
      <LoadingPage isLoading={isGeneratingRelation} />
      <div className=" text-sm mb-3">
        <div className="py-2 flex items-center justify-between">
          <span>SQL Syntax</span>
          {state.editQuery && (
            <button
              onClick={() => onExecuteQuery("")}
              className={`flex border px-3 rounded  transition-all duration-300 ease-in-out items-center hover:text-white`}
            >
              {<Play />} Execute
            </button>
          )}
        </div>
        <CodeMirror
          value={formattedSQL}
          height="260px"
          extensions={[sql()]}
          className={`border rounded-md overflow-hidden `}
          onChange={(v) => dispatch({ type: "setQueryBuilder", payload: v, editQuery: true })}
        />
      </div>
      <div className=" w-full flex rounded-md border   bg-white items-center">
        <div className="basis-[90%] h-full">
          <textarea
            className=" w-full focus:outline-none pl-4 py-3 rounded-lg overflow-y-auto "
            placeholder="Message Chat"
            onChange={(e) => dispatch({ type: "queryPrompt", payload: e.target.value })}
            onKeyDown={handleKeyDown}
            rows={3}
            style={{ width: "100%", resize: "none" }}
          />
        </div>

        <div className="basis-[10%] h-full items-center text-center flex  flex-row-reverse ">
          <button
            className=" h-full bg-trans text-center  items-center mr-5"
            onClick={() => onGenerateQuery()}
          >
            <SendHorizontal />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatasetFabricPrompt;

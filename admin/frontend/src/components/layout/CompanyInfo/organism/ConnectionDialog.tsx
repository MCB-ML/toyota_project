import { ArrowLeft, ArrowRight, Link, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import asql from "@/assets/image/dataset/a-sql.png";
import fabric from "@/assets/image/dataset/fabric.png";
import rag from "@/assets/image/dataset/rag.png";
import sql from "@/assets/image/dataset/sql-server.png";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { useConnectDb } from "../../../../services/api/company/connectDb";
import { useConnectRag } from "../../../../services/api/company/connectRag";
import type { CompanyConnections, Source, TableList } from "../../../../types/companyInfo.types";
import LoadingPage from "../../../reusable/loadingPage";
import type { CompanyAction } from "../Company.reducer";
import ConnectionForm from "./Connection/ConnectionForm";
import Preview from "./Connection/Preview";
import Table from "./Connection/Table";
export interface ConnectionDialogProps {
  mode: number;
  data?: CompanyConnections;
  connectionList: CompanyConnections[];
  open: boolean;
  onClose: () => void;
  dispatch: React.Dispatch<CompanyAction>;
}

type Tab = "sql" | "rag" | "fabric";

const ConnectionDialog = ({
  mode,
  open,
  onClose,
  connectionList,
  dispatch,
  data,
}: ConnectionDialogProps) => {
  type TabConfig = {
    key: Tab;
    label: string;
    description: string;
    image: string;
  };
  const { t } = useTranslation();
  const tabConfigs: TabConfig[] = [
    {
      key: "sql",
      label: "SQL Server",
      description: "Connect to relational database",
      image: sql,
    },
    {
      key: "sql",
      label: "Azure SQL",
      description: "Connect to relational database",
      image: asql,
    },

    {
      key: "fabric",
      label: "Fabric",
      description: "Microsoft Fabric data platform",
      image: fabric,
    },
    {
      key: "rag",
      label: "RAG",
      description: "Retrieval augmented generation",
      image: rag,
    },
  ];

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [tab, setTab] = useState<Tab | null>(
    mode === 2 ? (tabConfigs.find((d) => d.key === data?.agentType)?.key ?? null) : null,
  );

  const [table, setTable] = useState<TableList[]>([]);

  const [selectedTables, setSelectedTables] = useState<Source[]>([]);

  const { mutateAsync: _connectDb, isPending: isPendingConnectDb } = useConnectDb();
  const { mutateAsync: _connectRag, isPending: isPendingConnectRag } = useConnectRag();
  const initform: CompanyConnections = {
    id: uuidv4(),
    companyId: "",
    configType: "dataagent",
    agentType: "",
    endpoint: "",
    database: "",
    user: "",
    password: "",
    port: 0,
    sourceList: [],
  };
  const [form, setForm] = useState<CompanyConnections>(mode === 2 ? (data ?? initform) : initform);

  const validateButton = async (val: string) => {
    if (val === "next" && step === 1) {
      if (
        tab === "sql" &&
        [form.endpoint, form.database, form.user, form.password].some((v) => !v)
      ) {
        toast.error("Input Required");
        return;
      }
      if (tab === "fabric" && [form.endpoint, form.database].some((v) => !v)) {
        toast.error("Input Required");
        return;
      }

      if (tab === "rag" && [form.endpoint, form.database, form.password].some((v) => !v)) {
        toast.error("Input Required");
        return;
      }

      await connectDb();
    }

    if (val === "next" && step === 2) {
      const tableSelect = selectedTables.length;

      if (tableSelect === 0) {
        toast.error("Please select table");
        return;
      } else {
        setForm((prev) => ({
          ...prev,
          sourceList: selectedTables,
          agentType: tab ?? "",
        }));
      }
    }
    if (val === "next" && step < 3 && step !== 1) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3);
    }

    if (val === "prev" && step <= 3) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleSubmitForm = () => {
    onClose();

    if (mode === 2) {
      dispatch({
        type: "update_company_connection",
        payload: form,
      });
    } else {
      const check = connectionList.some(
        (data) =>
          data.endpoint === form.endpoint &&
          data.database === form.database &&
          data.agentType === form.agentType,
      );

      if (check) {
        toast.warning("Connection already exist!");
        return;
      }
      dispatch({
        type: "add_company_connection",
        payload: form,
      });
    }
  };

  const connectDb = async () => {
    try {
      if (!form || !tab) return;

      setForm((prev) => ({
        ...prev,
        agentType: tab,
      }));

      const par: CompanyConnections = {
        ...form,
        agentType: tab,
        configType: "dataagent",
      };

      let result: any;

      const check = connectionList.some(
        (data) =>
          data.endpoint === par.endpoint &&
          data.database === par.database &&
          data.agentType === par.agentType,
      );

      if (check && mode === 1) {
        toast.warning("Connection already exist!");
        return;
      }
      if (tab === "sql" || tab === "fabric") {
        result = await _connectDb(par);

        if (result?.success) {
          setTable(result?.result ?? []);
          if (mode === 2) setSelectedTables(data?.sourceList ?? []);
        }
      } else {
        setTable([]);
        setSelectedTables([]);

        result = await _connectRag(par);
      }

      if (!result?.success) {
        toast.error(result?.message);
        return;
      }

      setStep(2);
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  useEffect(() => {
    if (step === 1 && mode === 1) {
      setSelectedTables([]);
    }

    //if (step === 2)
    //    connectDb();
  }, [step]);

  useEffect(() => {
    if (!open) {
      setTab(null);
      setStep(1);
    }
  }, [open]);

  const showTable = step === 2 && (tab === "sql" || tab === "fabric");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`w-[60%]! max-w-none! max-h-155 justify-center p-2! gap-0 overflow-visible flex flex-col`}
        preventCloseOnOutsideClick={false}
      >
        <LoadingPage isLoading={isPendingConnectDb || isPendingConnectRag} />
        <div hidden={tab != null} className="grid grid-cols-2 gap-6 items-center p-7">
          {tabConfigs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`${
                tab === t.key ? "bg-[#1557b0] text-white" : ""
              } flex py-3 items-center gap-6 rounded px-4 shadow text-sm cursor-pointer transition-all duration-300 transform hover:bg-[#1557b0] hover:text-white hover:scale-105`}
            >
              <img className="w-10" src={t.image} alt={t.label} />

              <div className="flex flex-col text-left">
                <span className="font-medium">{t.label}</span>
                <span className="text-xs opacity-70">{t.description}</span>
              </div>
            </button>
          ))}
        </div>

        {tab && step === 1 && <ConnectionForm tab={tab} form={form} setForm={setForm} />}

        {/*<div className="flex flex-col flex-1 overflow-hidden">*/}
        {/*    <div className="overflow-y-auto overflow-x-visible flex-1">*/}

        {/*        {step == 1 && (<>*/}
        {/*            <div className="flex border-b">*/}
        {/*            <div className=" p-5">*/}
        {/*                <h2 className="text-lg font-semibold text-gray-800">*/}
        {/*                    Set-up Connection*/}
        {/*                </h2>*/}
        {/*                <p className="text-sm text-gray-500">*/}
        {/*                    Configure a connection to your data source using SQL, RAG, or Fabric.*/}
        {/*                </p>*/}
        {/*            </div>*/}
        {/*            <div className="grid grid-cols-1 md:grid-cols-1 gap-1  gap-y-5 ml-auto pr-10">*/}

        {/*                <div className="flex items-center gap-6 px-5 pt-3 border-b">*/}
        {/*                    {tabs?.map((t) => (*/}
        {/*                        <button*/}
        {/*                            key={t}*/}
        {/*                            onClick={() => setTab(t)}*/}
        {/*                            className={`pb-2 text-sm font-medium border-b-2 transition-colors cursor-pointer*/}
        {/*                        ${tab === t*/}
        {/*                                    ? "border-blue-500 text-blue-600"*/}
        {/*                                    : "border-transparent text-gray-500 hover:text-gray-700"}`}*/}
        {/*                        >*/}
        {/*                            {t.toUpperCase()}*/}
        {/*                        </button>*/}
        {/*                    ))}*/}
        {/*                </div>*/}

        {/*            </div>*/}
        {/*            </div>*/}
        {/*                <ConnectionForm tab={tab} form={form} setForm={setForm} />*/}

        {/*        </>)}*/}

        {showTable && (
          <Table
            connection={form}
            loadingTable={isPendingConnectDb}
            data={table}
            selectedTables={selectedTables}
            setSelectedTables={setSelectedTables}
          />
        )}

        {(step === 3 || (step === 2 && tab === "rag")) && tab && (
          <Preview tab={tab} connection={form} selectedTables={selectedTables} />
        )}
        <DialogFooter
          hidden={tab == null}
          aria-disabled={isPendingConnectDb}
          className="px-6 py-4 border-t border-[#e5e7eb] gap-2"
        >
          {step !== 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => validateButton("prev")}
              className="w-full md:w-auto cursor-pointer"
              disabled={false}
            >
              <ArrowLeft size={18} />
              {t("CompanyInfo.next", "Previous")}
            </Button>
          )}
          {((step < 3 && tab !== "rag") || (step !== 2 && tab === "rag")) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => validateButton("next")}
              className="w-full md:w-auto cursor-pointer"
              disabled={false}
            >
              {step === 1 ? (
                <>
                  <Link size={18} />
                  {t("CompanyInfo.connect", "Connect")}
                </>
              ) : (
                <>
                  <ArrowRight size={18} />
                  {t("CompanyInfo.next", "Next")}
                </>
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full md:w-auto cursor-pointer"
            disabled={false}
          >
            <X size={18} />
            {t("CompanyInfo.close", "Close")}
          </Button>

          {(step === 3 || (step === 2 && tab === "rag")) && (
            <Button
              type="button"
              onClick={handleSubmitForm}
              className="w-full md:w-auto bg-[#1a73e8] hover:bg-[#1557b0] cursor-pointer"
              disabled={false}
            >
              <Save size={18} />
              {t("CompanyInfo.add")}
            </Button>
          )}
        </DialogFooter>
        {/*</div>*/}
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionDialog;

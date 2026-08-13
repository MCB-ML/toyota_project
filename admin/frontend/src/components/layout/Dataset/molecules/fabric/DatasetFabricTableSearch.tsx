import { Search } from "lucide-react";
import type { DatasetFabricAction } from "../../DatasetFabric.reducer";

interface DatasetFabricTableSearchProps {
  dispatch: React.Dispatch<DatasetFabricAction>;
}

export const DatasetFabricTableSearch = ({ dispatch }: DatasetFabricTableSearchProps) => {
  return (
    <>
      <h3 className="mb-3 font-bold">Available Tables</h3>
      <div className={`border  py-1 flex items-center mb-2 rounded-xl px-3 mb-5`}>
        <div className="shrink-0">
          <Search size={15} className=" mx-2 " />
        </div>

        <input
          name="search_table"
          placeholder="Search tables ..."
          className="appearance-none  rounded leading-tight focus:outline-none focus:shadow-outline w-full"
          onChange={(_e) => ""}
        />
      </div>
    </>
  );
};

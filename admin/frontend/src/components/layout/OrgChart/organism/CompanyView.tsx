import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCompanyView } from "@/services/api/orgChart/getCompanyView";
import CompanyTree from "../molecules/Company/CompanyTree";

const CompanyView = ({ searchQuery }: { searchQuery: string }) => {
  const { data, isLoading } = useGetCompanyView();
  const companies = data?.companies || [];

  // Filter company based on name or description
  const filteredData = companies.filter(
    (company) =>
      company.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="w-full h-full p-6 pt-0 md:pt-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="space-y-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 border border-[#f3f4f6] shadow-sm flex items-start gap-4"
              >
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-12 w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full p-6 pt-0 md:pt-6 relative"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
          <h1 className="text-2xl font-bold">Company Overview</h1>
        </div>

        <div className="space-y-8 mt-4">
          {filteredData.length > 0 ? (
            filteredData.map((company) => <CompanyTree key={company.id} company={company} />)
          ) : (
            <div className="text-center py-10 text-[#6a7282]">
              No companies found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CompanyView;

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCompanyView } from "@/services/api/orgChart/getCompanyView";
import { useGetEndUserView } from "@/services/api/orgChart/getEndUserView";
import { UserCard } from "../atoms/UserCard";

const EndUsersView = ({ searchQuery }: { searchQuery: string }) => {
  const { data: userData, isLoading: isUsersLoading } = useGetEndUserView();
  const { data: companyData, isLoading: isCompaniesLoading } = useGetCompanyView();

  const users = userData?.users || [];
  const lookupCompanies = companyData?.companies || [];

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isUsersLoading || isCompaniesLoading) {
    return (
      <div className="w-full h-full p-6 pt-0 md:pt-6 relative">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-lg border border-[#f3f4f6] h-[500px] overflow-hidden flex flex-col"
              >
                {/* Header Skeleton */}
                <div className="p-6 bg-[#f9fafb] border-b border-[#f3f4f6] flex items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-5 w-20 rounded" />
                  </div>
                </div>
                {/* Body Skeleton */}
                <div className="p-6 space-y-6 flex-1">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20 rounded-md" />
                      <Skeleton className="h-8 w-24 rounded-md" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
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
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#101828]">Users</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} lookupCompanies={lookupCompanies} />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-[#6a7282]">
              <p className="text-lg">No users found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EndUsersView;

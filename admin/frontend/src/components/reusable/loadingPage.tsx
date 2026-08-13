export interface LoadingPageProps {
  isLoading: boolean;
}

const LoadingPage = ({ isLoading }: LoadingPageProps) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
    </div>
  );
};

export default LoadingPage;

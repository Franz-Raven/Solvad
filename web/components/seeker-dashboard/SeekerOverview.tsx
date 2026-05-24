interface SeekerOverviewProps {
  totalProblems: number;
  inProgress: number;
  solved: number;
}

export function SeekerOverview({ totalProblems, inProgress, solved }: SeekerOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Posted Problems
        </h3>
        <p className="text-3xl font-bold text-accent">{totalProblems}</p>
        <p className="text-sm text-gray-600 mt-2">Total problems posted</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          In Progress
        </h3>
        <p className="text-3xl font-bold text-secondary">{inProgress}</p>
        <p className="text-sm text-gray-600 mt-2">Being worked on</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Solved
        </h3>
        <p className="text-3xl font-bold text-primary-foreground">{solved}</p>
        <p className="text-sm text-gray-600 mt-2">Successfully completed</p>
      </div>
    </div>
  );
}

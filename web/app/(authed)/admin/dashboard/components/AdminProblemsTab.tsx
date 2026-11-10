"use client";

import { useState } from "react";
import { FolderX } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminProblems } from "../api/dashboard";
import { useAdminPage } from "../hooks/use-admin-page";
import { formatDate, getProblemStatusBadge, humanizeEnum } from "../utils/format";
import { AdminPagination } from "./AdminPagination";
import { PanelEmptyState, PanelError, TableSkeleton } from "./AdminPanelStates";
import { AdminSearchInput } from "./AdminSearchInput";

const PAGE_SIZE = 10;

const PROBLEM_STATUSES = ["OPEN", "CLAIMED", "IN_PROGRESS", "SOLVED_OPEN_FOR_IMPROVEMENT", "COMPLETED", "CLOSED"];

export default function AdminProblemsTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(0);
  };

  const { data, isLoading, error, retry } = useAdminPage(
    () => getAdminProblems(status, debouncedSearch, page, PAGE_SIZE),
    [status, debouncedSearch, page]
  );

  const problems = data?.content ?? [];
  const isFiltered = Boolean(debouncedSearch) || status !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <AdminSearchInput value={search} onChange={handleSearchChange} placeholder="Search title or organization..." />
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full md:w-[240px] px-4 py-2.5 bg-white rounded-lg border border-slate-200 text-sm shadow-sm font-medium cursor-pointer transition-colors hover:border-slate-300 focus:ring-2 focus:ring-accent/20">
            <SelectValue placeholder="Filter by status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer font-medium">All Statuses</SelectItem>
            {PROBLEM_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="cursor-pointer font-medium">
                {humanizeEnum(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <PanelError message={error} onRetry={retry} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : problems.length === 0 ? (
        <PanelEmptyState
          icon={<FolderX className="w-8 h-8" />}
          title="No problems found"
          message={isFiltered ? "No problems match the current filters." : "Problems will appear here once industry partners post them."}
          action={
            isFiltered && (
              <button onClick={clearFilters} className="text-accent text-sm hover:underline font-bold cursor-pointer">
                Clear filters
              </button>
            )
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden animate-in fade-in duration-300">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">Problem</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Preferred Program</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SDG Focus</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right pr-4">Posted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {problems.map((problem) => (
                <TableRow key={problem.id}>
                  <TableCell className="pl-4 py-3">
                    <div className="min-w-[240px] max-w-[360px]">
                      <p className="text-sm font-bold text-slate-900 truncate">{problem.title}</p>
                      <p className="text-xs font-medium text-slate-500 truncate">{problem.organizationName}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-700 max-w-[200px] truncate">{problem.preferredProgram || "—"}</TableCell>
                  <TableCell className="text-sm font-medium text-slate-700 max-w-[200px] truncate">{problem.sdgFocus || "—"}</TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider whitespace-nowrap ${getProblemStatusBadge(problem.status)}`}>
                      {humanizeEnum(problem.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-500 text-right pr-4 whitespace-nowrap">
                    {formatDate(problem.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!error && !isLoading && data && (
        <AdminPagination
          currentPage={page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

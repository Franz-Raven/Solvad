"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, UserX } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminListedRole, AdminUser } from "@/types/admin";
import { getAdminUsers } from "../api/dashboard";
import { useAdminPage } from "../hooks/use-admin-page";
import { formatDate, getInitials } from "../utils/format";
import { AdminPagination } from "./AdminPagination";
import { PanelEmptyState, PanelError, TableSkeleton } from "./AdminPanelStates";
import { AdminSearchInput } from "./AdminSearchInput";

const PAGE_SIZE = 10;

const ROLE_COPY: Record<AdminListedRole, {
  description: string;
  searchPlaceholder: string;
  nameHeader: string;
  detailHeader: string;
  secondaryHeader: string;
  emptyTitle: string;
}> = {
  SOLVER: {
    description: "Students registered as solvers, newest first.",
    searchPlaceholder: "Search name, email, or institution...",
    nameHeader: "Solver",
    detailHeader: "Institution",
    secondaryHeader: "Degree Program",
    emptyTitle: "No solvers found",
  },
  SEEKER: {
    description: "Organizations posting problems on the platform, newest first.",
    searchPlaceholder: "Search organization, contact, or email...",
    nameHeader: "Organization",
    detailHeader: "Contact Person",
    secondaryHeader: "Contact Number",
    emptyTitle: "No industry partners found",
  },
};

function UserAvatar({ user }: { user: AdminUser }) {
  const [imgError, setImgError] = useState(false);
  if (user.profileUrl && !imgError) {
    return (
      <img
        src={user.profileUrl}
        alt=""
        onError={() => setImgError(true)}
        className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center ring-1 ring-accent/20 shrink-0">
      {getInitials(user.displayName)}
    </div>
  );
}

export default function AdminUsersTab({ role }: { role: AdminListedRole }) {
  const copy = ROLE_COPY[role];
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(0);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const { data, isLoading, error, retry } = useAdminPage(
    () => getAdminUsers(role, debouncedSearch, page, PAGE_SIZE),
    [role, debouncedSearch, page]
  );

  const users = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <AdminSearchInput value={search} onChange={handleSearchChange} placeholder={copy.searchPlaceholder} />
        <div className="flex items-center gap-3 justify-between md:justify-end">
          <p className="text-sm text-slate-500 font-medium hidden lg:block">{copy.description}</p>
          {role === "SEEKER" && (
            <Link
              href="/admin/add-industry"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-secondary text-white text-sm font-bold rounded-lg shadow-sm transition-colors active:scale-[0.98] shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Industry Partner
            </Link>
          )}
        </div>
      </div>

      {error ? (
        <PanelError message={error} onRetry={retry} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : users.length === 0 ? (
        <PanelEmptyState
          icon={<UserX className="w-8 h-8" />}
          title={copy.emptyTitle}
          message={debouncedSearch ? `Nothing matches "${debouncedSearch}".` : "Accounts will appear here once they register."}
          action={
            debouncedSearch && (
              <button onClick={() => handleSearchChange("")} className="text-accent text-sm hover:underline font-bold cursor-pointer">
                Clear search
              </button>
            )
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden animate-in fade-in duration-300">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">{copy.nameHeader}</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{copy.detailHeader}</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{copy.secondaryHeader}</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right pr-4">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell className="pl-4 py-3">
                    <div className="flex items-center gap-3 min-w-[220px]">
                      <UserAvatar user={user} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.displayName}</p>
                        <p className="text-xs font-medium text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-700 max-w-[220px] truncate">{user.detail || "—"}</TableCell>
                  <TableCell className="text-sm font-medium text-slate-700 max-w-[220px] truncate">{user.secondaryDetail || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                          user.verified
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {user.verified ? "Verified" : "Unverified"}
                      </span>
                      {user.authProvider === "GOOGLE" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider bg-slate-50 text-slate-600 border-slate-200">
                          Google
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-500 text-right pr-4 whitespace-nowrap">
                    {formatDate(user.createdAt)}
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

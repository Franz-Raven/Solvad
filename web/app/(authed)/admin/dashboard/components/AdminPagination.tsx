"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({ currentPage, totalPages, totalElements, pageSize, onPageChange }: AdminPaginationProps) {
  if (totalElements === 0) return null;

  const from = currentPage * pageSize + 1;
  const to = Math.min((currentPage + 1) * pageSize, totalElements);

  const goTo = (page: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (page >= 0 && page < totalPages && page !== currentPage) onPageChange(page);
  };

  return (
    <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-xs font-semibold text-slate-500">
        Showing <span className="text-slate-900">{from}–{to}</span> of{" "}
        <span className="text-slate-900">{totalElements.toLocaleString()}</span>
      </p>

      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={goTo(currentPage - 1)}
                className={currentPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i).map((page) => {
              if (page === 0 || page === totalPages - 1 || Math.abs(page - currentPage) <= 1) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink href="#" onClick={goTo(page)} isActive={currentPage === page} className="cursor-pointer font-bold">
                      {page + 1}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              if (Math.abs(page - currentPage) === 2) {
                return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>;
              }
              return null;
            })}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={goTo(currentPage + 1)}
                className={currentPage >= totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

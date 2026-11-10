"use client";

import dynamic from "next/dynamic";
import { Activity, Building2, FolderOpen, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabChunkSkeleton } from "./AdminPanelStates";

// Each panel is code-split and only downloaded when its tab is first opened.
// Radix unmounts inactive TabsContent, so panels also fetch their data lazily.
const AdminActivityTab = dynamic(() => import("./AdminActivityTab"), { loading: TabChunkSkeleton, ssr: false });
const AdminUsersTab = dynamic(() => import("./AdminUsersTab"), { loading: TabChunkSkeleton, ssr: false });
const AdminProblemsTab = dynamic(() => import("./AdminProblemsTab"), { loading: TabChunkSkeleton, ssr: false });

const TABS = [
  { value: "activity", label: "Recent Activity", icon: Activity },
  { value: "solvers", label: "Solvers", icon: GraduationCap },
  { value: "partners", label: "Industry Partners", icon: Building2 },
  { value: "problems", label: "Problems", icon: FolderOpen },
] as const;

export function AdminDashboardTabs() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100">
      <Tabs defaultValue="activity" className="gap-0">
        <div className="border-b border-slate-100 px-4 md:px-8 pt-3 md:pt-4 overflow-x-auto no-scrollbar">
          <TabsList variant="line" className="h-12 gap-6 justify-start">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex-none px-1 font-semibold text-slate-500 hover:text-slate-900 cursor-pointer data-[state=active]:text-accent after:bg-accent"
              >
                <Icon />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="p-6 md:p-8">
          <TabsContent value="activity">
            <AdminActivityTab />
          </TabsContent>
          <TabsContent value="solvers">
            <AdminUsersTab role="SOLVER" />
          </TabsContent>
          <TabsContent value="partners">
            <AdminUsersTab role="SEEKER" />
          </TabsContent>
          <TabsContent value="problems">
            <AdminProblemsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

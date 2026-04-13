import * as React from "react"
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col min-h-screen min-w-0">
        {children}
      </div>
    </div>
  );
}
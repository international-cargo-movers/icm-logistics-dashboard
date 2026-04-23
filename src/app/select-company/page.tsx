"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INTERNAL_COMPANIES } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ChevronRight, ShieldCheck } from "lucide-react";

export default function SelectCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = (companyId: string) => {
    setLoading(companyId);
    // Set cookie that expires in 12 hours
    document.cookie = `tenant-id=${companyId}; path=/; max-age=${12 * 60 * 60}`;
    
    // Redirect to dashboard
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <ShieldCheck className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Select Company Terminal
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Identify your operational entity to access the logistics dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INTERNAL_COMPANIES.map((company) => (
            <Card 
              key={company.id}
              className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden"
              onClick={() => handleSelect(company.id)}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Building2 className="h-8 w-8" />
                </div>
                <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              
              <div className="mt-8 relative z-10">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                  {company.name}
                </h3>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                  Logistics & Freight
                </p>
              </div>

              {loading === company.id && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                  <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              <div className="absolute -right-4 -bottom-4 h-32 w-32 bg-slate-50 rounded-full group-hover:bg-blue-50 transition-colors z-0"></div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

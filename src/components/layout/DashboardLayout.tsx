"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="md:pl-64">
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main className={`flex-1 ${className}`}>
          {children}
        </main>
      </div>
    </div>
  );
} 
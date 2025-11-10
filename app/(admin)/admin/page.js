// app/admin/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Table, ChevronDown, Search, Grid, List } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/card/CardHeader";
import { CardTitle } from "@/components/ui/card/CardTitle";
import { CardDescription } from "@/components/ui/card/CardDescription";
import { CardGrid } from "@/components/ui/card/CardGrid";
import { CardList } from "@/components/ui/card/CardList";

import { ADMIN_TABLES } from "@/lib/config";

export default function AdminPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"

  const filteredTables = ADMIN_TABLES.filter(
    (table) =>
      table.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTableSelect = (tableValue) => {
    router.push(`/admin/${tableValue}`);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg'>
              <Database className='text-white' size={24} />
            </div>
            <div>
              <h1 className='text-3xl font-bold text-text'>Admin Dashboard</h1>
              <p className='text-muted text-sm'>
                Manage your database tables and configurations
              </p>
            </div>
          </div>
        </div>

        {/* Search & View Toggle */}
        <Card variant='default' padding='md' className='mb-6'>
          <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
            {/* Search */}
            <div className='relative flex-1 w-full sm:w-auto'>
              <Search
                className='absolute left-3 top-1/2 -translate-y-1/2 text-muted'
                size={18}
              />
              <input
                type='text'
                placeholder='Search tables...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all'
              />
            </div>

            {/* View Mode Toggle */}
            <div className='flex gap-2 bg-background rounded-lg p-1 border border-border'>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-text hover:bg-surface"
                }`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-text hover:bg-surface"
                }`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </Card>

        {/* Tables Grid/List */}
        {viewMode === "grid" ? (
          <CardGrid cols={3} gap='md'>
            {filteredTables.map((table) => (
              <Card
                key={table.value}
                variant='clickable'
                padding='md'
                onClick={() => handleTableSelect(table.value)}
                className='group'
              >
                <div className='flex items-start gap-4'>
                  <div className='text-4xl group-hover:scale-110 transition-transform'>
                    {table.icon}
                  </div>
                  <div className='flex-1'>
                    <CardHeader className='mb-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <CardTitle className='group-hover:text-primary transition-colors'>
                          {table.label}
                        </CardTitle>
                        <Table size={14} className='text-muted' />
                      </div>
                      <CardDescription>{table.description}</CardDescription>
                    </CardHeader>
                  </div>
                </div>
              </Card>
            ))}
          </CardGrid>
        ) : (
          <CardList gap='sm'>
            {filteredTables.map((table) => (
              <Card
                key={table.value}
                variant='clickable'
                padding='md'
                onClick={() => handleTableSelect(table.value)}
                className='group'
              >
                <div className='flex items-center gap-4'>
                  <div className='text-3xl group-hover:scale-110 transition-transform'>
                    {table.icon}
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                      <CardTitle className='group-hover:text-primary transition-colors text-base'>
                        {table.label}
                      </CardTitle>
                      <Table size={14} className='text-muted' />
                    </div>
                    <CardDescription>{table.description}</CardDescription>
                  </div>
                  <ChevronDown
                    className='text-muted rotate-[-90deg] group-hover:translate-x-1 transition-transform'
                    size={20}
                  />
                </div>
              </Card>
            ))}
          </CardList>
        )}

        {/* No Results */}
        {filteredTables.length === 0 && (
          <div className='text-center py-12'>
            <div className='text-6xl mb-4'>🔍</div>
            <p className='text-muted'>
              No tables found matching &quot;{searchTerm}&quot;
            </p>
          </div>
        )}

        {/* Stats Footer */}
        <Card variant='default' padding='md' className='mt-8'>
          <div className='flex flex-wrap gap-6 justify-center text-center'>
            <div>
              <div className='text-2xl font-bold text-primary'>
                {ADMIN_TABLES.length}
              </div>
              <div className='text-xs text-muted uppercase tracking-wider'>
                Total Tables
              </div>
            </div>
            <div className='w-px bg-border' />
            <div>
              <div className='text-2xl font-bold text-secondary'>
                {filteredTables.length}
              </div>
              <div className='text-xs text-muted uppercase tracking-wider'>
                Filtered
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

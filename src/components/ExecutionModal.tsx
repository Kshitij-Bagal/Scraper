import React, { useState } from 'react';
import { 
  X, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  Search, 
  Table, 
  Terminal, 
  FileSpreadsheet, 
  FileJson,
  Layers
} from 'lucide-react';
import type { ScrapeExecutionResult } from '../types/scraper.ts';
import { downloadCsvFile, downloadJsonFile } from '../utils/exportUtils.ts';

interface ExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ScrapeExecutionResult | null;
  isRunning: boolean;
}

export const ExecutionModal: React.FC<ExecutionModalProps> = ({
  isOpen,
  onClose,
  result,
  isRunning
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'logs'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const data = result?.data || [];
  
  // Extract columns (exclude internal `_page` and `_index` from display header if desired, or keep them)
  const columns = data.length > 0 
    ? Object.keys(data[0]).filter(k => !k.startsWith('_')) 
    : [];

  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Extraction Results</h3>
                {isRunning ? (
                  <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800 animate-pulse">
                    <RotateCw className="w-3 h-3 animate-spin" /> Scraping pages...
                  </span>
                ) : result?.success ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" /> Completed in {result.executionTimeMs}ms
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-rose-400 font-medium bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                    <AlertCircle className="w-3 h-3" /> Failed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {result ? `${result.totalItems} records extracted across ${result.pagesScraped} page(s)` : 'Execution in progress...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export buttons */}
            <button
              onClick={() => downloadCsvFile(data, 'scraped_records.csv')}
              disabled={data.length === 0}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={() => downloadJsonFile(data, 'scraped_records.json')}
              disabled={data.length === 0}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download JSON</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-header / Filters */}
        <div className="bg-slate-900 px-5 py-2.5 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table Grid ({filteredData.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Execution Logs ({result?.logs?.length || 0})</span>
            </button>
          </div>

          {activeTab === 'table' && (
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search extracted rows..."
                className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4">
          {activeTab === 'table' ? (
            data.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <Table className="w-8 h-8 text-slate-600" />
                <p className="text-sm">No extracted records yet.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 overflow-hidden shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-300 select-none">
                    <tr>
                      <th className="p-2.5 font-mono text-[11px] text-slate-500 w-12 border-r border-slate-800">#</th>
                      <th className="p-2.5 font-mono text-[11px] text-slate-500 w-16 border-r border-slate-800">Page</th>
                      {columns.map(col => (
                        <th key={col} className="p-2.5 font-bold text-slate-200 border-r border-slate-800 last:border-r-0">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-2.5 font-mono text-slate-500 border-r border-slate-850">{idx + 1}</td>
                        <td className="p-2.5 font-mono text-cyan-400 border-r border-slate-850">P{row._page || 1}</td>
                        {columns.map(col => {
                          const val = row[col];
                          const isNull = val === null || val === undefined;
                          return (
                            <td key={col} className="p-2.5 border-r border-slate-850 last:border-r-0 max-w-xs truncate">
                              {isNull ? (
                                <span className="bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                  null
                                </span>
                              ) : typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://')) ? (
                                <a
                                  href={val}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                                >
                                  {val}
                                </a>
                              ) : (
                                <span className="text-slate-200">{String(val)}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="bg-black/60 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-1 overflow-auto h-full border border-slate-800">
              {result?.logs && result.logs.length > 0 ? (
                result.logs.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    {log.startsWith('[ERROR]') ? (
                      <span className="text-rose-400 font-bold">{log}</span>
                    ) : log.startsWith('[PAGE') ? (
                      <span className="text-cyan-400 font-bold">{log}</span>
                    ) : log.startsWith('[POLITENESS]') ? (
                      <span className="text-amber-400">{log}</span>
                    ) : log.startsWith('[COMPLETE]') ? (
                      <span className="text-emerald-400 font-bold">{log}</span>
                    ) : (
                      <span className="text-slate-400">{log}</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">No logs available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

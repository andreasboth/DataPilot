/**
 * Automated Test Runner View
 * Interactive in-browser test runner executing all domain, security, policy, command,
 * sync, module quarantine, and localization test suites.
 */

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Layers,
  Sparkles,
  Filter,
} from 'lucide-react';
import { DataPilotTestSuite, TestCaseResult } from '../../tests/testSuite';

export const TestRunnerView: React.FC = () => {
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const runTests = async () => {
    setIsRunning(true);
    const suite = new DataPilotTestSuite();
    const testResults = await suite.runAllTests();
    setResults(testResults);
    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0);

  const categories = ['ALL', 'Security', 'Domain', 'Policy', 'Commands', 'Events', 'Modules', 'Sync', 'Localization'];

  const filteredResults = selectedCategory === 'ALL'
    ? results
    : results.filter((r) => r.category === selectedCategory);

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Header */}
      <div className="p-5 rounded-lg bg-[#0f172a] border border-slate-800 border-l-4 border-l-blue-600 flex flex-wrap items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
        <div>
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            CI/CD VERIFICATION PIPELINE
          </div>
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">DataPilot Automated Verification Suite</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Executes programmatic assertions against domain models, fine-grained RBAC, safety policies, command buses, idempotency, and module quarantine.
          </p>
        </div>

        <button
          onClick={runTests}
          id="btn-run-all-tests"
          disabled={isRunning}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-[0_0_12px_rgba(37,99,235,0.35)] disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          {isRunning ? 'Running Test Suite...' : 'Re-run All Tests'}
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Total Assertions</span>
            <span className="text-2xl font-bold font-mono text-slate-100">{total}</span>
          </div>
          <div className="w-9 h-9 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Passed</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{passed}</span>
          </div>
          <div className="w-9 h-9 rounded bg-emerald-950/40 border border-emerald-900/60 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Failed</span>
            <span className="text-2xl font-bold font-mono text-rose-400">{failed}</span>
          </div>
          <div className="w-9 h-9 rounded bg-rose-950/40 border border-rose-900/60 flex items-center justify-center text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Execution Time</span>
            <span className="text-2xl font-bold font-mono text-blue-400">{totalDuration} ms</span>
          </div>
          <div className="w-9 h-9 rounded bg-blue-950/40 border border-blue-900/60 flex items-center justify-center text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results List */}
      <div className="rounded-lg bg-[#0f172a] border border-slate-800 overflow-hidden divide-y divide-slate-800/80 shadow-sm">
        {filteredResults.map((t) => (
          <div key={t.id} className="p-4 hover:bg-slate-850/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                  t.passed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {t.id}
                </span>
                <span className="font-semibold text-sm text-slate-100">{t.name}</span>
                <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800">
                  {t.category}
                </span>
              </div>
              <p className="text-slate-400 text-xs font-mono pl-1">{t.details}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">{t.durationMs}ms</span>
              <span className={`px-2.5 py-0.5 rounded font-bold text-[11px] font-mono flex items-center gap-1.5 ${
                t.passed
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-800'
              }`}>
                {t.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                {t.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

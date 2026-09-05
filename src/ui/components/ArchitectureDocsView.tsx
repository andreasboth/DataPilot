/**
 * Architecture & Contracts Explorer
 * Documents the complete structural design, module contracts, separation of concerns,
 * and implementation status (IMPLEMENTED / SCAFFOLDED / NOT YET IMPLEMENTED).
 */

import React from 'react';
import {
  FileCode2,
  CheckCircle2,
  Clock,
  CircleDashed,
  Layers,
  Shield,
  Database,
  Radio,
  Workflow,
  Cpu,
} from 'lucide-react';

export const ArchitectureDocsView: React.FC = () => {
  return (
    <div className="space-y-6 pb-16 text-slate-100 max-w-5xl mx-auto">
      {/* Overview Card */}
      <div className="p-6 rounded-lg bg-[#0f172a] border border-slate-800 border-l-4 border-l-blue-600 space-y-3 shadow-sm backdrop-blur-sm">
        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          PLATFORM SPECIFICATION & SPEC REPOSITORY
        </div>
        <div className="flex items-center gap-2.5">
          <FileCode2 className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">DataPilot Architecture Specification v1.0</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          DataPilot is an <strong className="text-white">industry-agnostic, modular, Local-First software platform</strong> designed to power mission-critical edge deployments.
          The core is completely decoupled from any single domain (such as campers) or UI framework (such as Android or Web).
          <strong className="text-blue-400"> CamperPilot</strong> is the flagship reference product built directly atop the DataPilot Platform.
        </p>
      </div>

      {/* 1. Structural Hierarchy Diagram */}
      <div className="p-6 rounded-lg bg-[#0f172a] border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 font-mono">
            <Layers className="w-4 h-4 text-blue-400" />
            1. Structural Hierarchy
          </h3>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">LAYERED CONTRACTS</span>
        </div>

        <div className="p-4 rounded bg-slate-950/90 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
          <div className="text-blue-400 font-bold flex items-center gap-2">
            <span className="text-slate-600">01</span> DataPilot Platform (Agnostic Core Engine)
          </div>
          <div className="pl-6 text-slate-400 flex items-center gap-2">
            <span className="text-slate-600">02</span> ↓ Industry Profile (e.g. Camper Profile | Marine | Microgrid | Aviation)
          </div>
          <div className="pl-12 text-sky-400 font-bold flex items-center gap-2">
            <span className="text-slate-600">03</span> ↓ Product (e.g. CamperPilot | MarinePilot | HomePilot)
          </div>
          <div className="pl-16 text-emerald-400 font-bold flex items-center gap-2">
            <span className="text-slate-600">04</span> ↓ Product Modules (CamperDeck | CamperFlow | Energy | Climate | Water | Security)
          </div>
          <div className="pl-20 text-slate-400 flex items-center gap-2">
            <span className="text-slate-600">05</span> ↓ Physical Devices & Bus Integrations (CAN-CI | LIN | BLE | Modbus | MQTT)
          </div>
        </div>
      </div>

      {/* 2. Separation of Ownership, Authority, and Responsibility */}
      <div className="p-6 rounded-lg bg-[#0f172a] border border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 font-mono">
          <Shield className="w-4 h-4 text-indigo-400" />
          2. Complete Separation: Ownership ≠ Authority ≠ Responsibility
        </h3>
        <p className="text-xs text-slate-400">
          In DataPilot, no relationship may be automatically inferred from another. A single asset has distinct entities for each concern:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 border-t-2 border-t-indigo-500 space-y-2">
            <span className="font-bold text-indigo-300 block text-sm">Ownership</span>
            <span className="text-slate-400 italic">"Who legally owns something?"</span>
            <p className="text-slate-300 text-xs">
              Assigned to legal entities (e.g. <strong className="text-white">Leasing Bank GmbH</strong> or private owner). Governs asset transfer, collateral, and property rights.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 border-t-2 border-t-blue-500 space-y-2">
            <span className="font-bold text-blue-300 block text-sm">Authority</span>
            <span className="text-slate-400 italic">"Who is authoritative for state?"</span>
            <p className="text-slate-300 text-xs">
              Technical decision domain. (e.g. <strong className="text-white">BMS-Hardware</strong> is authoritative for battery SOC; <strong className="text-white">Gateway</strong> is authoritative for local bus; <strong className="text-white">Platform</strong> for cloud accounts).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 border-t-2 border-t-emerald-500 space-y-2">
            <span className="font-bold text-emerald-300 block text-sm">Responsibility</span>
            <span className="text-slate-400 italic">"Who is responsible for task/safety?"</span>
            <p className="text-slate-300 text-xs">
              Assigned to operators (e.g. <strong className="text-white">Driver</strong> for vehicle operation; <strong className="text-white">Certified Workshop</strong> for chassis inspections and heating safety checks).
            </p>
          </div>
        </div>
      </div>

      {/* 3. Implementation Status Matrix (Section 66 & 75) */}
      <div className="p-6 rounded-lg bg-[#0f172a] border border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 font-mono">
          <Workflow className="w-4 h-4 text-emerald-400" />
          3. Implementation Status Overview
        </h3>

        <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60 text-xs">
          {/* IMPLEMENTED items */}
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-slate-100">DataPilot Core & Domain Contracts</span>
              <span className="text-slate-400 text-xs block mt-0.5">Separation of Tenant, User, Account, Role, Ownership, Authority, Responsibility, Desired vs Actual.</span>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> IMPLEMENTED
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-slate-100">Security & Fine-Grained RBAC</span>
              <span className="text-slate-400 text-xs block mt-0.5">Scope hierarchy (Platform to Operation), device trust revocation, session validation, audit trail.</span>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> IMPLEMENTED
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-slate-100">16-State Command Lifecycle & Idempotency</span>
              <span className="text-slate-400 text-xs block mt-0.5">REQUESTED through VERIFIED, duplicate command ID deduplication, hardware state feedback verifier.</span>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> IMPLEMENTED
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-slate-100">Multi-Tier Connectivity Model</span>
              <span className="text-slate-400 text-xs block mt-0.5">8 independent network tiers (Client, Local LAN, Gateway, Bus, Uplink, Cloud, External APIs, Sync).</span>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> IMPLEMENTED
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-slate-100">Local-First Sync Queue & Domain Conflict Strategy</span>
              <span className="text-slate-400 text-xs block mt-0.5">AUTHORITY_WINS, VERSION_WINS, MERGE. Hardware sensors win over cloud platform replica.</span>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> IMPLEMENTED
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-slate-100">Module Isolation & Automatic Quarantine</span>
              <span className="text-slate-400 text-xs block mt-0.5">Fault in CamperFlow isolates it to QUARANTINED while CamperDeck and other modules run smoothly.</span>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> IMPLEMENTED
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-slate-100">Localization Engine (DE Hochdeutsch, EN Fallback, Registers)</span>
              <span className="text-slate-400 text-xs block mt-0.5">Du vs Sie politeness registers, English fallback, Klingon easter egg with safety text lockout.</span>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> IMPLEMENTED
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-slate-100">Legal Hold Process & Deletion Guard</span>
              <span className="text-slate-400 text-xs block mt-0.5">Structured LegalHold model halts deletion pipeline with retention check and audit log.</span>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> IMPLEMENTED
            </span>
          </div>

          {/* SCAFFOLDED / PREPARED items */}
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-slate-100">Cloud Persistence Adapter</span>
              <span className="text-slate-400 text-xs block mt-0.5">SimulatedCloudAdapter prepared for future multi-tenant cloud synchronization.</span>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 text-amber-400" /> SCAFFOLDED
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-slate-100">Multi-Language Expansion (NL, FR, ES, SV, FI, DA, NO, IT, PT)</span>
              <span className="text-slate-400 text-xs block mt-0.5">Locale types and dictionary contracts prepared for product release phase.</span>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 text-amber-400" /> SCAFFOLDED
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-slate-100">Community Translation & Plugin Marketplace</span>
              <span className="text-slate-400 text-xs block mt-0.5">Trust tiers (OFFICIAL, VERIFIED, COMMUNITY, PRIVATE, UNTRUSTED) defined in module contracts.</span>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-900 text-slate-400 border border-slate-800 flex items-center gap-1 shrink-0">
              <CircleDashed className="w-3 h-3 text-slate-500" /> NOT YET IMPLEMENTED
            </span>
          </div>
        </div>
      </div>

      {/* 4. Open Decisions & Architecture Guidance */}
      <div className="p-6 rounded-lg bg-[#0f172a] border border-slate-800 space-y-3 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 font-mono">
          <Cpu className="w-4 h-4 text-blue-400" />
          4. Open Decisions & Architectural Recommendation
        </h3>
        <ul className="text-xs text-slate-300 space-y-2.5 list-disc pl-5">
          <li className="leading-relaxed">
            <strong className="text-slate-100">OPEN DECISION (OD-01): Physical Bus Bridge on Android</strong> –
            Recommendation: The Android client should never speak raw SPI/CAN directly; it connects via local REST/WebSocket or gRPC to an embedded Linux / Zephyr / ESP32 Gateway running in the camper double floor.
          </li>
          <li className="leading-relaxed">
            <strong className="text-slate-100">OPEN DECISION (OD-02): Local Storage Backend on Android</strong> –
            Recommendation: Local-first persistence uses Room (SQLite) on Android or LevelDB/IndexedDB on Web/Linux, wrapped behind the DataPilot <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-blue-300 border border-slate-800">StorageAdapter</code>.
          </li>
          <li className="leading-relaxed">
            <strong className="text-slate-100">OPEN DECISION (OD-03): CRDT vs Authority Wins for Telemetry</strong> –
            Recommendation: Telemetry strictly uses <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-emerald-300 border border-slate-800">AUTHORITY_WINS</code> (BMS is absolute truth for battery, Truma for heating). Collaborative text/notes use CRDTs.
          </li>
        </ul>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { Sparkles, Info, ShieldCheck, Database, Layers, X } from 'lucide-react';
import { Modal, Button } from '@/components/ui';

export function DemoBanner() {
  const isDemoMode =
    process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'demo' ||
    (typeof window !== 'undefined' && window.location.hostname.includes('demo'));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isDemoMode || isDismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white px-3 py-1.5 sm:px-4 text-[11px] sm:text-xs font-medium border-b border-blue-800/50 shadow-xs flex items-center justify-between gap-2 z-40">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold uppercase tracking-wider text-[9px] border border-blue-400/30 shrink-0">
            <Sparkles className="w-2.5 h-2.5 text-blue-300" />
            Modo Demo
          </span>
          <p className="truncate text-slate-200">
            Entorno de evaluación para <strong>Portafolio Profesional</strong> — Base de datos aislada con datos de prueba.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 text-cyan-300 hover:text-white underline underline-offset-2 transition font-bold"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stack & Arquitectura</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-white p-0.5 rounded-md transition"
            aria-label="Cerrar aviso demo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Acerca de Vivelite ERP — Versión Portafolio"
        description="Arquitectura de software, stack tecnológico y características del sistema"
        icon={<Layers className="w-5 h-5 text-blue-600" />}
        size="lg"
        footer={
          <div className="flex justify-end w-full">
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Continuar Navegando
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                Backend & Persistencia
              </h4>
              <p>• <strong>NestJS 10</strong> modular (Clean Architecture).</p>
              <p>• <strong>PostgreSQL</strong> con <strong>Prisma ORM</strong> y cálculo monetario exacto con <code>Decimal(10,2)</code>.</p>
              <p>• <strong>BullMQ + Redis</strong> para colas y procesamiento asíncrono.</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Frontend & UI/UX
              </h4>
              <p>• <strong>Next.js 15 (App Router)</strong> con <strong>React 19</strong>.</p>
              <p>• <strong>Tailwind CSS</strong> con Design System unificado.</p>
              <p>• <strong>TanStack Query v5</strong> para gestión de estado en servidor.</p>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
            <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              Módulos Integrados y Operatividad
            </h4>
            <ul className="list-disc pl-4 space-y-0.5 text-blue-800">
              <li><strong>Punto de Venta (POS):</strong> Venta con stock en tiempo real y retorno de bidones.</li>
              <li><strong>Control de Envases:</strong> Monitoreo de activos y custodia de clientes.</li>
              <li><strong>Facturación SUNAT:</strong> UBL 2.1 con afectaciones tributarias peruanas.</li>
              <li><strong>Cuentas por Cobrar:</strong> Límites de crédito, amortizaciones y cobranzas.</li>
              <li><strong>Logística y Reparto:</strong> Asignación de rutas y conductores en tiempo real.</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
}

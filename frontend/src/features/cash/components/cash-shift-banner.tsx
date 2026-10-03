'use client';

import React, { useState } from 'react';
import { Wallet, AlertCircle, CheckCircle2, Lock, Unlock } from 'lucide-react';
import { CashShift, CashRegister } from '../types/cash';
import { formatCurrency } from '@/lib/utils';
import { OpenShiftModal } from './open-shift-modal';
import { CloseShiftModal } from './close-shift-modal';

interface CashShiftBannerProps {
  shift: CashShift | null;
  registers: CashRegister[];
  onShiftChange: () => void;
}

export function CashShiftBanner({
  shift,
  registers,
  onShiftChange,
}: CashShiftBannerProps) {
  const [isOpenModalActive, setIsOpenModalActive] = useState(false);
  const [isCloseModalActive, setIsCloseModalActive] = useState(false);

  const isShiftOpen = shift && shift.status === 'ABIERTA';

  return (
    <>
      <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-900">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
            {isShiftOpen ? <Unlock className="w-5 h-5 text-emerald-600" /> : <Lock className="w-5 h-5 text-slate-500" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                {isShiftOpen ? 'Turno de Caja Abierto' : 'Caja Cerrada actualmente'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isShiftOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
              ></span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {isShiftOpen
                ? `${shift.cashRegister?.name || 'Caja Principal'} — Efectivo esperado: ${formatCurrency(
                    shift.summary?.expectedCashInBox || shift.initialBalance,
                  )} (Apertura: ${formatCurrency(shift.initialBalance)})`
                : 'Debe aperturar un turno de caja para registrar cobros en efectivo y ventas.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isShiftOpen ? (
            <button
              onClick={() => setIsCloseModalActive(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
            >
              Cerrar Caja / Arqueo
            </button>
          ) : (
            <button
              onClick={() => setIsOpenModalActive(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
            >
              Abrir Turno de Caja
            </button>
          )}
        </div>
      </div>

      <OpenShiftModal
        registers={registers}
        isOpen={isOpenModalActive}
        onClose={() => setIsOpenModalActive(false)}
        onSuccess={onShiftChange}
      />

      {shift && (
        <CloseShiftModal
          shift={shift}
          isOpen={isCloseModalActive}
          onClose={() => setIsCloseModalActive(false)}
          onSuccess={onShiftChange}
        />
      )}
    </>
  );
}

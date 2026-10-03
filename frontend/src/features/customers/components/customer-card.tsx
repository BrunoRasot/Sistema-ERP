'use client';

import React from 'react';
import {
  RotateCcw,
  Phone,
  MessageCircle,
  MapPin,
  Building2,
  Home,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Customer } from '../types/customer';
import { formatCurrency } from '@/lib/utils';

interface CustomerCardProps {
  customer: Customer;
  onOpenBottleModal: (customer: Customer) => void;
  onSelectCustomer?: (customer: Customer) => void;
}

export function CustomerCard({
  customer,
  onOpenBottleModal,
  onSelectCustomer,
}: CustomerCardProps) {
  const isCompany = customer.customerType === 'EMPRESA';
  const cleanPhone = customer.whatsapp || customer.phone;
  const whatsappUrl = `https://wa.me/51${cleanPhone.replace(/\D/g, '')}`;

  const tierColors: Record<string, string> = {
    BRONCE: 'bg-amber-100 text-amber-800 border-amber-300',
    PLATA: 'bg-slate-200 text-slate-700 border-slate-300',
    ORO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    DIAMANTE: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition space-y-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isCompany ? 'bg-indigo-50 text-indigo-700' : 'bg-brand-50 text-brand-700'
              }`}
            >
              {isCompany ? <Building2 className="w-3 h-3" /> : <Home className="w-3 h-3" />}
              {customer.customerType}
            </span>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                tierColors[customer.loyaltyTier] || 'bg-slate-100 text-slate-600'
              }`}
            >
              {customer.loyaltyTier}
            </span>

            {customer.subchannel && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {customer.subchannel}
              </span>
            )}

            {(customer.zone || customer.district) && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                {[customer.zone, customer.district].filter(Boolean).join(' • ')}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900 leading-snug">
            {customer.name}
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            {customer.documentType}: {customer.documentNumber}
          </p>
        </div>

        <div className="text-right shrink-0">
          <div
            className={`px-3 py-1.5 rounded-2xl border text-center ${
              customer.bottlesHolding > 0
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Bidones
            </span>
            <span className="text-base font-black">
              {customer.bottlesHolding}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1 text-xs text-slate-600">
        <div className="flex items-start gap-1.5">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>{customer.address}</span>
        </div>
        {customer.reference && (
          <p className="text-[11px] text-slate-400 pl-5 italic">
            Ref: {customer.reference}
          </p>
        )}
      </div>

      {Number(customer.currentDebt) > 0 && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-semibold text-rose-700">
            <AlertCircle className="w-3.5 h-3.5" />
            Deuda pendiente:
          </span>
          <span className="font-bold text-rose-800">
            {formatCurrency(customer.currentDebt)}
          </span>
        </div>
      )}

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <a
            href={`tel:${customer.phone}`}
            title="Llamar"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <Phone className="w-4 h-4" />
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Enviar WhatsApp"
            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>

        <button
          onClick={() => onOpenBottleModal(customer)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 font-bold text-xs transition active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retornar / Entregar</span>
        </button>
      </div>
    </div>
  );
}

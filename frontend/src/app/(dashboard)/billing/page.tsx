'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  FileText,
  Search,
  CheckCircle2,
  Printer,
  Calendar,
  DollarSign,
  Building2,
  User,
  Loader2,
  AlertCircle,
  ExternalLink,
  Send,
} from 'lucide-react';
import { billingService } from '@/features/billing/services/billing-service';
import { ElectronicDocument, InvoiceType } from '@/features/billing/types/billing';
import { TicketViewerModal } from '@/features/billing/components/ticket-viewer-modal';
import { EmitInvoiceModal } from '@/features/billing/components/emit-invoice-modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button, SearchInput, LoadingState, EmptyState } from '@/components/ui';

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ISSUED' | 'UNINVOICED'>('ISSUED');
  const [search, setSearch] = useState('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<InvoiceType | 'ALL'>('ALL');

  const [viewTicketId, setViewTicketId] = useState<string | null>(null);
  const [saleToInvoice, setSaleToInvoice] = useState<any | null>(null);

  // Consulta de Comprobantes Emitidos
  const {
    data: documentsData,
    isLoading: loadingDocuments,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ['billing-documents', { search, invoiceTypeFilter }],
    queryFn: () =>
      billingService.getDocuments({
        search: search.trim() || undefined,
        invoiceType: invoiceTypeFilter !== 'ALL' ? invoiceTypeFilter : undefined,
        limit: 50,
      }),
  });

  // Consulta de Ventas Pendientes de Facturación
  const {
    data: uninvoicedSales = [],
    isLoading: loadingUninvoiced,
    refetch: refetchUninvoiced,
  } = useQuery({
    queryKey: ['billing-uninvoiced-sales'],
    queryFn: () => billingService.getUninvoicedSales(50),
    enabled: activeTab === 'UNINVOICED',
  });

  const documents = documentsData?.data || [];

  const handleEmitSuccess = (documentId: string) => {
    refetchDocuments();
    refetchUninvoiced();
    queryClient.invalidateQueries({ queryKey: ['billing-documents'] });
    setViewTicketId(documentId);
  };

  const totalIssued = documents.length;
  const boletasCount = documents.filter((d) => d.invoiceType === 'BOLETA').length;
  const facturasCount = documents.filter((d) => d.invoiceType === 'FACTURA').length;
  const totalBilledAmount = documents.reduce(
    (acc, d) => acc + Number(d.sale?.total || 0),
    0,
  );

  return (
    <div className="space-y-4 lg:space-y-3 lg:h-full lg:flex lg:flex-col lg:min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Facturación Electrónica (SUNAT)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Emisión de Boletas (B001), Facturas (F001), estándar UBL 2.1 y formato térmico 80mm
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl self-start sm:self-auto text-xs font-bold border border-slate-200/80">
          <button
            onClick={() => setActiveTab('ISSUED')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'ISSUED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Comprobantes Emitidos ({documents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('UNINVOICED')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'UNINVOICED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Por Facturar ({uninvoicedSales.length})</span>
          </button>
        </div>
      </div>

      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Total Emitidos</span>
            <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{totalIssued}</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 text-slate-700">
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Aceptados SUNAT</span>
            <p className="text-lg sm:text-xl font-black text-emerald-600 mt-0.5">{totalIssued}</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Facturas / Boletas</span>
            <p className="text-lg sm:text-xl font-black text-blue-700 mt-0.5">
              {facturasCount} F / {boletasCount} B
            </p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Monto Facturado</span>
            <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              {formatCurrency(totalBilledAmount)}
            </p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {activeTab === 'ISSUED' ? (
        <div className="flex-1 min-h-0 flex flex-col space-y-3">
          <div className="shrink-0 card p-3 sm:p-3.5 space-y-2.5">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por serie (B001, F001), cliente, DNI o RUC..."
            />

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold scrollbar-none pb-0.5">
              <button
                onClick={() => setInvoiceTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                  invoiceTypeFilter === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Todos los Comprobantes
              </button>

              <button
                onClick={() => setInvoiceTypeFilter('BOLETA')}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                  invoiceTypeFilter === 'BOLETA'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                }`}
              >
                Boletas Electrónicas (B001)
              </button>

              <button
                onClick={() => setInvoiceTypeFilter('FACTURA')}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                  invoiceTypeFilter === 'FACTURA'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                }`}
              >
                Facturas Electrónicas (F001)
              </button>
            </div>
          </div>

          {loadingDocuments ? (
            <LoadingState text="Cargando comprobantes electrónicos..." />
          ) : documents.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-10 h-10" />}
              title="No hay comprobantes emitidos"
              description="No hay comprobantes que coincidan con la búsqueda. Puedes emitir comprobantes desde la pestaña 'Por Facturar'."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  icon={<FileText className="w-4 h-4" />}
                  onClick={() => setActiveTab('UNINVOICED')}
                >
                  Ver Ventas por Facturar
                </Button>
              }
            />
          ) : (
            <div className="flex-1 min-h-0 card overflow-hidden flex flex-col">
              <div className="overflow-y-auto overflow-x-auto flex-1 divide-y divide-slate-100">
                {documents.map((doc) => {
                  const docNum = `${doc.series}-${String(doc.correlative).padStart(8, '0')}`;
                  return (
                    <div
                      key={doc.id}
                      className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{docNum}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              doc.invoiceType === 'FACTURA'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-brand-100 text-brand-700'
                            }`}
                          >
                            {doc.invoiceType}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{doc.sunatStatus}</span>
                          </span>
                        </div>

                        <p className="font-bold text-slate-800">
                          {doc.sale?.customer?.name || 'Público General'}{' '}
                          <span className="text-slate-400 font-normal">
                            ({doc.sale?.customer?.documentType}: {doc.sale?.customer?.documentNumber})
                          </span>
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(doc.issueDate)}
                          </span>
                          <span>Venta: {doc.sale?.saleNumber}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 font-medium block">Total</span>
                          <span className="text-base font-black text-slate-900">
                            {formatCurrency(doc.sale?.total || 0)}
                          </span>
                        </div>

                        <button
                          onClick={() => setViewTicketId(doc.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-sm"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ver Ticket</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Pestaña: Ventas Pendientes de Facturar */
        <div className="flex-1 min-h-0 flex flex-col space-y-3">
          {loadingUninvoiced ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              <span className="text-xs font-semibold">Cargando ventas pendientes...</span>
            </div>
          ) : uninvoicedSales.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">¡Al día! No hay ventas pendientes</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Todas las ventas registradas cuentan con su comprobante electrónico emitido ante SUNAT.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {uninvoicedSales.map((sale: any) => (
                <div
                  key={sale.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-sm text-slate-900">
                        {sale.saleNumber}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {formatDate(sale.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{sale.customer?.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {sale.customer?.documentType}: {sale.customer?.documentNumber}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Importe a Facturar:</span>
                    <span className="font-black text-base text-brand-700">
                      {formatCurrency(sale.total)}
                    </span>
                  </div>

                  <button
                    onClick={() => setSaleToInvoice(sale)}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Emitir Boleta / Factura</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {saleToInvoice && (
        <EmitInvoiceModal
          sale={saleToInvoice}
          isOpen={!!saleToInvoice}
          onClose={() => setSaleToInvoice(null)}
          onSuccess={handleEmitSuccess}
        />
      )}

      {viewTicketId && (
        <TicketViewerModal
          documentId={viewTicketId}
          isOpen={!!viewTicketId}
          onClose={() => setViewTicketId(null)}
        />
      )}
    </div>
  );
}

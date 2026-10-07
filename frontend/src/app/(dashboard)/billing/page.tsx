'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  FileText,
  CheckCircle2,
  Printer,
  Calendar,
  DollarSign,
  Building2,
} from 'lucide-react';
import { billingService } from '@/features/billing/services/billing-service';
import { ElectronicDocument, InvoiceType } from '@/features/billing/types/billing';
import { TicketViewerModal } from '@/features/billing/components/ticket-viewer-modal';
import { EmitInvoiceModal } from '@/features/billing/components/emit-invoice-modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Button,
  SearchInput,
  LoadingState,
  EmptyState,
  PageHeader,
  StatCard,
  Badge,
  useToast,
} from '@/components/ui';

export default function BillingPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
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
    toast.success('Comprobante emitido', 'El XML UBL 2.1 fue generado y enviado a SUNAT.');
    refetchDocuments();
    refetchUninvoiced();
    queryClient.invalidateQueries({ queryKey: ['billing-documents'] });
    setViewTicketId(documentId);
  };

  const totalIssued = documents.length;
  const aceptadosSunatCount = documents.filter((d) => d.sunatStatus === 'ACEPTADO').length;
  const boletasCount = documents.filter((d) => d.invoiceType === 'BOLETA').length;
  const facturasCount = documents.filter((d) => d.invoiceType === 'FACTURA').length;
  const totalBilledAmount = documents.reduce(
    (acc, d) => acc + Number(d.sale?.total || 0),
    0,
  );

  return (
    <div className="space-y-4 lg:space-y-3 lg:h-full lg:flex lg:flex-col lg:min-h-0">
      <PageHeader
        title="Comprobantes de Venta"
        description="Registro de tickets emitidos, comprobantes internos y exportación para facturación externa"
        actions={
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold border border-slate-200/80">
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
              <span>Pendientes ({uninvoicedSales.length})</span>
            </button>
          </div>
        }
      />

      {/* Tarjetas de Métricas */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard
          label="Total Comprobantes"
          value={totalIssued}
          subtitle="Tickets y ventas emitidas"
          icon={<Receipt className="w-5 h-5" />}
          iconColor="bg-blue-50 text-blue-600"
        />

        <StatCard
          label="Monto Total"
          value={formatCurrency(totalBilledAmount)}
          subtitle="Ingresos por comprobantes"
          icon={<DollarSign className="w-5 h-5" />}
          iconColor="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          label="Desglose de Series"
          value={`${facturasCount} F / ${boletasCount} B`}
          subtitle="Comprobantes registrados"
          icon={<Building2 className="w-5 h-5" />}
          iconColor="bg-purple-50 text-purple-600"
        />

        <StatCard
          label="Estado de Registro"
          value={`${aceptadosSunatCount} Registrados`}
          subtitle="Control interno de ventas"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconColor="bg-emerald-50 text-emerald-600"
        />
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
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Todos los Comprobantes
              </button>

              <button
                onClick={() => setInvoiceTypeFilter('BOLETA')}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                  invoiceTypeFilter === 'BOLETA'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Boletas Electrónicas (B001)
              </button>

              <button
                onClick={() => setInvoiceTypeFilter('FACTURA')}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                  invoiceTypeFilter === 'FACTURA'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                          <span className="font-mono font-bold text-sm text-slate-900">{docNum}</span>
                          <Badge variant="default">{doc.invoiceType}</Badge>
                          <Badge variant="success">
                            <CheckCircle2 className="w-3 h-3 mr-0.5 inline" />
                            <span>{doc.sunatStatus}</span>
                          </Badge>
                        </div>

                        <p className="font-bold text-slate-800">
                          {doc.sale?.customer?.name || 'Público General'}{' '}
                          <span className="text-slate-400 font-normal">
                            ({doc.sale?.customer?.documentType}: {doc.sale?.customer?.documentNumber})
                          </span>
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
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
                          <span className="text-base font-bold text-slate-900">
                            {formatCurrency(doc.sale?.total || 0)}
                          </span>
                        </div>

                        <Button
                          variant="primary"
                          size="xs"
                          icon={<Printer className="w-3.5 h-3.5" />}
                          onClick={() => setViewTicketId(doc.id)}
                        >
                          Ver Ticket
                        </Button>
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
            <LoadingState text="Cargando ventas pendientes de facturar..." />
          ) : uninvoicedSales.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-8 h-8 text-emerald-600" />}
              title="¡Al día! No hay ventas pendientes"
              description="Todas las ventas registradas cuentan con su comprobante electrónico emitido ante SUNAT."
            />
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {uninvoicedSales.map((sale: any) => (
                <div
                  key={sale.id}
                  className="card p-4 sm:p-5 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-sm text-slate-900">
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

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">Importe a Facturar:</span>
                    <span className="font-bold text-base text-slate-900">
                      {formatCurrency(sale.total)}
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Receipt className="w-4 h-4" />}
                    onClick={() => setSaleToInvoice(sale)}
                    className="w-full"
                  >
                    Emitir Boleta / Factura
                  </Button>
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

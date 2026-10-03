'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Users,
  Package,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { importService } from '@/features/imports/services/import-service';
import { ImportResult } from '@/features/imports/types/import';
import { FileDropzone } from '@/features/imports/components/file-dropzone';

export default function ImportsPage() {
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'PRODUCTS'>('CUSTOMERS');

  const [customerFile, setCustomerFile] = useState<{ base64: string; name: string } | null>(null);
  const [productFile, setProductFile] = useState<{ base64: string; name: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDownloadTemplate = async (type: 'customers' | 'products') => {
    try {
      await importService.downloadTemplate(type);
    } catch (err: any) {
      alert(err?.message || 'Error al descargar la plantilla');
    }
  };

  const handleProcessImport = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setImportResult(null);

    try {
      if (activeTab === 'CUSTOMERS') {
        if (!customerFile) {
          setErrorMessage('Seleccione un archivo Excel o CSV de clientes');
          setIsLoading(false);
          return;
        }
        const res = await importService.importCustomers(customerFile.base64, customerFile.name);
        setImportResult(res);
      } else {
        if (!productFile) {
          setErrorMessage('Seleccione un archivo Excel o CSV de productos');
          setIsLoading(false);
          return;
        }
        const res = await importService.importProducts(productFile.base64, productFile.name);
        setImportResult(res);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error durante el procesamiento del archivo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-3 lg:overflow-y-auto lg:h-full lg:pr-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Importación Masiva de Datos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Carga y migración histórica desde archivos Excel (.xlsx) o CSV hacia Vivelite
          </p>
        </div>

        <div className="flex bg-slate-200/80 p-1 rounded-2xl self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('CUSTOMERS');
              setImportResult(null);
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'CUSTOMERS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes y Envases</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('PRODUCTS');
              setImportResult(null);
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'PRODUCTS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Productos y Almacén</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-xs">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Descargar Plantilla Oficial
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeTab === 'CUSTOMERS'
                      ? 'Estructura con columnas de DNI/RUC, teléfonos, direcciones y saldo de bidones'
                      : 'Estructura con códigos de producto, categorías, precios y stock inicial'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleDownloadTemplate(activeTab === 'CUSTOMERS' ? 'customers' : 'products')
                }
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Excel</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-xs">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Subir Archivo Completado</h3>
                <p className="text-xs text-slate-500">
                  Arrastra o selecciona el archivo con los datos que deseas importar
                </p>
              </div>
            </div>

            {activeTab === 'CUSTOMERS' ? (
              <FileDropzone onFileSelect={(f) => setCustomerFile(f)} />
            ) : (
              <FileDropzone onFileSelect={(f) => setProductFile(f)} />
            )}

            {errorMessage && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleProcessImport}
                disabled={
                  isLoading ||
                  (activeTab === 'CUSTOMERS' ? !customerFile : !productFile)
                }
                className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-brand-500/25 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validando e importando datos...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Iniciar Importación a la Base de Datos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">
          {importResult ? (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Procesamiento Finalizado
                  </h3>
                  <p className="text-xs text-slate-500">{importResult.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                    Total
                  </span>
                  <span className="text-base font-black text-slate-800">
                    {importResult.totalRows}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-semibold block uppercase">
                    Exitosos
                  </span>
                  <span className="text-base font-black text-emerald-700">
                    {importResult.successCount}
                  </span>
                </div>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                  <span className="text-[10px] text-rose-700 font-semibold block uppercase">
                    Errores
                  </span>
                  <span className="text-base font-black text-rose-700">
                    {importResult.errorCount}
                  </span>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Filas con Errores ({importResult.errors.length}):</span>
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {importResult.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-[11px] space-y-0.5"
                      >
                        <div className="flex justify-between font-bold text-rose-800">
                          <span>Fila {err.row}</span>
                          <span>ID: {err.identifier}</span>
                        </div>
                        <p className="text-rose-600">{err.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Guía de Columnas Esperadas */
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Info className="w-4 h-4 text-brand-600" />
                <span>Columnas esperadas en el archivo</span>
              </div>

              {activeTab === 'CUSTOMERS' ? (
                <div className="space-y-2 text-[11px] text-slate-600">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800 block">Numero_Documento *</span>
                    <span>DNI de 8 dígitos o RUC de 11 dígitos. Obligatorio y único.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800 block">Nombre_RazonSocial *</span>
                    <span>Nombre completo de la persona o razón social de la empresa.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800 block">Bidones_En_Poder</span>
                    <span>
                      Cantidad de bidones retornables que el cliente ya tiene en su custodia.
                      Crea automáticamente el asiento inicial en el Kardex de envases.
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800 block">Deuda_Inicial</span>
                    <span>Monto en soles de crédito o deuda pendiente previa.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800 block">
                      Telefono, Direccion, Referencia
                    </span>
                    <span>Datos de contacto y logística de entrega a domicilio.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-[11px] text-slate-600">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800 block">Codigo *</span>
                    <span>Código único de producto (ej: AGUA-20L-RECARGA).</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800 block">Nombre *</span>
                    <span>Descripción comercial del producto.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800 block">Precio_Venta y Costo</span>
                    <span>Precio de venta al público y costo unitario de adquisición.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800 block">Stock_Inicial</span>
                    <span>
                      Unidades disponibles en almacén. Registra el asiento de inventario en el Kardex.
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800 block">Es_Retornable</span>
                    <span>Escribir "SI" si involucra envase retornable de 20L, "NO" si es descartable.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

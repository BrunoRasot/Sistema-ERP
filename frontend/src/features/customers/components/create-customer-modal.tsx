'use client';

import React, { useState } from 'react';
import { UserPlus, Check, Home, Building2, AlertCircle } from 'lucide-react';
import { CreateCustomerInput, CustomerType, DocumentType } from '../types/customer';
import { customerService } from '../services/customer-service';
import { Modal, Button, Input, Select } from '@/components/ui';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCustomerModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCustomerModalProps) {
  const [customerType, setCustomerType] = useState<CustomerType>('HOGAR');
  const [documentType, setDocumentType] = useState<DocumentType>('DNI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [reference, setReference] = useState('');
  const [zone, setZone] = useState('');
  const [district, setDistrict] = useState('');
  const [subchannel, setSubchannel] = useState('HOGAR');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleCustomerTypeChange = (type: CustomerType) => {
    setCustomerType(type);
    setFieldErrors({});
    if (type === 'EMPRESA') {
      setDocumentType('RUC');
      setSubchannel('EMPRESA');
    } else {
      setDocumentType('DNI');
      setSubchannel('HOGAR');
    }
  };

  const handleDocumentNumberChange = (val: string) => {
    let clean = val.replace(/\D/g, '');
    if (documentType === 'DNI') clean = clean.slice(0, 8);
    else if (documentType === 'RUC') clean = clean.slice(0, 11);
    else clean = clean.slice(0, 15);
    setDocumentNumber(clean);
    if (fieldErrors.documentNumber) {
      setFieldErrors((prev) => ({ ...prev, documentNumber: '' }));
    }
  };

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 9);
    setPhone(clean);
    if (!whatsapp) setWhatsapp(clean);
    if (fieldErrors.phone) {
      setFieldErrors((prev) => ({ ...prev, phone: '' }));
    }
  };

  const handleWhatsappChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 9);
    setWhatsapp(clean);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!documentNumber.trim()) {
      errs.documentNumber = 'El número de documento es obligatorio.';
    } else if (documentType === 'DNI' && documentNumber.trim().length !== 8) {
      errs.documentNumber = 'El DNI debe contener exactamente 8 dígitos.';
    } else if (documentType === 'RUC' && documentNumber.trim().length !== 11) {
      errs.documentNumber = 'El RUC debe contener exactamente 11 dígitos.';
    }

    if (!name.trim()) {
      errs.name = customerType === 'EMPRESA' ? 'La Razón Social es requerida.' : 'El Nombre Completo es requerido.';
    } else if (name.trim().length < 3) {
      errs.name = 'Debe tener al menos 3 caracteres.';
    }

    if (!phone.trim()) {
      errs.phone = 'El teléfono de contacto es obligatorio.';
    } else if (phone.trim().length !== 9) {
      errs.phone = 'El teléfono debe tener 9 dígitos.';
    }

    if (!address.trim()) {
      errs.address = 'La dirección de despacho es obligatoria.';
    }

    if (creditLimit < 0) {
      errs.creditLimit = 'El límite de crédito no puede ser negativo.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setGeneralError(null);

    const payload: CreateCustomerInput = {
      customerType,
      documentType,
      documentNumber: documentNumber.trim(),
      name: name.trim(),
      businessName: customerType === 'EMPRESA' ? (businessName.trim() || name.trim()) : undefined,
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      address: address.trim(),
      reference: reference.trim() || undefined,
      zone: zone.trim() || undefined,
      district: district.trim() || undefined,
      subchannel: subchannel.trim() || undefined,
      creditLimit: Number(creditLimit) || 0,
      notes: notes.trim() || undefined,
    };

    try {
      await customerService.createCustomer(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setGeneralError(err?.message || 'Error al registrar el cliente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Cliente"
      description="Registrar ficha de cliente para despacho y facturación"
      icon={<UserPlus className="w-5 h-5 text-slate-800" />}
      iconColor="bg-slate-100"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* 1. Selector de Tipo de Cliente */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleCustomerTypeChange('HOGAR')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
              customerType === 'HOGAR'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Hogar / Persona</span>
          </button>
          <button
            type="button"
            onClick={() => handleCustomerTypeChange('EMPRESA')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
              customerType === 'EMPRESA'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Empresa / RUC</span>
          </button>
        </div>

        {/* 2. Identificación */}
        <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            1. Identificación
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Tipo Documento"
              value={documentType}
              onChange={(e) => {
                const nextType = e.target.value as DocumentType;
                setDocumentType(nextType);
                setDocumentNumber('');
                setFieldErrors((prev) => ({ ...prev, documentNumber: '' }));
              }}
              options={[
                { value: 'DNI', label: 'DNI (8 dígitos)' },
                { value: 'RUC', label: 'RUC (11 dígitos)' },
                { value: 'CE', label: 'C.E. (Extranjería)' },
                { value: 'OTRO', label: 'Otro' },
              ]}
            />
            <div className="sm:col-span-2">
              <Input
                label={documentType === 'RUC' ? 'Número de RUC (11 dígitos)' : 'Número de Documento'}
                type="text"
                required
                value={documentNumber}
                onChange={(e) => handleDocumentNumberChange(e.target.value)}
                placeholder={documentType === 'RUC' ? '20601234567' : '45892134'}
                error={fieldErrors.documentNumber}
              />
            </div>
          </div>

          <Input
            label={customerType === 'EMPRESA' ? 'Razón Social' : 'Nombre Completo'}
            type="text"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
            }}
            placeholder={customerType === 'EMPRESA' ? 'Ej: Distribuidora Los Pinos S.A.C.' : 'Ej: Juan Carlos Pérez Gómez'}
            error={fieldErrors.name}
          />
        </div>

        {/* 3. Contacto */}
        <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            2. Contacto
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Teléfono Principal (Celular)"
              type="tel"
              required
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="987654321"
              error={fieldErrors.phone}
            />
            <Input
              label="WhatsApp (Comprobantes / Despacho)"
              type="tel"
              value={whatsapp}
              onChange={(e) => handleWhatsappChange(e.target.value)}
              placeholder="987654321"
            />
          </div>
        </div>

        {/* 4. Logística y Despacho */}
        <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            3. Ubicación y Entrega
          </h4>
          <Input
            label="Dirección de Despacho"
            type="text"
            required
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: '' }));
            }}
            placeholder="Av. Principal 123, Urb. Los Jardines"
            error={fieldErrors.address}
          />

          <Input
            label="Referencia para Repartidor"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Ej: Portón verde, frente a la farmacia"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Zona"
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Ej: Zona 1 - Centro"
            />
            <Input
              label="Distrito"
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Ej: Ica Cercado"
            />
            <Select
              label="Sub Canal"
              value={subchannel}
              onChange={(e) => setSubchannel(e.target.value)}
              options={[
                { value: 'HOGAR', label: 'Hogar' },
                { value: 'EMPRESA', label: 'Empresa' },
                { value: 'BODEGA', label: 'Bodega' },
                { value: 'DELIVERY', label: 'Delivery' },
                { value: 'WHATSAPP', label: 'WhatsApp' },
                { value: 'MOSTRADOR', label: 'Mostrador' },
              ]}
            />
          </div>
        </div>

        {/* 5. Condiciones Comerciales */}
        <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            4. Condiciones Comerciales
          </h4>
          <Input
            label="Límite de Crédito Autorizado (S/)"
            type="number"
            min="0"
            step="10"
            value={creditLimit}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setCreditLimit(val);
              if (fieldErrors.creditLimit) setFieldErrors((prev) => ({ ...prev, creditLimit: '' }));
            }}
            error={fieldErrors.creditLimit}
          />

          <Input
            label="Notas Adicionales"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Solicitar factura física al entregar"
          />
        </div>

        <div className="pt-2 flex items-center gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="w-1/2">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Check className="w-4 h-4" />}
            className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white"
          >
            {isLoading ? 'Guardando...' : 'Guardar Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

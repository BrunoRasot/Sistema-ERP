'use client';

import React, { useState } from 'react';
import { UserPlus, Check, Home, Building2 } from 'lucide-react';
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCustomerTypeChange = (type: CustomerType) => {
    setCustomerType(type);
    if (type === 'EMPRESA') {
      setDocumentType('RUC');
      setSubchannel('EMPRESA');
    } else {
      setDocumentType('DNI');
      setSubchannel('HOGAR');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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
      setError(err?.message || 'Error al registrar el cliente');
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
      icon={<UserPlus className="w-5 h-5" />}
      iconColor="bg-blue-50 text-blue-600"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={customerType === 'HOGAR' ? 'primary' : 'outline'}
            onClick={() => handleCustomerTypeChange('HOGAR')}
            leftIcon={<Home className="w-4 h-4" />}
            className="w-full"
          >
            Hogar / Persona
          </Button>
          <Button
            type="button"
            variant={customerType === 'EMPRESA' ? 'primary' : 'outline'}
            onClick={() => handleCustomerTypeChange('EMPRESA')}
            leftIcon={<Building2 className="w-4 h-4" />}
            className="w-full"
          >
            Empresa / RUC
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Tipo Doc."
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            options={[
              { value: 'DNI', label: 'DNI' },
              { value: 'RUC', label: 'RUC' },
              { value: 'CE', label: 'C.E.' },
              { value: 'OTRO', label: 'Otro' },
            ]}
          />
          <div className="sm:col-span-2">
            <Input
              label={documentType === 'RUC' ? 'Número de RUC (11 dígitos)' : 'Número de Documento'}
              type="text"
              required
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder={documentType === 'RUC' ? '20601234567' : '45892134'}
            />
          </div>
        </div>

        <Input
          label={customerType === 'EMPRESA' ? 'Razón Social' : 'Nombre Completo'}
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Distribuidora Los Pinos S.A.C."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Teléfono Principal"
            type="tel"
            required
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (!whatsapp) setWhatsapp(e.target.value);
            }}
            placeholder="987654321"
          />
          <Input
            label="WhatsApp (Facturas)"
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="987654321"
          />
        </div>

        <Input
          label="Dirección de Despacho"
          type="text"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Av. Principal 123, Urb. Los Jardines"
        />

        <Input
          label="Referencia para Repartidor"
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Ej: Portón verde, timbre blanco, 2do piso"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Zona"
            type="text"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="Ej: Zona 1"
          />
          <Input
            label="Distrito"
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Ej: Los Olivos"
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

        <Input
          label="Límite de Crédito Autorizado (S/)"
          type="number"
          min="0"
          step="10"
          value={creditLimit}
          onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
        />

        <Input
          label="Notas u Observaciones"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Llamar antes de llegar"
        />

        <div className="pt-3 flex items-center gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="w-1/2">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Check className="w-4 h-4" />}
            className="w-1/2"
          >
            Guardar Cliente
          </Button>
        </div>
      </form>
    </Modal>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, User, Mail, Lock, Phone, Check, AlertCircle } from 'lucide-react';
import { SystemUser, UserRole, UserStatus } from '../types/user';
import { userService } from '../services/user-service';
import { Modal, Button, Input, Select } from '@/components/ui';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: SystemUser | null;
}

export function UserModal({ isOpen, onClose, onSuccess, userToEdit }: UserModalProps) {
  const isEditing = !!userToEdit;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('VENDEDOR');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setFirstName(userToEdit.firstName || '');
      setLastName(userToEdit.lastName || '');
      setEmail(userToEdit.email || '');
      setPhone(userToEdit.phone || '');
      setRole(userToEdit.role || 'VENDEDOR');
      setStatus(userToEdit.status || 'ACTIVE');
      setPassword('');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setRole('VENDEDOR');
      setStatus('ACTIVE');
    }
    setFieldErrors({});
    setGeneralError(null);
  }, [userToEdit, isOpen]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!firstName.trim()) {
      errs.firstName = 'El nombre es obligatorio.';
    } else if (firstName.trim().length < 2) {
      errs.firstName = 'El nombre debe tener al menos 2 caracteres.';
    }

    if (!lastName.trim()) {
      errs.lastName = 'El apellido es obligatorio.';
    } else if (lastName.trim().length < 2) {
      errs.lastName = 'El apellido debe tener al menos 2 caracteres.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = 'El correo electrónico es obligatorio.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Ingrese un correo electrónico válido (ej: usuario@vivelite.pe).';
    }

    if (!isEditing) {
      if (!password.trim()) {
        errs.password = 'La contraseña es obligatoria para nuevos usuarios.';
      } else if (password.trim().length < 6) {
        errs.password = 'La contraseña debe tener al menos 6 caracteres.';
      }
    } else if (password.trim() && password.trim().length < 6) {
      errs.password = 'La nueva contraseña debe tener al menos 6 caracteres.';
    }

    if (phone.trim() && phone.trim().replace(/\D/g, '').length !== 9) {
      errs.phone = 'El teléfono debe contener 9 dígitos.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setGeneralError(null);
    setIsLoading(true);

    try {
      if (isEditing && userToEdit) {
        await userService.updateUser(userToEdit.id, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          role,
          status,
          ...(password.trim() ? { password: password.trim() } : {}),
        });
      } else {
        await userService.createUser({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          phone: phone.trim() || undefined,
          role,
          status,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Usuario y Rol' : 'Crear Nuevo Usuario'}
      description={
        isEditing
          ? 'Modifica los accesos y credenciales del usuario'
          : 'Registra un nuevo integrante para el sistema'
      }
      icon={isEditing ? <Shield className="w-5 h-5 text-slate-800" /> : <UserPlus className="w-5 h-5 text-slate-800" />}
      iconColor="bg-slate-100"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Nombre"
            type="text"
            required
            autoFocus
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (fieldErrors.firstName) setFieldErrors((prev) => ({ ...prev, firstName: '' }));
            }}
            placeholder="Ej: Juan Carlos"
            leftIcon={<User className="w-4 h-4" />}
            error={fieldErrors.firstName}
          />
          <Input
            label="Apellido"
            type="text"
            required
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (fieldErrors.lastName) setFieldErrors((prev) => ({ ...prev, lastName: '' }));
            }}
            placeholder="Ej: Pérez Gómez"
            error={fieldErrors.lastName}
          />
        </div>

        <Input
          label="Correo Electrónico (Login)"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
          }}
          placeholder="juan.perez@vivelite.pe"
          leftIcon={<Mail className="w-4 h-4" />}
          error={fieldErrors.email}
        />

        <Input
          label={isEditing ? 'Nueva Contraseña (Dejar en blanco para conservar actual)' : 'Contraseña de Acceso'}
          type="password"
          required={!isEditing}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
          }}
          placeholder={isEditing ? '••••••••••••' : 'Mínimo 6 caracteres'}
          leftIcon={<Lock className="w-4 h-4" />}
          error={fieldErrors.password}
        />

        <Input
          label="Teléfono Móvil (WhatsApp)"
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, '').slice(0, 9));
            if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
          }}
          placeholder="987654321"
          leftIcon={<Phone className="w-4 h-4" />}
          error={fieldErrors.phone}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Rol en el Sistema"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={[
              { value: 'SUPER_ADMIN', label: 'Super Administrador (Acceso total)' },
              { value: 'ADMIN', label: 'Administrador (Gestión y reportes)' },
              { value: 'VENDEDOR', label: 'Vendedor (Caja / Terminal POS)' },
              { value: 'REPARTIDOR', label: 'Repartidor (Rutas y entregas)' },
            ]}
          />
          <Select
            label="Estado de la Cuenta"
            value={status}
            onChange={(e) => setStatus(e.target.value as UserStatus)}
            options={[
              { value: 'ACTIVE', label: 'Activo (Acceso permitido)' },
              { value: 'INACTIVE', label: 'Inactivo (Bloqueado)' },
            ]}
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
            {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

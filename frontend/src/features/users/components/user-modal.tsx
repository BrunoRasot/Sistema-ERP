'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, User, Mail, Lock, Phone, Check } from 'lucide-react';
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
  }, [userToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isEditing && userToEdit) {
        await userService.updateUser(userToEdit.id, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
          status,
          ...(password.trim() ? { password: password.trim() } : {}),
        });
      } else {
        if (!password.trim()) {
          setError('La contraseña es obligatoria para nuevos usuarios');
          setIsLoading(false);
          return;
        }
        await userService.createUser({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim() || undefined,
          role,
          status,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
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
      icon={isEditing ? <Shield className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
      iconColor="bg-blue-50 text-blue-600"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Nombre"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ej: Juan"
            leftIcon={<User className="w-4 h-4" />}
          />
          <Input
            label="Apellido"
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Ej: Pérez"
          />
        </div>

        <Input
          label="Correo Electrónico (Login)"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="juan.perez@vivelite.pe"
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <Input
          label={isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
          type="password"
          required={!isEditing}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isEditing ? 'Dejar en blanco para no modificar' : '••••••••••••'}
          leftIcon={<Lock className="w-4 h-4" />}
        />

        <Input
          label="Teléfono Móvil (WhatsApp)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+51 956 000 000"
          leftIcon={<Phone className="w-4 h-4" />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Rol en el Sistema"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={[
              { value: 'SUPER_ADMIN', label: 'Super Administrador' },
              { value: 'ADMIN', label: 'Administrador' },
              { value: 'VENDEDOR', label: 'Vendedor (Caja / POS)' },
              { value: 'REPARTIDOR', label: 'Repartidor (Rutas)' },
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
            {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

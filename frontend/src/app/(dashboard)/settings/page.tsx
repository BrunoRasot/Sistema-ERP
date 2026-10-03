'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  MapPin,
  Building,
  Layers,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Sparkles,
  Save,
  CheckCircle2,
  Store,
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  Phone,
  Power,
} from 'lucide-react';
import { configService } from '@/features/config/services/config-service';
import { Zone, District, SubChannel, BottleCondition } from '@/features/config/types/config';
import { userService } from '@/features/users/services/user-service';
import { SystemUser } from '@/features/users/types/user';
import { UserModal } from '@/features/users/components/user-modal';
import { Button, SearchInput } from '@/components/ui';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'USERS' | 'ZONES' | 'DISTRICTS' | 'SUBCHANNELS' | 'CONDITIONS' | 'COMPANY'>('USERS');

  // User management states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<SystemUser | null>(null);
  const [userSearch, setUserSearch] = useState('');

  // Form states
  const [newZoneName, setNewZoneName] = useState('');
  const [newDistrictName, setNewDistrictName] = useState('');
  const [selectedZoneIdForDistrict, setSelectedZoneIdForDistrict] = useState<number | ''>('');

  const [newSubchannelName, setNewSubchannelName] = useState('');
  const [selectedDistrictIdForSubchannel, setSelectedDistrictIdForSubchannel] = useState<number | ''>('');

  const [newConditionCode, setNewConditionCode] = useState('');
  const [newConditionDesc, setNewConditionDesc] = useState('');

  // Editing state
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [editingZoneName, setEditingZoneName] = useState('');

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Queries
  const { data: usersData, isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['settings-users', { search: userSearch }],
    queryFn: () => userService.getUsers({ search: userSearch.trim() || undefined }),
  });

  const { data: zonesData, isLoading: isLoadingZones, refetch: refetchZones } = useQuery({
    queryKey: ['settings-zones'],
    queryFn: () => configService.getZones(),
  });

  const { data: districtsData, isLoading: isLoadingDistricts, refetch: refetchDistricts } = useQuery({
    queryKey: ['settings-districts'],
    queryFn: () => configService.getDistricts(),
  });

  const { data: subchannelsData, isLoading: isLoadingSubchannels, refetch: refetchSubchannels } = useQuery({
    queryKey: ['settings-subchannels'],
    queryFn: () => configService.getSubChannels(),
  });

  const { data: conditionsData, isLoading: isLoadingConditions, refetch: refetchConditions } = useQuery({
    queryKey: ['settings-conditions'],
    queryFn: () => configService.getBottleConditions(),
  });

  const users: SystemUser[] = Array.isArray(usersData)
    ? usersData
    : Array.isArray((usersData as any)?.data)
    ? (usersData as any).data
    : [];

  const zones: Zone[] = Array.isArray(zonesData)
    ? zonesData
    : Array.isArray((zonesData as any)?.data)
    ? (zonesData as any).data
    : [];

  const districts: District[] = Array.isArray(districtsData)
    ? districtsData
    : Array.isArray((districtsData as any)?.data)
    ? (districtsData as any).data
    : [];

  const subchannels: SubChannel[] = Array.isArray(subchannelsData)
    ? subchannelsData
    : Array.isArray((subchannelsData as any)?.data)
    ? (subchannelsData as any).data
    : [];

  const conditions: BottleCondition[] = Array.isArray(conditionsData)
    ? conditionsData
    : Array.isArray((conditionsData as any)?.data)
    ? (conditionsData as any).data
    : [];

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // User Actions
  const handleToggleUserStatus = async (user: SystemUser) => {
    try {
      await userService.toggleUserStatus(user.id);
      refetchUsers();
      showNotification(`Estado de ${user.firstName} actualizado`);
    } catch (err: any) {
      showNotification('Error al cambiar estado: ' + err.message, 'error');
    }
  };

  const handleDeleteUser = async (user: SystemUser) => {
    if (!confirm(`¿Estás seguro de dar de baja al usuario ${user.firstName} ${user.lastName}?`)) return;
    try {
      await userService.deleteUser(user.id);
      refetchUsers();
      showNotification('Usuario eliminado del sistema');
    } catch (err: any) {
      showNotification('Error al eliminar usuario: ' + err.message, 'error');
    }
  };

  // Actions
  const handleSeedDefaults = async () => {
    try {
      await configService.seedDefaults();
      refetchZones();
      refetchDistricts();
      refetchSubchannels();
      refetchConditions();
      showNotification('¡Datos de configuración sembrados correctamente!');
    } catch (err: any) {
      showNotification('Error al sembrar datos: ' + err.message, 'error');
    }
  };

  // Zones
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    try {
      await configService.createZone(newZoneName.trim());
      setNewZoneName('');
      refetchZones();
      showNotification('Zona creada exitosamente');
    } catch (err: any) {
      showNotification('Error al crear zona: ' + err.message, 'error');
    }
  };

  const handleUpdateZone = async (id: number) => {
    if (!editingZoneName.trim()) return;
    try {
      await configService.updateZone(id, editingZoneName.trim());
      setEditingZoneId(null);
      refetchZones();
      showNotification('Zona actualizada');
    } catch (err: any) {
      showNotification('Error al actualizar: ' + err.message, 'error');
    }
  };

  const handleDeleteZone = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar esta zona y sus dependencias?')) return;
    try {
      await configService.deleteZone(id);
      refetchZones();
      refetchDistricts();
      showNotification('Zona eliminada');
    } catch (err: any) {
      showNotification('No se pudo eliminar la zona: ' + err.message, 'error');
    }
  };

  // Districts
  const handleCreateDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistrictName.trim() || !selectedZoneIdForDistrict) return;
    try {
      await configService.createDistrict(newDistrictName.trim(), Number(selectedZoneIdForDistrict));
      setNewDistrictName('');
      refetchDistricts();
      refetchZones();
      showNotification('Distrito registrado exitosamente');
    } catch (err: any) {
      showNotification('Error al crear distrito: ' + err.message, 'error');
    }
  };

  const handleDeleteDistrict = async (id: number) => {
    if (!confirm('¿Deseas eliminar este distrito?')) return;
    try {
      await configService.deleteDistrict(id);
      refetchDistricts();
      refetchZones();
      showNotification('Distrito eliminado');
    } catch (err: any) {
      showNotification('Error: ' + err.message, 'error');
    }
  };

  // SubChannels
  const handleCreateSubchannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubchannelName.trim() || !selectedDistrictIdForSubchannel) return;
    try {
      await configService.createSubChannel(newSubchannelName.trim(), Number(selectedDistrictIdForSubchannel));
      setNewSubchannelName('');
      refetchSubchannels();
      showNotification('Subcanal agregado exitosamente');
    } catch (err: any) {
      showNotification('Error: ' + err.message, 'error');
    }
  };

  const handleDeleteSubchannel = async (id: number) => {
    if (!confirm('¿Deseas eliminar este subcanal?')) return;
    try {
      await configService.deleteSubChannel(id);
      refetchSubchannels();
      showNotification('Subcanal eliminado');
    } catch (err: any) {
      showNotification('Error: ' + err.message, 'error');
    }
  };

  // Bottle Conditions
  const handleCreateCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConditionCode.trim()) return;
    try {
      await configService.createBottleCondition(newConditionCode.trim(), newConditionDesc.trim() || undefined);
      setNewConditionCode('');
      setNewConditionDesc('');
      refetchConditions();
      showNotification('Condición de bidón 20L registrada');
    } catch (err: any) {
      showNotification('Error: ' + err.message, 'error');
    }
  };

  const handleDeleteCondition = async (id: number) => {
    if (!confirm('¿Eliminar esta condición de bidón?')) return;
    try {
      await configService.deleteBottleCondition(id);
      refetchConditions();
      showNotification('Condición eliminada');
    } catch (err: any) {
      showNotification('Error: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-4 lg:space-y-3 lg:overflow-y-auto lg:h-full lg:pr-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-brand-600" />
            Configuración del Sistema
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Administración de usuarios y roles, zonas de reparto, subcanales comerciales y parámetros
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'USERS' && (
            <Button
              variant="primary"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => {
                setSelectedUserForEdit(null);
                setIsUserModalOpen(true);
              }}
            >
              Nuevo Usuario
            </Button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition ${
            activeTab === 'USERS'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Usuarios y Roles ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ZONES')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition ${
            activeTab === 'ZONES'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Zonas de Reparto ({zones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DISTRICTS')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition ${
            activeTab === 'DISTRICTS'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Distritos ({districts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SUBCHANNELS')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition ${
            activeTab === 'SUBCHANNELS'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Subcanales ({subchannels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CONDITIONS')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition ${
            activeTab === 'CONDITIONS'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Condiciones 20L ({conditions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('COMPANY')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition ${
            activeTab === 'COMPANY'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Empresa y POS</span>
        </button>
      </div>

      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="max-w-md">
            <SearchInput
              value={userSearch}
              onChange={setUserSearch}
              placeholder="Buscar por nombre, correo o teléfono..."
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Usuario / Nombre</th>
                    <th className="px-4 py-3">Correo (Login)</th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3">Rol de Acceso</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Cargando usuarios del sistema...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No hay usuarios registrados. Agrega uno con el botón superior.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isAdmin = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
                      const isActive = u.status === 'ACTIVE';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isAdmin
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-brand-100 text-brand-700'
                                }`}
                              >
                                {u.firstName.charAt(0)}
                                {u.lastName.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {u.firstName} {u.lastName}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  Creado: {new Date(u.createdAt).toLocaleDateString('es-PE')}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{u.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {u.phone ? (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{u.phone}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isAdmin
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-brand-50 text-brand-700 border border-brand-200'
                              }`}
                            >
                              <Shield className="w-3 h-3" />
                              {u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'
                                ? 'ADMINISTRADOR'
                                : 'USUARIO (Vendedor)'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`p-1.5 rounded-lg transition ${
                                  isActive
                                    ? 'text-amber-600 hover:bg-amber-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={isActive ? 'Desactivar acceso' : 'Activar acceso'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUserForEdit(u);
                                  setIsUserModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                                title="Editar usuario"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ZONES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-600" />
              Nueva Zona de Reparto
            </h3>
            <form onSubmit={handleCreateZone} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de la Zona</label>
                <input
                  type="text"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="Ej: Zona 1 - Lima Norte"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/20 transition"
              >
                Agregar Zona
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs sm:text-sm">
              Zonas Registradas ({zones.length})
            </div>
            <div className="divide-y divide-slate-100">
              {isLoadingZones ? (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">Cargando zonas...</div>
              ) : zones.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">No hay zonas creadas aún.</div>
              ) : (
                zones.map((z) => (
                  <div key={z.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                    <div>
                      {editingZoneId === z.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingZoneName}
                            onChange={(e) => setEditingZoneName(e.target.value)}
                            className="px-2 py-1 bg-white border border-brand-500 rounded-lg text-xs sm:text-sm font-bold"
                          />
                          <button
                            onClick={() => handleUpdateZone(z.id)}
                            className="p-1 rounded bg-brand-600 text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900 block text-xs sm:text-sm">{z.name}</span>
                      )}
                      <span className="text-[11px] text-slate-500">
                        {z.districts?.length || 0} distritos asignados
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingZoneId(z.id);
                          setEditingZoneName(z.name);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteZone(z.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'DISTRICTS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-600" />
              Nuevo Distrito
            </h3>
            <form onSubmit={handleCreateDistrict} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Zona Asignada</label>
                <select
                  value={selectedZoneIdForDistrict}
                  onChange={(e) => setSelectedZoneIdForDistrict(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  required
                >
                  <option value="">-- Seleccionar Zona --</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Distrito</label>
                <input
                  type="text"
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  placeholder="Ej: Los Olivos"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/20 transition"
              >
                Registrar Distrito
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs sm:text-sm">
              Distritos Registrados ({districts.length})
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {isLoadingDistricts ? (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">Cargando distritos...</div>
              ) : districts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">No hay distritos registrados.</div>
              ) : (
                districts.map((d) => (
                  <div key={d.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                    <div>
                      <span className="font-bold text-slate-900 block text-xs sm:text-sm">{d.name}</span>
                      <span className="text-[11px] text-slate-500">
                        Zona: <strong className="text-brand-700">{d.zone?.name || 'Sin zona'}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteDistrict(d.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SUBCHANNELS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-600" />
              Nuevo Subcanal de Venta
            </h3>
            <form onSubmit={handleCreateSubchannel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Distrito Asociado</label>
                <select
                  value={selectedDistrictIdForSubchannel}
                  onChange={(e) => setSelectedDistrictIdForSubchannel(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  required
                >
                  <option value="">-- Seleccionar Distrito --</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.zone?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Subcanal</label>
                <input
                  type="text"
                  value={newSubchannelName}
                  onChange={(e) => setNewSubchannelName(e.target.value)}
                  placeholder="Ej: HOGAR, EMPRESA, MOSTRADOR, WHATSAPP"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 uppercase"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/20 transition"
              >
                Guardar Subcanal
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs sm:text-sm">
              Subcanales Activos ({subchannels.length})
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {isLoadingSubchannels ? (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">Cargando subcanales...</div>
              ) : subchannels.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">No hay subcanales registrados.</div>
              ) : (
                subchannels.map((s) => (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                    <div>
                      <span className="font-bold text-brand-700 block text-xs sm:text-sm">{s.name}</span>
                      <span className="text-[11px] text-slate-500">
                        Distrito: {s.district?.name} | Zona: {s.district?.zone?.name || '-'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteSubchannel(s.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'CONDITIONS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-600" />
              Nueva Condición Envase 20L
            </h3>
            <form onSubmit={handleCreateCondition} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Código Identificador</label>
                <input
                  type="text"
                  value={newConditionCode}
                  onChange={(e) => setNewConditionCode(e.target.value)}
                  placeholder="Ej: RECARGA, CON_ENVASE_NUEVO"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción / Regla</label>
                <input
                  type="text"
                  value={newConditionDesc}
                  onChange={(e) => setNewConditionDesc(e.target.value)}
                  placeholder="Ej: Cambio de vacío por lleno"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/20 transition"
              >
                Guardar Condición
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs sm:text-sm">
              Condiciones de Envase Habilitadas en POS ({conditions.length})
            </div>
            <div className="divide-y divide-slate-100">
              {isLoadingConditions ? (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">Cargando condiciones...</div>
              ) : conditions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">No hay condiciones registradas.</div>
              ) : (
                conditions.map((c) => (
                  <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                    <div>
                      <span className="font-bold text-slate-900 block text-xs sm:text-sm font-mono">{c.code}</span>
                      <span className="text-[11px] text-slate-500">{c.description || 'Sin descripción'}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteCondition(c.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'COMPANY' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Store className="w-5 h-5 text-brand-600" />
            Datos de la Distribuidora
          </h3>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Razón Social</label>
              <input
                type="text"
                defaultValue="VIVELITE S.A.C."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">RUC</label>
                <input
                  type="text"
                  defaultValue="20608945612"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  defaultValue="+51 987 654 321"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección de Planta / Matriz</label>
              <input
                type="text"
                defaultValue="Av. Principal s/n, Salas - Guadalupe, Ica, Perú"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => showNotification('Información de empresa guardada')}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/20 transition"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUserForEdit(null);
        }}
        onSuccess={() => {
          refetchUsers();
          showNotification(
            selectedUserForEdit ? 'Usuario actualizado con éxito' : 'Usuario creado exitosamente',
          );
        }}
        userToEdit={selectedUserForEdit}
      />
    </div>
  );
}

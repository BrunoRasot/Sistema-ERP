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
  Store,
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Mail,
  Phone,
  Power,
} from 'lucide-react';
import { configService } from '@/features/config/services/config-service';
import { Zone, District, SubChannel, BottleCondition, CompanyInfo } from '@/features/config/types/config';
import { userService } from '@/features/users/services/user-service';
import { SystemUser } from '@/features/users/types/user';
import { UserModal } from '@/features/users/components/user-modal';
import {
  Button,
  SearchInput,
  PageHeader,
  Badge,
  ConfirmDialog,
  useToast,
} from '@/components/ui';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'USERS' | 'ZONES' | 'DISTRICTS' | 'SUBCHANNELS' | 'CONDITIONS' | 'COMPANY'>('USERS');

  // User management states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<SystemUser | null>(null);
  const [userSearch, setUserSearch] = useState('');

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void> | void;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'primary';
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });
  const [isActionLoading, setIsActionLoading] = useState(false);

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

  const { data: companyData, refetch: refetchCompany } = useQuery({
    queryKey: ['settings-company'],
    queryFn: () => configService.getCompany(),
  });

  const [companyForm, setCompanyForm] = useState<Partial<CompanyInfo>>({});
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  React.useEffect(() => {
    if (companyData) {
      setCompanyForm(companyData);
    }
  }, [companyData]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCompany(true);
    try {
      await configService.updateCompany(companyForm);
      refetchCompany();
      toast.success('Empresa actualizada', 'La información de la empresa fue guardada exitosamente.');
    } catch (err: any) {
      toast.error('Error al guardar datos', err?.message || 'Error de conexión');
    } finally {
      setIsSavingCompany(false);
    }
  };

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

  // User Actions
  const handleToggleUserStatus = async (user: SystemUser) => {
    try {
      await userService.toggleUserStatus(user.id);
      refetchUsers();
      toast.success('Estado actualizado', `El estado de ${user.firstName} fue actualizado.`);
    } catch (err: any) {
      toast.error('Error al cambiar estado', err?.message || 'No se pudo modificar el estado');
    }
  };

  const handleDeleteUserClick = (user: SystemUser) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Dar de baja a este usuario?',
      description: `¿Estás seguro de que deseas desactivar la cuenta de ${user.firstName} ${user.lastName} (${user.email})? Ya no podrá iniciar sesión en el ERP.`,
      confirmText: 'Sí, dar de baja',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setIsActionLoading(true);
          await userService.deleteUser(user.id);
          refetchUsers();
          toast.success('Usuario eliminado', `La cuenta de ${user.firstName} fue dada de baja.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          toast.error('Error al eliminar usuario', err?.message || 'No se pudo eliminar');
        } finally {
          setIsActionLoading(false);
        }
      },
    });
  };

  // Zones
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    try {
      await configService.createZone(newZoneName.trim());
      setNewZoneName('');
      refetchZones();
      toast.success('Zona creada', 'La nueva zona fue registrada.');
    } catch (err: any) {
      toast.error('Error al crear zona', err?.message || 'No se pudo crear');
    }
  };

  const handleUpdateZone = async (id: number) => {
    if (!editingZoneName.trim()) return;
    try {
      await configService.updateZone(id, editingZoneName.trim());
      setEditingZoneId(null);
      refetchZones();
      toast.success('Zona actualizada', 'El nombre de la zona se guardó.');
    } catch (err: any) {
      toast.error('Error al actualizar zona', err?.message || 'No se pudo actualizar');
    }
  };

  const handleDeleteZoneClick = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar zona de reparto?',
      description: `¿Estás seguro de eliminar la zona "${name}"? Esta acción afectará los distritos y rutas asociados.`,
      confirmText: 'Sí, eliminar zona',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setIsActionLoading(true);
          await configService.deleteZone(id);
          refetchZones();
          refetchDistricts();
          toast.success('Zona eliminada', `La zona "${name}" fue eliminada.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          toast.error('No se pudo eliminar', err?.message || 'Error al eliminar');
        } finally {
          setIsActionLoading(false);
        }
      },
    });
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
      toast.success('Distrito registrado', 'El distrito fue asignado a la zona seleccionada.');
    } catch (err: any) {
      toast.error('Error al crear distrito', err?.message || 'No se pudo registrar');
    }
  };

  const handleDeleteDistrictClick = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar distrito?',
      description: `¿Estás seguro de eliminar el distrito "${name}"?`,
      confirmText: 'Sí, eliminar',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setIsActionLoading(true);
          await configService.deleteDistrict(id);
          refetchDistricts();
          refetchZones();
          toast.success('Distrito eliminado', `El distrito "${name}" fue eliminado.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          toast.error('Error al eliminar', err?.message || 'No se pudo eliminar');
        } finally {
          setIsActionLoading(false);
        }
      },
    });
  };

  // SubChannels
  const handleCreateSubchannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubchannelName.trim() || !selectedDistrictIdForSubchannel) return;
    try {
      await configService.createSubChannel(newSubchannelName.trim(), Number(selectedDistrictIdForSubchannel));
      setNewSubchannelName('');
      refetchSubchannels();
      toast.success('Subcanal agregado', 'El subcanal comercial fue creado.');
    } catch (err: any) {
      toast.error('Error al crear subcanal', err?.message || 'No se pudo crear');
    }
  };

  const handleDeleteSubchannelClick = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar subcanal comercial?',
      description: `¿Estás seguro de eliminar el subcanal "${name}"?`,
      confirmText: 'Sí, eliminar',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setIsActionLoading(true);
          await configService.deleteSubChannel(id);
          refetchSubchannels();
          toast.success('Subcanal eliminado', `El subcanal "${name}" fue eliminado.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          toast.error('Error al eliminar', err?.message || 'No se pudo eliminar');
        } finally {
          setIsActionLoading(false);
        }
      },
    });
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
      toast.success('Condición de envase registrada', 'El parámetro de envase 20L fue guardado.');
    } catch (err: any) {
      toast.error('Error al crear condición', err?.message || 'No se pudo registrar');
    }
  };

  const handleDeleteConditionClick = (id: number, code: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar condición de envase?',
      description: `¿Estás seguro de eliminar la condición "${code}" para envases 20L?`,
      confirmText: 'Sí, eliminar',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setIsActionLoading(true);
          await configService.deleteBottleCondition(id);
          refetchConditions();
          toast.success('Condición eliminada', `La regla "${code}" fue eliminada.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          toast.error('Error al eliminar', err?.message || 'No se pudo eliminar');
        } finally {
          setIsActionLoading(false);
        }
      },
    });
  };

  return (
    <div className="space-y-4 lg:space-y-3 lg:overflow-y-auto lg:h-full lg:pr-1">
      <PageHeader
        title="Configuración del Sistema"
        description="Administración de usuarios y roles, zonas de reparto, subcanales comerciales y parámetros"
        actions={
          activeTab === 'USERS' && (
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
          )
        }
      />

      {/* Tabs de Configuración */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition ${
            activeTab === 'USERS'
              ? 'border-slate-900 text-slate-900'
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
              ? 'border-slate-900 text-slate-900'
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
              ? 'border-slate-900 text-slate-900'
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
              ? 'border-slate-900 text-slate-900'
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
              ? 'border-slate-900 text-slate-900'
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
              ? 'border-slate-900 text-slate-900'
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

          <div className="card overflow-hidden">
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
                        No hay usuarios registrados.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isActive = u.status === 'ACTIVE';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-700"
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
                            <Badge variant={u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? 'primary' : 'default'}>
                              <Shield className="w-3 h-3 inline mr-1" />
                              {u.role === 'SUPER_ADMIN'
                                ? 'SUPER ADMIN'
                                : u.role === 'ADMIN'
                                ? 'ADMINISTRADOR'
                                : u.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={isActive ? 'success' : 'danger'}>
                              {isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
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
                                onClick={() => handleDeleteUserClick(u)}
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
          <div className="md:col-span-1 card p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-slate-700" />
              Nueva Zona de Reparto
            </h3>
            <form onSubmit={handleCreateZone} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de la Zona</label>
                <input
                  type="text"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="Ej: Zona 1 - Ica Centro"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  required
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
              >
                Agregar Zona
              </Button>
            </form>
          </div>

          <div className="md:col-span-2 card overflow-hidden">
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
                            className="px-2 py-1 bg-white border border-slate-400 rounded-lg text-xs sm:text-sm font-bold"
                          />
                          <button
                            onClick={() => handleUpdateZone(z.id)}
                            className="p-1 rounded bg-slate-900 text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900 block text-xs sm:text-sm">{z.name}</span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {z.districts ? `${z.districts.length} distrito(s) asociados` : 'Sin distritos'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingZoneId(z.id);
                          setEditingZoneName(z.name);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                        title="Editar nombre"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteZoneClick(z.id, z.name)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                        title="Eliminar zona"
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
          <div className="md:col-span-1 card p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-slate-700" />
              Nuevo Distrito
            </h3>
            <form onSubmit={handleCreateDistrict} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Zona Perteneciente</label>
                <select
                  value={selectedZoneIdForDistrict}
                  onChange={(e) => setSelectedZoneIdForDistrict(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  required
                >
                  <option value="">Selecciona una zona...</option>
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
                  placeholder="Ej: Ica Cercado, La Tinguiña"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
              >
                Agregar Distrito
              </Button>
            </form>
          </div>

          <div className="md:col-span-2 card overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs sm:text-sm">
              Distritos Registrados ({districts.length})
            </div>
            <div className="divide-y divide-slate-100">
              {isLoadingDistricts ? (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">Cargando distritos...</div>
              ) : districts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">No hay distritos creados aún.</div>
              ) : (
                districts.map((d) => (
                  <div key={d.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                    <div>
                      <span className="font-bold text-slate-900 block text-xs sm:text-sm">{d.name}</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Zona: {d.zone?.name || 'Sin zona asignada'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteDistrictClick(d.id, d.name)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                      title="Eliminar distrito"
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
          <div className="md:col-span-1 card p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-slate-700" />
              Nuevo Subcanal Comercial
            </h3>
            <form onSubmit={handleCreateSubchannel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Distrito Asociado</label>
                <select
                  value={selectedDistrictIdForSubchannel}
                  onChange={(e) => setSelectedDistrictIdForSubchannel(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  required
                >
                  <option value="">Selecciona un distrito...</option>
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
                  placeholder="Ej: Bodegas, Colegios, Clínicas"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
              >
                Agregar Subcanal
              </Button>
            </form>
          </div>

          <div className="md:col-span-2 card overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs sm:text-sm">
              Subcanales Comerciales ({subchannels.length})
            </div>
            <div className="divide-y divide-slate-100">
              {isLoadingSubchannels ? (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">Cargando subcanales...</div>
              ) : subchannels.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">No hay subcanales registrados.</div>
              ) : (
                subchannels.map((s) => (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                    <div>
                      <span className="font-bold text-slate-900 block text-xs sm:text-sm">{s.name}</span>
                      <span className="text-[11px] text-slate-500">
                        Distrito: {s.district?.name || 'General'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteSubchannelClick(s.id, s.name)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                      title="Eliminar subcanal"
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
          <div className="md:col-span-1 card p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-slate-700" />
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
              >
                Guardar Condición
              </Button>
            </form>
          </div>

          <div className="md:col-span-2 card overflow-hidden">
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
                      onClick={() => handleDeleteConditionClick(c.id, c.code)}
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
        <div className="card p-6 max-w-2xl space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Store className="w-5 h-5 text-slate-700" />
            Datos de la Distribuidora
          </h3>

          <form onSubmit={handleSaveCompany} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Razón Social</label>
              <input
                type="text"
                value={companyForm.razonSocial || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, razonSocial: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">RUC</label>
                <input
                  type="text"
                  value={companyForm.ruc || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, ruc: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={companyForm.phone || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección de Planta / Matriz</label>
              <input
                type="text"
                value={companyForm.address || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Distrito</label>
                <input
                  type="text"
                  value={companyForm.district || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, district: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Provincia</label>
                <input
                  type="text"
                  value={companyForm.province || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, province: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Departamento</label>
                <input
                  type="text"
                  value={companyForm.department || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSavingCompany}
                isLoading={isSavingCompany}
              >
                Guardar Configuración
              </Button>
            </div>
          </form>
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
          toast.success(
            selectedUserForEdit ? 'Usuario actualizado' : 'Usuario registrado',
            'La cuenta de usuario fue guardada.',
          );
        }}
        userToEdit={selectedUserForEdit}
      />

      {/* Modal Reutilizable de Confirmación */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        isLoading={isActionLoading}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
      />
    </div>
  );
}

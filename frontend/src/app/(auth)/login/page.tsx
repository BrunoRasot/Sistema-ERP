'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, ingresa tu correo electrónico y contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await apiClient<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; firstName: string; lastName: string; role: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      localStorage.setItem('vivelite_access_token', data.accessToken);
      localStorage.setItem('vivelite_refresh_token', data.refreshToken);
      localStorage.setItem('vivelite_user', JSON.stringify(data.user));

      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Credenciales incorrectas o problema de conexión con el servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#060D17] via-[#0B1528] to-[#040810] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
      {/* Luces y degradados ambientales de fondo con tonos corporativos navy y dorado sutil */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-25 pointer-events-none" />

      <div className="relative w-full max-w-[440px]">
        {/* Contenedor principal de la tarjeta de inicio de sesión */}
        <div className="bg-white/[0.98] backdrop-blur-2xl p-8 sm:p-10 rounded-[28px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] border border-slate-100">
          
          {/* Encabezado e identidad de marca ARCA */}
          <div className="text-center flex flex-col items-center mb-8">
            <div className="py-2 px-4 mb-3 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="ARCA Corporation"
                className="h-16 sm:h-20 w-auto object-contain max-w-[270px] drop-shadow-xs"
              />
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/80 text-[11px] font-semibold text-[#0A1A3B] tracking-wide">
              <span>SISTEMA INTEGRAL DE GESTIÓN ERP</span>
            </div>
          </div>

          {/* Alerta de Error */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="login-email" 
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0A1A3B] transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vivelite.pe"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-4 focus:ring-[#0A1A3B]/10 focus:border-[#0A1A3B] text-sm bg-slate-50/60 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all hover:border-slate-300"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="login-password" 
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0A1A3B] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-4 focus:ring-[#0A1A3B]/10 focus:border-[#0A1A3B] text-sm bg-slate-50/60 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all hover:border-slate-300"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-12 rounded-xl text-sm font-bold text-white bg-[#0A1A3B] hover:bg-[#122752] active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-[#0A1A3B]/20 shadow-lg shadow-[#0A1A3B]/20 transition-all duration-150 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Pie de página empresarial */}
        <p className="mt-6 text-center text-xs text-slate-400 font-medium tracking-wide">
          © {new Date().getFullYear()} ARCA Corporation. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

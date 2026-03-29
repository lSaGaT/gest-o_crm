/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Plus,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  MoreVertical,
  CreditCard,
  UserPlus,
  BarChart3,
  PieChart as PieChartIcon,
  Smartphone,
  Mail,
  MapPin,
  Briefcase,
  Eye,
  EyeOff,
  AlertCircle,
  Trash2,
  Check,
  Scissors,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addDays, 
  subDays, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  isWithinInterval 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { supabase } from './supabase';
import { cn } from './lib/utils';

// --- Types ---
interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'atendente' | 'admin';
  updated_at: string;
}

interface Cliente {
  Cliente_id: string;
  Nome: string;
  Telefone: string;
  Email: string;
  created_at: string;
}

interface Pedido {
  Pedido_id: string;
  client_id: string;
  Resumo: string;
  Valor_total: number;
  Status: 'pendente' | 'pago';
  created_at: string;
}

interface Agendamento {
  id: string;
  cliente_nome: string;
  data: string;
  horario: string;
  servico: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
  funcionario_id: string;
  created_at: string;
  pedido_status?: 'pendente' | 'pago';
}

interface Funcionario {
  id: string;
  nome: string;
  especialidade: string;
  ativo: boolean;
}

interface Lead {
  id: string;
  nome_completo: string;
  telefone: string;
  status: 'status_novo' | 'status_atendimento' | 'status_marcado' | 'status_duvida';
  created_at: string;
}

interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao_total_minutos: number;
  tempo_aplicacao_minutos: number | null;
  tempo_espera_minutos: number | null;
  tempo_finalizacao_minutos: number | null;
  created_at: string;
}

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all duration-200",
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string, value: string, icon: any, color: string, trend?: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-2xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded-full",
          trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-black text-slate-900">{value}</p>
  </div>
);

const KanbanCard: React.FC<{ lead: Lead }> = ({ lead }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <p className="font-bold text-slate-900 mb-1">{lead.nome_completo}</p>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Smartphone size={12} />
        {lead.telefone}
      </div>
    </div>
  );
};

const KanbanColumn: React.FC<{ id: string, label: string, color: string, text: string, leads: Lead[] }> = ({ id, label, color, text, leads }) => {
  const { setNodeRef } = useSortable({ id });

  return (
    <div className="flex flex-col min-w-[280px]">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className={cn("font-bold uppercase text-xs tracking-widest", text)}>
          {label}
        </h3>
        <span className="bg-white border text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>
      <div 
        ref={setNodeRef}
        className={cn("flex-1 rounded-3xl p-4 space-y-4 min-h-[500px]", color)}
      >
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <KanbanCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'marcacoes' | 'kanban' | 'admin' | 'financeiro'>('dashboard');
  
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Data States
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // UI States
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [staffFilter, setStaffFilter] = useState<string>('todos');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Admin New User States
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<'atendente' | 'admin'>('atendente');

  // Admin New Funcionario States
  const [newFuncName, setNewFuncName] = useState('');
  const [newFuncSpec, setNewFuncSpec] = useState('');

  // Admin New Servico States
  const [newServNome, setNewServNome] = useState('');
  const [newServPreco, setNewServPreco] = useState('');
  const [newServDuracao, setNewServDuracao] = useState('');
  const [newServAplicacao, setNewServAplicacao] = useState('');
  const [newServEspera, setNewServEspera] = useState('');
  const [newServFinalizacao, setNewServFinalizacao] = useState('');

  // Auth Effect
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        setSession(session);
        if (session) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) {
        console.error("Erro ao buscar perfil:", error);
        return;
      }
      if (data) {
        const p = data as Profile;
        setProfile(p);
        // Se for atendente, força a seção de marcações
        // Usamos toLowerCase() e trim() para evitar problemas de formatação no banco
        if (p.role?.toLowerCase().trim() === 'atendente') {
          setActiveSection('marcacoes');
        } else if (p.role?.toLowerCase().trim() === 'admin') {
          // Garante que admin comece no dashboard se não estiver em outra seção
          setActiveSection(prev => prev === 'marcacoes' ? 'dashboard' : prev);
        }
      }
    } catch (err) {
      console.error("Falha na requisição de perfil:", err);
    }
  };

  // Data Sync Effect
  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      const [
        { data: clientesData },
        { data: pedidosData },
        { data: agendamentosData },
        { data: funcionariosData },
        { data: leadsData },
        { data: profilesData },
        { data: servicosData }
      ] = await Promise.all([
        supabase.from('Clientes').select('*'),
        supabase.from('Pedidos').select('*'),
        supabase.from('agendamentos').select('*'),
        supabase.from('funcionarios').select('*'),
        supabase.from('leads').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('servicos').select('*')
      ]);

      if (clientesData) setClientes(clientesData);
      if (pedidosData) setPedidos(pedidosData);
      if (agendamentosData) setAgendamentos(agendamentosData);
      if (funcionariosData) setFuncionarios(funcionariosData);
      if (leadsData) setLeads(leadsData);
      if (profilesData) setProfiles(profilesData);
      if (servicosData) setServicos(servicosData);
    };

    fetchData();

    const channels = [
      supabase.channel('clientes').on('postgres_changes', { event: '*', schema: 'public', table: 'Clientes' }, fetchData).subscribe(),
      supabase.channel('pedidos').on('postgres_changes', { event: '*', schema: 'public', table: 'Pedidos' }, fetchData).subscribe(),
      supabase.channel('agendamentos').on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, fetchData).subscribe(),
      supabase.channel('leads').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchData).subscribe(),
      supabase.channel('profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData).subscribe(),
      supabase.channel('funcionarios').on('postgres_changes', { event: '*', schema: 'public', table: 'funcionarios' }, fetchData).subscribe(),
      supabase.channel('servicos').on('postgres_changes', { event: '*', schema: 'public', table: 'servicos' }, fetchData).subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [session]);

  // Função para recarregar dados manualmente
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const [
      { data: clientesData },
      { data: pedidosData },
      { data: agendamentosData },
      { data: funcionariosData },
      { data: leadsData },
      { data: profilesData },
      { data: servicosData }
    ] = await Promise.all([
      supabase.from('Clientes').select('*'),
      supabase.from('Pedidos').select('*'),
      supabase.from('agendamentos').select('*'),
      supabase.from('funcionarios').select('*'),
      supabase.from('leads').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('servicos').select('*')
    ]);

    if (clientesData) setClientes(clientesData);
    if (pedidosData) setPedidos(pedidosData);
    if (agendamentosData) setAgendamentos(agendamentosData);
    if (funcionariosData) setFuncionarios(funcionariosData);
    if (leadsData) setLeads(leadsData);
    if (profilesData) setProfiles(profilesData);
    if (servicosData) setServicos(servicosData);
    setIsRefreshing(false);
  };

  // Enriquece agendamentos com status de pagamento
  const agendamentosComPagamento = useMemo(() => {
    if (!agendamentos || agendamentos.length === 0) return [];
    return agendamentos.map(a => {
      // Busca cliente pelo nome
      const cliente = clientes?.find(c => c.Nome?.toLowerCase().trim() === a.cliente_nome?.toLowerCase().trim());
      if (cliente) {
        // Busca pedidos deste cliente
        const pedidosDoCliente = pedidos?.filter(p => p.client_id === cliente.Cliente_id) || [];
        // Se houver pedidos, pega o status do último pedido
        if (pedidosDoCliente.length > 0) {
          const ultimoPedido = pedidosDoCliente[pedidosDoCliente.length - 1];
          return { ...a, pedido_status: ultimoPedido.Status };
        }
      }
      return { ...a, pedido_status: undefined };
    });
  }, [agendamentos, clientes, pedidos]);

  // --- Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoginError(error.message);
      }
    } catch (err) {
      setLoginError('Erro ao fazer login');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
      setSession(null);
      setProfile(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({ 
      email: newUserEmail, 
      password: newUserPass, 
      options: { data: { full_name: newUserName } } 
    });
    
    if (error) {
      alert(error.message);
    } else {
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: newUserEmail,
          full_name: newUserName,
          role: newUserRole
        });
      }
      alert("Usuário criado com sucesso!");
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPass('');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este usuário?")) {
      await supabase.from('profiles').delete().eq('id', id);
    }
  };

  const handleCreateFuncionario = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('funcionarios').insert({
      nome: newFuncName,
      especialidade: newFuncSpec,
      ativo: true
    });
    if (error) alert(error.message);
    else {
      setNewFuncName('');
      setNewFuncSpec('');
    }
  };

  const handleDeleteFuncionario = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este funcionário?")) {
      await supabase.from('funcionarios').delete().eq('id', id);
    }
  };

  const handleCreateServico = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('servicos').insert({
      nome: newServNome,
      preco: parseFloat(newServPreco),
      duracao_total_minutos: parseInt(newServDuracao),
      tempo_aplicacao_minutos: newServAplicacao ? parseInt(newServAplicacao) : null,
      tempo_espera_minutos: newServEspera ? parseInt(newServEspera) : null,
      tempo_finalizacao_minutos: newServFinalizacao ? parseInt(newServFinalizacao) : null
    });
    if (error) alert(error.message);
    else {
      setNewServNome('');
      setNewServPreco('');
      setNewServDuracao('');
      setNewServAplicacao('');
      setNewServEspera('');
      setNewServFinalizacao('');
    }
  };

  const handleDeleteServico = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este serviço?")) {
      await supabase.from('servicos').delete().eq('id', id);
    }
  };

  // --- Kanban DnD Handlers ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeLead = leads.find(l => l.id === activeId);
    if (!activeLead) return;

    const isOverAColumn = ['status_novo', 'status_atendimento', 'status_marcado', 'status_duvida'].includes(overId);
    
    if (isOverAColumn && activeLead.status !== overId) {
      setLeads(prev => prev.map(l => l.id === activeId ? { ...l, status: overId as any } : l));
    } else {
      const overLead = leads.find(l => l.id === overId);
      if (overLead && activeLead.status !== overLead.status) {
        setLeads(prev => prev.map(l => l.id === activeId ? { ...l, status: overLead.status } : l));
      }
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const activeLead = leads.find(l => l.id === activeId);
    
    if (activeLead) {
      await supabase.from('leads').update({ status: activeLead.status }).eq('id', activeId);
    }
    
    setActiveId(null);
  };

  // --- Financial Calculations ---
  const financialData = useMemo(() => {
    const now = new Date();
    const getSum = (start: Date, end: Date) => {
      return pedidos
        .filter(p => {
          const date = new Date(p.created_at);
          return p.Status === 'pago' && isWithinInterval(date, { start, end });
        })
        .reduce((sum, p) => sum + Number(p.Valor_total), 0);
    };

    const daily = getSum(startOfDay(now), endOfDay(now));
    const weekly = getSum(startOfWeek(now), endOfWeek(now));
    const monthly = getSum(startOfMonth(now), endOfMonth(now));
    const yearly = getSum(startOfYear(now), endOfYear(now));

    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(now, 6 - i);
      const daySum = getSum(startOfDay(d), endOfDay(d));
      return { name: format(d, 'dd/MM'), value: daySum };
    });

    return { daily, weekly, monthly, yearly, chartData };
  }, [pedidos]);

  // --- Render Sections ---

  const renderDashboard = () => {
    // Verifica se os dados estão carregados
    if (!clientes || !pedidos || !agendamentos || !leads) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Carregando dados...</div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Dashboard</h2>
          <p className="text-slate-500">Visão geral do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Receita Hoje" value={`R$ ${financialData.daily.toFixed(2)}`} icon={DollarSign} color="bg-blue-600" trend="+12%" />
        <StatCard title="Agendamentos" value={agendamentos.filter(a => a.data === format(new Date(), 'yyyy-MM-dd')).length.toString()} icon={Calendar} color="bg-indigo-600" />
        <StatCard title="Novos Leads" value={leads.filter(l => l.status === 'status_novo').length.toString()} icon={Smartphone} color="bg-emerald-600" trend="+5" />
        <StatCard title="Pedidos Pagos" value={pedidos.filter(p => p.Status === 'pago').length.toString()} icon={CreditCard} color="bg-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Receita (Últimos 7 dias)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Clock size={20} className="text-indigo-600" />
            Próximos Agendamentos
          </h3>
          <div className="space-y-4">
            {agendamentos
              .filter(a => a.data >= format(new Date(), 'yyyy-MM-dd'))
              .sort((a, b) => a.horario.localeCompare(b.horario))
              .slice(0, 5)
              .map(a => (
                <div key={a.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="bg-white p-2 rounded-xl shadow-sm text-center min-w-[60px]">
                    <p className="text-xs font-bold text-blue-600 uppercase">{a.horario.substring(0, 5)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{a.cliente_nome}</p>
                    <p className="text-xs text-slate-500">{a.servico}</p>
                  </div>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    a.status === 'confirmado' ? "bg-emerald-500" : "bg-amber-500"
                  )} />
                </div>
              ))}
            {agendamentos.length === 0 && (
              <p className="text-center text-slate-400 py-8">Nenhum agendamento próximo</p>
            )}
          </div>
        </div>
      </div>
      </div>
    );
  };

  const renderMarcacoes = () => {
    const filteredAgendamentos = agendamentosComPagamento.filter(a => {
      const dateMatch = a.data === format(selectedDate, 'yyyy-MM-dd');
      const staffMatch = staffFilter === 'todos' || a.funcionario_id === staffFilter;
      return dateMatch && staffMatch;
    });

    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Agenda</h2>
            <p className="text-slate-500">Gerencie seus horários</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-2 hover:bg-slate-50 rounded-lg transition"><ChevronLeft size={20} /></button>
            <span className="font-bold text-blue-600 px-4">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 hover:bg-slate-50 rounded-lg transition"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setStaffFilter('todos')}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-bold transition-all",
              staffFilter === 'todos' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            Todos
          </button>
          {funcionarios.map(f => (
            <button 
              key={f.id}
              onClick={() => setStaffFilter(f.id)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                staffFilter === f.id ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              {f.nome}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Horário</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Serviço</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Profissional</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAgendamentos.sort((a, b) => a.horario.localeCompare(b.horario)).map(a => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 font-black text-blue-600">{a.horario.substring(0, 5)}</td>
                  <td className="p-6">
                    <p className="font-bold text-slate-900">{a.cliente_nome}</p>
                  </td>
                  <td className="p-6 text-slate-600">{a.servico}</td>
                  <td className="p-6">
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                      {funcionarios.find(f => f.id === a.funcionario_id)?.nome || 'Geral'}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className={cn(
                      "text-[10px] font-black uppercase px-3 py-1 rounded-full",
                      a.status === 'confirmado' ? "bg-emerald-100 text-emerald-700" :
                      a.status === 'cancelado' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-6">
                    {a.pedido_status ? (
                      <span className={cn(
                        "text-[10px] font-black uppercase px-3 py-1 rounded-full",
                        a.pedido_status === 'pago' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {a.pedido_status === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-500">
                        Sem pedido
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAgendamentos.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-400">Nenhum agendamento para este dia</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderKanban = () => {
    const columns = [
      { id: 'status_novo', label: 'Novos Leads', color: 'bg-slate-100', text: 'text-slate-600' },
      { id: 'status_atendimento', label: 'Em Atendimento', color: 'bg-blue-50', text: 'text-blue-600' },
      { id: 'status_marcado', label: 'Agendado', color: 'bg-emerald-50', text: 'text-emerald-600' },
      { id: 'status_duvida', label: 'Dúvidas', color: 'bg-amber-50', text: 'text-amber-600' },
    ];

    return (
      <div className="h-full flex flex-col space-y-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Fluxo WhatsApp</h2>
          <p className="text-slate-500">Gerencie seus leads arrastando os cards</p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4">
            {columns.map(col => (
              <KanbanColumn 
                key={col.id} 
                id={col.id} 
                label={col.label} 
                color={col.color} 
                text={col.text} 
                leads={leads.filter(l => l.status === col.id)} 
              />
            ))}
          </div>
          <DragOverlay>
            {activeId ? (
              <div className="bg-white p-5 rounded-2xl shadow-xl border border-blue-200 cursor-grabbing w-[280px]">
                <p className="font-bold text-slate-900 mb-1">
                  {leads.find(l => l.id === activeId)?.nome_completo}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Smartphone size={12} />
                  {leads.find(l => l.id === activeId)?.telefone}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    );
  };

  const renderFinanceiro = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Financeiro</h2>
        <p className="text-slate-500">Relatórios de entrada e faturamento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Hoje" value={`R$ ${financialData.daily.toFixed(2)}`} icon={DollarSign} color="bg-blue-600" />
        <StatCard title="Esta Semana" value={`R$ ${financialData.weekly.toFixed(2)}`} icon={TrendingUp} color="bg-indigo-600" />
        <StatCard title="Este Mês" value={`R$ ${financialData.monthly.toFixed(2)}`} icon={BarChart3} color="bg-emerald-600" />
        <StatCard title="Este Ano" value={`R$ ${financialData.yearly.toFixed(2)}`} icon={PieChartIcon} color="bg-amber-600" />
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold mb-8">Últimos Pedidos e Status de Pagamento</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Data</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Cliente</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Resumo</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Valor</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pedidos.sort((a, b) => b.created_at.localeCompare(a.created_at)).map(p => (
                <tr key={p.Pedido_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-sm text-slate-500">{format(new Date(p.created_at), 'dd/MM/yyyy')}</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900">
                      {clientes.find(c => c.Cliente_id === p.client_id)?.Nome || 'Cliente não encontrado'}
                    </p>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{p.Resumo}</td>
                  <td className="p-4 font-bold text-slate-900">R$ {Number(p.Valor_total).toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <span className={cn(
                      "text-[10px] font-black uppercase px-3 py-1 rounded-full",
                      p.Status === 'pago' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {p.Status}
                    </span>
                  </td>
                </tr>
              ))}
              {pedidos.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-400">Nenhum pedido registrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Administração</h2>
        <p className="text-slate-500">Gestão de usuários e equipe</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-fit">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" />
            Novo Acesso
          </h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome Completo</label>
              <input 
                type="text" 
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">E-mail</label>
              <input 
                type="email" 
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Senha</label>
              <input 
                type="password" 
                value={newUserPass}
                onChange={(e) => setNewUserPass(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cargo</label>
              <select 
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="atendente">Atendente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 mt-2"
            >
              Criar Login
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            Usuários do Sistema
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase">Nome</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase">E-mail</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase">Cargo</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {profiles.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{p.full_name}</td>
                    <td className="p-4 text-sm text-slate-500">{p.email}</td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-3 py-1 rounded-full",
                        p.role?.toLowerCase().trim() === 'admin' ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"
                      )}>
                        {p.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDeleteUser(p.id)}
                        className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-fit">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Briefcase size={20} className="text-indigo-600" />
            Novo Funcionário
          </h3>
          <form onSubmit={handleCreateFuncionario} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome</label>
              <input 
                type="text" 
                value={newFuncName}
                onChange={(e) => setNewFuncName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Especialidade</label>
              <input 
                type="text" 
                value={newFuncSpec}
                onChange={(e) => setNewFuncSpec(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 mt-2"
            >
              Adicionar Funcionário
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Users size={20} className="text-indigo-600" />
            Equipe / Funcionários
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase">Nome</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase">Especialidade</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {funcionarios.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{f.nome}</td>
                    <td className="p-4 text-sm text-slate-500">{f.especialidade}</td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-3 py-1 rounded-full",
                        f.ativo ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {f.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDeleteFuncionario(f.id)}
                        className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {funcionarios.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-400">Nenhum funcionário cadastrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-fit">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Scissors size={20} className="text-emerald-600" />
            Novo Serviço
          </h3>
          <form onSubmit={handleCreateServico} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Serviço</label>
              <input
                type="text"
                value={newServNome}
                onChange={(e) => setNewServNome(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={newServPreco}
                onChange={(e) => setNewServPreco(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Duração Total (min)</label>
              <input
                type="number"
                value={newServDuracao}
                onChange={(e) => setNewServDuracao(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Aplicação</label>
                <input
                  type="number"
                  value={newServAplicacao}
                  onChange={(e) => setNewServAplicacao(e.target.value)}
                  placeholder="min"
                  className="w-full bg-slate-50 border border-slate-100 p-2 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Espera</label>
                <input
                  type="number"
                  value={newServEspera}
                  onChange={(e) => setNewServEspera(e.target.value)}
                  placeholder="min"
                  className="w-full bg-slate-50 border border-slate-100 p-2 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Finalização</label>
                <input
                  type="number"
                  value={newServFinalizacao}
                  onChange={(e) => setNewServFinalizacao(e.target.value)}
                  placeholder="min"
                  className="w-full bg-slate-50 border border-slate-100 p-2 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20 mt-2"
            >
              Adicionar Serviço
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Sparkles size={20} className="text-emerald-600" />
            Serviços Cadastrados
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase">Serviço</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase">Preço</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase">Duração</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase">Tempos (A/E/F)</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {servicos.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{s.nome}</td>
                    <td className="p-4 text-sm text-slate-600">R$ {s.preco.toFixed(2)}</td>
                    <td className="p-4 text-sm text-slate-600">{s.duracao_total_minutos} min</td>
                    <td className="p-4 text-xs text-slate-500">
                      {s.tempo_aplicacao_minutos || '-'}/{s.tempo_espera_minutos || '-'}/{s.tempo_finalizacao_minutos || '-'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteServico(s.id)}
                        className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {servicos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-400">Nenhum serviço cadastrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Render ---

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
              <LayoutDashboard size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900">Gestão<span className="text-blue-600">AI</span></h1>
            <p className="text-slate-500 mt-2">Acesse sua conta para continuar</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com" 
                  className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Senha</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 pr-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-rose-500 text-sm bg-rose-50 p-3 rounded-xl border border-rose-100">
                <AlertCircle size={16} />
                {loginError}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-slate-900 text-white p-5 rounded-2xl font-bold hover:bg-slate-800 transition-all duration-300 shadow-xl shadow-slate-900/10 mt-4"
            >
              Entrar no Sistema
            </button>
          </form>
          
          <p className="text-xs text-center text-slate-400 mt-8">
            Sistema interno de gestão integrada.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight">Gestão<span className="text-blue-500">AI</span></span>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 mt-4">
          {!profile ? (
            <div className="space-y-3 px-2">
              <div className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
            </div>
          ) : profile.role?.toLowerCase().trim() === 'admin' ? (
            <>
              <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeSection === 'dashboard'} onClick={() => setActiveSection('dashboard')} />
              <SidebarItem icon={Calendar} label="Agenda" active={activeSection === 'marcacoes'} onClick={() => setActiveSection('marcacoes')} />
              <SidebarItem icon={Smartphone} label="Leads CRM" active={activeSection === 'kanban'} onClick={() => setActiveSection('kanban')} />
              <SidebarItem icon={DollarSign} label="Financeiro" active={activeSection === 'financeiro'} onClick={() => setActiveSection('financeiro')} />
              <SidebarItem icon={Settings} label="Administração" active={activeSection === 'admin'} onClick={() => setActiveSection('admin')} />
            </>
          ) : (
            <SidebarItem icon={Calendar} label="Agenda" active={activeSection === 'marcacoes'} onClick={() => setActiveSection('marcacoes')} />
          )}
        </nav>
        
        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{profile?.full_name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{profile?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-rose-500/10 text-rose-500 py-3 rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-300 text-sm font-bold"
          >
            <LogOut size={16} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 z-10">
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 w-full max-w-md">
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder="Pesquisar..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                "p-2 rounded-xl transition flex items-center gap-2",
                isRefreshing
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              )}
              title="Atualizar dados"
            >
              <RefreshCw size={18} className={cn(isRefreshing && "animate-spin")} />
            </button>
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition">
              <Clock size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeSection === 'dashboard' && renderDashboard()}
              {activeSection === 'marcacoes' && renderMarcacoes()}
              {activeSection === 'kanban' && renderKanban()}
              {activeSection === 'financeiro' && renderFinanceiro()}
              {activeSection === 'admin' && profile?.role?.toLowerCase().trim() === 'admin' && renderAdmin()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

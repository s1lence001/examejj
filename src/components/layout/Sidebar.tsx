'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    ChevronRight,
    LogOut,
    User as UserIcon,
    Search,
} from 'lucide-react';
import { RequirementsList } from '@/components/exam/RequirementsList';
import { FloatingActionBar } from '@/components/exam/FloatingActionBar';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2, Key, Mail, User as UserSettings } from 'lucide-react';

export function Sidebar() {
    const { user, signOut } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { toast } = useToast();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Form states
    const [name, setName] = useState(user?.user_metadata?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: name }
            });
            if (error) throw error;
            toast({ title: "Perfil atualizado!", description: "Seu nome foi alterado." });
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const { error } = await supabase.auth.updateUser({ email });
            if (error) throw error;
            toast({ title: "Email atualizado!", description: "Verifique seu novo email para confirmar." });
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword) return;
        setIsUpdating(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast({ title: "Senha atualizada!", description: "Sua senha foi alterada com sucesso." });
            setNewPassword('');
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <aside
            className={cn(
                "relative h-full bg-white border-r border-slate-200 shadow-sm z-20 flex flex-col transition-all duration-300 ease-in-out",
                isCollapsed ? 'w-20' : 'w-[35%] min-w-[320px] max-w-[500px]'
            )}
        >
            {/* Collapse Toggle Button */}
            <div className={cn(
                "absolute z-50 transition-all duration-300",
                isCollapsed ? 'left-1/2 -translate-x-1/2 top-4' : 'right-4 top-6'
            )}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? "Expandir" : "Recolher"}
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </Button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
                <div className={cn(
                    "flex-1 overflow-hidden flex flex-col relative transition-opacity duration-200",
                    isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                )}>
                    <RequirementsList />
                    <FloatingActionBar />
                </div>

                {/* Collapsed View Indicators */}
                {isCollapsed && (
                    <div className="absolute inset-0 flex flex-col items-center pt-16 gap-4 text-slate-400">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg mb-4">
                            <span className="font-bold text-lg">JJ</span>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Search size={20} />
                        </div>
                        <div className="w-8 h-[1px] bg-slate-100 my-2"></div>
                        <div className="flex flex-col gap-3 opacity-50">
                            <div className="w-10 h-2 bg-slate-100 rounded-full"></div>
                            <div className="w-8 h-2 bg-slate-100 rounded-full"></div>
                            <div className="w-10 h-2 bg-slate-100 rounded-full"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer: User Profile */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                    {isCollapsed ? (
                        <div className="flex flex-col gap-4 items-center">
                            <DialogTrigger asChild>
                                <button className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors" title={user?.email || 'Usuário'}>
                                    <UserIcon size={20} />
                                </button>
                            </DialogTrigger>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-red-500"
                                onClick={() => signOut()}
                                title="Sair"
                            >
                                <LogOut size={20} />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <DialogTrigger asChild>
                                <button className="flex items-center gap-3 flex-1 min-w-0 group">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 shadow-inner shrink-0 group-hover:from-blue-100 group-hover:to-blue-200 transition-all">
                                        <span className="font-bold text-sm">
                                            {user?.email?.substring(0, 2).toUpperCase() || <UserIcon size={20} />}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600">
                                            {user?.user_metadata?.full_name || 'Usuário'}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate" title={user?.email || ''}>
                                            {user?.email}
                                        </p>
                                    </div>
                                </button>
                            </DialogTrigger>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                                onClick={() => signOut()}
                                title="Sair"
                            >
                                <LogOut size={18} />
                            </Button>
                        </div>
                    )}

                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <UserSettings size={20} className="text-blue-600" />
                                Meu Perfil
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Update Name */}
                            <form onSubmit={handleUpdateProfile} className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase">Nome de Exibição</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Seu nome completo"
                                            className="h-9"
                                        />
                                        <Button type="submit" size="sm" disabled={isUpdating || name === user?.user_metadata?.full_name}>
                                            Salvar
                                        </Button>
                                    </div>
                                </div>
                            </form>

                            <div className="h-px bg-slate-100" />

                            {/* Update Email */}
                            <form onSubmit={handleUpdateEmail} className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <Mail size={12} /> Email
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="novo@email.com"
                                            className="h-9"
                                        />
                                        <Button type="submit" size="sm" variant="outline" disabled={isUpdating || email === user?.email}>
                                            Alterar
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 italic">Requer confirmação via email.</p>
                                </div>
                            </form>

                            <div className="h-px bg-slate-100" />

                            {/* Update Password */}
                            <form onSubmit={handleUpdatePassword} className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="pass" className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <Key size={12} /> Nova Senha
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="pass"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            className="h-9"
                                        />
                                        <Button type="submit" size="sm" variant="outline" disabled={isUpdating || !newPassword}>
                                            Redefinir
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsProfileOpen(false)}>Fechar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </aside>
    );
}

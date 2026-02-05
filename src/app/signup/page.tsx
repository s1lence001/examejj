'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signUp } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setIsLoading(true);

        const { error } = await signUp(email, password);

        if (error) {
            setError(error.message || 'Erro ao criar conta');
            setIsLoading(false);
        } else {
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h1>✅ Conta criada!</h1>
                    <p className="auth-subtitle">
                        Verifique seu email para confirmar a conta, depois faça login.
                    </p>
                    <Link href="/login" className="btn-primary btn-full" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1rem' }}>
                        Ir para Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>🥋 Criar Conta</h1>
                <p className="auth-subtitle">Acompanhe seu progresso para a faixa azul</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirmar Senha</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary btn-full" disabled={isLoading}>
                        {isLoading ? 'Criando...' : 'Criar Conta'}
                    </button>
                </form>

                <p className="auth-footer">
                    Já tem conta? <Link href="/login">Fazer login</Link>
                </p>
            </div>
        </div>
    );
}

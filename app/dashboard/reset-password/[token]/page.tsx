'use client';

import { useState } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (password.length < 6) return setErr('Le mot de passe doit contenir au moins 6 caractères');
    if (password !== confirm) return setErr('Les mots de passe ne correspondent pas');

    try {
      setLoading(true);
      const res = await axios.post('/auth/reset-password', { token, newPassword: password });
      setMsg(res.data?.message || 'Mot de passe mis à jour');
    } catch (error: any) {
      setErr(error.response?.data?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-8 w-full max-w-md">
        <h1 className="text-xl font-semibold mb-4 text-center">Réinitialiser le mot de passe</h1>

        {msg && <p className="text-green-600 text-sm mb-3">{msg}</p>}
        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

        <label className="block text-sm mb-1">Nouveau mot de passe</label>
        <input
          type="password"
          className="border p-2 w-full rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          disabled={loading}
        />

        <label className="block text-sm mb-1">Confirmer le mot de passe</label>
        <input
          type="password"
          className="border p-2 w-full rounded mb-6"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? 'Mise à jour...' : 'Mettre à jour'}
        </button>

        <div className="text-center mt-4">
          <Link href="/login" className="text-sm text-emerald-700 underline">Retour à la connexion</Link>
        </div>
      </form>
    </main>
  );
}

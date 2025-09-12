'use client';

import { useState } from 'react';
import axios from '@/lib/axios';
import { useParams, useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');

    if (password.length < 6) {
      setErr('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirm) {
      setErr('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/auth/reset-password', {
        token: params.token,
        newPassword: password,
      });
      setMsg('Mot de passe mis à jour avec succès. Vous pouvez vous connecter.');
      setTimeout(() => router.push('/login'), 1200);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted-bg p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-background border p-8 shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Nouveau mot de passe</h1>

        {msg && <p className="text-emerald-600 text-sm mb-3">{msg}</p>}
        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

        <label className="block text-sm font-medium mb-1">Mot de passe</label>
        <input
          type="password"
          className="w-full rounded-lg border px-3 py-2 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          placeholder="••••••••"
        />

        <label className="block text-sm font-medium mb-1">Confirmer le mot de passe</label>
        <input
          type="password"
          className="w-full rounded-lg border px-3 py-2 mb-6"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          placeholder="••••••••"
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-white ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'En cours...' : 'Mettre à jour'}
        </button>
      </form>
    </main>
  );
}

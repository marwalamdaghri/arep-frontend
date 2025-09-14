'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { useParams, useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await axios.get(`/auth/verify-email/${params.token}`);
        setStatus('success');
        setMessage(data?.message || 'Email vérifié avec succès.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Lien invalide ou expiré.');
      }
    };
    run();
  }, [params.token]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted-bg p-4">
      <div className="w-full max-w-md rounded-2xl bg-background border p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Vérification de l’email</h1>
        <p className={status === 'success' ? 'text-emerald-600' : 'text-red-600'}>
          {message || 'Traitement...'}
        </p>
        {status === 'success' && (
          <button
            className="mt-6 w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-white"
            onClick={() => router.push('/login')}
          >
            Se connecter
          </button>
        )}
      </div>
    </main>
  );
}

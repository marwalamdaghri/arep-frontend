'use client';

import { useState } from 'react';
import axios from '@/lib/axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setLoading(true);
      await axios.post('/auth/forgot-password', { email });
      setMessage("Un email de réinitialisation a été envoyé.");
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-96">
        <h1 className="text-xl font-bold mb-4 text-center">Mot de passe oublié</h1>

        {message && <p className="text-green-600 text-sm mb-2">{message}</p>}
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <input
          type="email"
          placeholder="Votre email"
          className="border p-2 w-full mb-4 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
        </button>
      </form>
    </div>
  );
}

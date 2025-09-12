'use client';

import { useState } from 'react';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',       // prénom
    last_name: '',  // nom
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!form.last_name.trim()) {
      setError('Le nom est requis');
      return false;
    }

    if (!form.name.trim()) {
      setError('Le prénom est requis');
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Adresse email invalide');
      return false;
    }

    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      await axios.post('/auth/register', {
        name: form.name,           // prénom
        last_name: form.last_name, // nom
        email: form.email,
        password: form.password
      });
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted-bg p-4">
      <div className="w-full max-w-md rounded-2xl bg-background border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Créer un compte</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Rejoignez notre communauté dès maintenant
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded-md mb-6 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-foreground mb-1">
              Nom
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              placeholder="Votre nom"
              value={form.last_name}
              onChange={handleChange}
              disabled={loading}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
              Prénom
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Votre prénom"
              value={form.name}
              onChange={handleChange}
              disabled={loading}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="email@exemple.com"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-white transition-all mt-6 ${
              loading ? "cursor-not-allowed opacity-70" : ""
            }`}
          >
            {loading ? 'Inscription en cours...' : 'S\'inscrire'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Vous avez déjà un compte ?{' '}
            <a
              href="/login"
              className="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline"
            >
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

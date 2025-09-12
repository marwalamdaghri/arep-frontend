"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post("/auth/login", { email, password });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted-bg p-4">
      <div className="w-full max-w-md rounded-2xl bg-background border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Connexion</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Accédez à votre espace personnel</p>
        </div>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-red-800 dark:text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
              placeholder="exemple@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
              placeholder="********"
            />
            <div className="mt-2 text-right">
              <a
                href="/forgot-password"
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline"
              >
                Mot de passe oublié ?
              </a>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-white transition-all ${
              loading ? "cursor-not-allowed opacity-70" : ""
            }`}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Vous n'avez pas de compte ?{" "}
          <a
            href="/register"
            className="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline"
          >
            Créer un compte
          </a>
        </p>
      </div>
    </main>
  );
}
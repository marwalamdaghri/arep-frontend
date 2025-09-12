'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { MapPin, BarChart2, Building2, FileText } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // états
  const [loading, setLoading] = useState(true);
  const [marches, setMarches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const marchesRes = await axios.get('/marches', { params: { limit: 1000 } });
        const marchesData = marchesRes?.data?.data ?? marchesRes?.data ?? [];

        if (mounted) {
          setMarches(Array.isArray(marchesData) ? marchesData : []);
        }
      } catch (err: any) {
        console.error('Erreur fetch HomePage:', err);
        if (err?.response?.status === 401) {
          router.push('/login');
          return;
        }
        setError('Impossible de charger les données marchés.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [router]);

  if (loading) return <div className="p-6">Chargement...</div>;

  // calculs dynamiques
  const totalMarches = marches.length;
  const totalGeo = marches.filter((m) => m?.latitude != null && m?.longitude != null).length;
  const pctGeo = totalMarches > 0 ? Math.round((totalGeo / totalMarches) * 100) : 0;
  const latestYear = totalMarches > 0
    ? Math.max(...marches.map((m) => Number(m.annee) || 0))
    : '—';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative flex flex-col items-center justify-center text-center px-6 py-20 min-h-[70vh] overflow-hidden"
      >
        {/* Image de fond */}
        <div className="absolute inset-0">
          <img
            src="/hero-bg.jpg"
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
          {/* Filtre dégradé vert */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-100/600 via-green-500/40 to-green-900/50" />
        </div>

        {/* Contenu */}
        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl md:text-6xl font-extrabold text-white mb-4"
          >
            <span className="text-white">GEO</span>
            <span className="text-green-300">FLY</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="text-lg text-gray-100 max-w-2xl mb-8"
          >
            Plateforme moderne de gestion et visualisation cartographique des marchés publics.
            Organisez, localisez et analysez vos données en toute simplicité.
          </motion.p>

          {/* Boutons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
          >
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => router.push('/login')}
            >
              Se connecter
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-green-700 px-8 py-3 text-lg transition-all duration-300"
              onClick={() => router.push('/register')}
            >
              Créer un compte
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="px-6 py-16 bg-white dark:bg-gray-800">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4"
        >
          Fonctionnalités principales
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto"
        >
          Découvrez les outils puissants qui vous aideront à gérer efficacement vos marchés publics
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <FeatureCard icon={<MapPin className="w-8 h-8 text-green-600" />} title="Géolocalisation" desc="Visualisez vos marchés publics sur une carte interactive" />
          <FeatureCard icon={<FileText className="w-8 h-8 text-green-600" />} title="Gestion complète" desc="Organisez et suivez tous vos marchés en un seul endroit" />
          <FeatureCard icon={<Building2 className="w-8 h-8 text-green-600" />} title="Multi-organismes" desc="Gérez les marchés de différentes collectivités" />
          <FeatureCard icon={<BarChart2 className="w-8 h-8 text-green-600" />} title="Analyses" desc="Obtenez des insights sur vos données de marchés" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-16 bg-gray-50 dark:bg-gray-900 text-center">
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StatCard value={String(totalMarches)} label="Marchés gérés" color="text-green-600" />
            <StatCard value={String(totalGeo)} label="Marchés géolocalisés" color="text-blue-600" />
            <StatCard value={`${pctGeo}%`} label="Taux de géolocalisation" color="text-teal-600" />
            <StatCard value={String(latestYear)} label="Dernière année enregistrée" color="text-amber-600" />
          </div>
        </div>
      </section>
    </div>
  );
}

/* Composants utilitaires */
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.4 }}
      viewport={{ once: true }}
      className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center border border-gray-100 dark:border-gray-600"
    >
      <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-full">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm">{desc}</p>
    </motion.div>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      viewport={{ once: true }}
      className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md"
    >
      <h3 className={`text-4xl font-bold ${color} mb-2`}>{value}</h3>
      <p className="text-gray-600 dark:text-gray-300 font-medium">{label}</p>
    </motion.div>
  );
}

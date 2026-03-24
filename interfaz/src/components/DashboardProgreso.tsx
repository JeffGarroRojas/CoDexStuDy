"use client";

import React, { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

interface RetroData {
    dia: string;
    retencion: number;
    probOlvido: number;
}

interface DashboardProps {
    documentName?: string;
    stats?: RetroData[];
}

export default function DashboardProgreso({
    documentName = "Todos los Documentos",
    stats
}: DashboardProps) {

    // Datos curados / simulados de curación SM-2 (Ebbinghaus Forgetting Curve)
    const defaultData: RetroData[] = [
        { dia: 'Día 1', retencion: 100, probOlvido: 0 },
        { dia: 'Día 2', retencion: 85, probOlvido: 15 },
        { dia: 'Día 3', retencion: 70, probOlvido: 30 },
        { dia: 'Día 5', retencion: 88, probOlvido: 12 }, // Post-Repaso
        { dia: 'Día 7', retencion: 75, probOlvido: 25 },
        { dia: 'Día 14', retencion: 92, probOlvido: 8 }, // Post-Repaso 2
        { dia: 'Día 30', retencion: 89, probOlvido: 11 },
    ];

    const data = stats || defaultData;
    const currentRetention = data[data.length - 1].retencion;

    const statusColor = currentRetention > 80 ? 'text-green-400' : (currentRetention > 60 ? 'text-yellow-400' : 'text-red-400');

    return (
        <div className="w-full h-full bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Analítica Quirúrgica (SM-2)</h2>
                    <p className="text-slate-400 text-sm">Curva del Olvido de Ebbinghaus: <span className="text-indigo-400">{documentName}</span></p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-slate-400 mb-1">Índice de Retención Estimado</p>
                    <p className={`text-4xl font-extrabold ${statusColor} drop-shadow-lg`}>
                        {currentRetention}%
                    </p>
                </div>
            </div>

            <div className="h-[300px] w-full mt-4 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50 p-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorRetencion" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorOlvido" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="dia" stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                        <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Area type="monotone" dataKey="retencion" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorRetencion)" name="Memoria Retenida (%)" />
                        <Area type="monotone" dataKey="probOlvido" stroke="#f87171" strokeWidth={2} fillOpacity={1} fill="url(#colorOlvido)" name="Riesgo de Olvido (%)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Estado Neural</p>
                    <p className="text-white font-semibold">Consolidando</p>
                </div>
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Próxima Alerta Crítica</p>
                    <p className="text-amber-400 font-semibold">Repaso sugerido en 48h</p>
                </div>
                <div className="bg-slate-800/60 p-4 rounded-xl border border-indigo-500/30">
                    <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Eficiencia SM-2</p>
                    <p className="text-indigo-400 font-semibold">+22% vs Línea Base</p>
                </div>
            </div>
        </div>
    );
}

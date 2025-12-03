import React, { useState } from 'react';
import { CheckCircle, Sparkles, Calendar, Clock, Target, X } from 'lucide-react';

export default function ProjectCompletionModal({ isOpen, onClose, project, onConfirm, isSubmitting }) {
    const [notes, setNotes] = useState('');

    if (!isOpen || !project) return null;

    const totalTasks = project.tasks?.length || 0;
    const completedTasks = project.tasks?.filter(t => t.status === 'Completado').length || 0;
    const avgProgress = totalTasks > 0
        ? project.tasks.reduce((sum, t) => sum + (t.actual_progress || 0), 0) / totalTasks
        : 0;

    const handleConfirm = () => {
        onConfirm(notes);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all duration-300 scale-100 animate-in">
                {}
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 rounded-t-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>

                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white bg-opacity-20 rounded-full backdrop-blur-sm">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">¡Proyecto Completado!</h2>
                                <p className="text-green-100 mt-1">Confirma la finalización del proyecto</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                            aria-label="Cerrar"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {}
                <div className="p-8">
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-neutral-900 mb-2">{project.name}</h3>
                        <p className="text-neutral-600">{project.category}</p>
                    </div>

                    {}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                            <div className="flex items-center gap-2 text-green-600 mb-1">
                                <Target className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Progreso</span>
                            </div>
                            <div className="text-2xl font-bold text-green-700">{avgProgress.toFixed(1)}%</div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Tareas</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-700">{completedTasks}/{totalTasks}</div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                            <div className="flex items-center gap-2 text-purple-600 mb-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Fecha</span>
                            </div>
                            <div className="text-sm font-bold text-purple-700">{new Date().toLocaleDateString('es-ES')}</div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                            <div className="flex items-center gap-2 text-orange-600 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Estado</span>
                            </div>
                            <div className="text-sm font-bold text-orange-700">Finalizado</div>
                        </div>
                    </div>

                    {}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Notas de Finalización (Opcional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Añade comentarios sobre la finalización del proyecto, logros alcanzados, lecciones aprendidas..."
                            rows={4}
                            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all resize-none"
                        />
                    </div>

                    {}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 border-2 border-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 hover:border-neutral-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 btn-gradient-success flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Finalizando...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Confirmar Finalización</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

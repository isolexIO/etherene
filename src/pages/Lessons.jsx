import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, ChevronRight, Sparkles, Loader2, BrainCircuit, Lightbulb, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import moment from 'moment';

export default function Lessons() {
    const [lessonData, setLessonData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLesson, setSelectedLesson] = useState(null);

    useEffect(() => {
        const fetchDailyLesson = async () => {
            try {
                const { data } = await base44.functions.invoke('getDailyLesson');
                setLessonData(data);
            } catch (error) {
                console.error("Failed to fetch lesson:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDailyLesson();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-500 animate-pulse">Consulting the Oracle for today's wisdom...</p>
            </div>
        );
    }

    const { today, history } = lessonData || {};

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-3">
                    <BookOpen className="w-8 h-8 text-indigo-600" />
                    Daily Lessons
                </h1>
                <p className="text-slate-500">Daily downloads to upgrade your internal protocol.</p>
            </div>

            {/* Today's Lesson Card */}
            {today && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 md:p-8 border border-indigo-100 shadow-xl shadow-indigo-100/50 mb-12 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm tracking-wider uppercase mb-4">
                            <Sparkles className="w-4 h-4" />
                            Lesson of the Day • {moment.utc(today.date).format('MMMM Do, YYYY')}
                        </div>

                        <h2 className="text-3xl font-bold text-slate-900 mb-6">{today.title}</h2>
                        
                        {today.principle_title && (
                            <div className="inline-block bg-slate-100 px-3 py-1 rounded-full text-xs font-mono text-slate-600 mb-6">
                                Ref: {today.principle_title}
                            </div>
                        )}

                        <div className="prose prose-indigo max-w-none mb-8 text-slate-600 leading-relaxed text-lg">
                            {today.content}
                        </div>

                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                            <h3 className="flex items-center gap-2 font-bold text-indigo-900 mb-3">
                                <Lightbulb className="w-5 h-5 text-indigo-600" />
                                Micro-Action
                            </h3>
                            <p className="text-indigo-800 italic">
                                "{today.practical_exercise}"
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* History Section */}
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    Previous Blocks
                </h3>

                <div className="grid gap-4">
                    {history && history.length > 0 ? (
                        history.map((lesson, index) => (
                            <motion.div
                                key={lesson.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setSelectedLesson(lesson)}
                                className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group cursor-pointer"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-xs text-slate-400 mb-1">
                                            {moment.utc(lesson.date).format('MMM D, YYYY')}
                                        </div>
                                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {lesson.title}
                                        </h4>
                                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                                            {lesson.content}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-full group-hover:bg-indigo-50 transition-colors">
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            The chain of history is just beginning.
                        </div>
                    )}
                </div>
            </div>

            {/* Lesson Modal */}
            <AnimatePresence>
                {selectedLesson && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLesson(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
                        >
                            <button
                                onClick={() => setSelectedLesson(null)}
                                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>

                            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm tracking-wider uppercase mb-4">
                                <Calendar className="w-4 h-4" />
                                {moment.utc(selectedLesson.date).format('MMMM Do, YYYY')}
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 mb-4 pr-8">{selectedLesson.title}</h2>

                            {selectedLesson.principle_title && (
                                <div className="inline-block bg-slate-100 px-3 py-1 rounded-full text-xs font-mono text-slate-600 mb-6">
                                    Ref: {selectedLesson.principle_title}
                                </div>
                            )}

                            <div className="prose prose-indigo max-w-none mb-8 text-slate-600 leading-relaxed">
                                {selectedLesson.content}
                            </div>

                            {selectedLesson.practical_exercise && (
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                                    <h3 className="flex items-center gap-2 font-bold text-indigo-900 mb-3">
                                        <Lightbulb className="w-5 h-5 text-indigo-600" />
                                        Micro-Action
                                    </h3>
                                    <p className="text-indigo-800 italic">
                                        "{selectedLesson.practical_exercise}"
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
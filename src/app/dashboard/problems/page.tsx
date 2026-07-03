'use client';

import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Search, ArrowLeft, Lightbulb } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  description: string;
  sampleInput: string | null;
  sampleOutput: string | null;
  hints: string | null;
  topicTags: string[];
  isBuiltIn: boolean;
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  
  // Detail overlay state
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  // New problem form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
  const [newDescription, setNewDescription] = useState('');
  const [newSampleInput, setNewSampleInput] = useState('');
  const [newSampleOutput, setNewSampleOutput] = useState('');
  const [newHints, setNewHints] = useState('');
  const [newTagsString, setNewTagsString] = useState(''); // comma-separated
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/problems');
      if (res.ok) {
        const data = await res.json();
        setProblems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    const topicTags = newTagsString
      ? newTagsString.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : [];

    try {
      const res = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          difficulty: newDifficulty,
          description: newDescription,
          sampleInput: newSampleInput,
          sampleOutput: newSampleOutput,
          hints: newHints,
          topicTags,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setProblems((prev) => [created, ...prev]);
        setIsModalOpen(false);
        // Reset form
        setNewTitle('');
        setNewDifficulty('EASY');
        setNewDescription('');
        setNewSampleInput('');
        setNewSampleOutput('');
        setNewHints('');
        setNewTagsString('');
      } else {
        const err = await res.json();
        setCreateError(err.error || 'Failed to create problem.');
      }
    } catch (err) {
      setCreateError('Network error. Failed to create problem.');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredProblems = problems.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topicTags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterDifficulty !== 'all' && p.difficulty !== filterDifficulty) return false;
    return true;
  });

  return (
    <div className="space-y-8 relative">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Problem Library</h1>
          <p className="text-slate-400 text-sm mt-1">Browse, view, and add custom coding challenges.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-steel hover:bg-steel-light text-white font-bold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-steel/20 hover:translate-y-[-1px] transition-all cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5" />
          Create Problem
        </button>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Difficulties */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 self-start">
          <button
            onClick={() => setFilterDifficulty('all')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
              filterDifficulty === 'all' ? 'bg-steel text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterDifficulty('EASY')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
              filterDifficulty === 'EASY' ? 'bg-teal-green text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Easy
          </button>
          <button
            onClick={() => setFilterDifficulty('MEDIUM')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
              filterDifficulty === 'MEDIUM' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Medium
          </button>
          <button
            onClick={() => setFilterDifficulty('HARD')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
              filterDifficulty === 'HARD' ? 'bg-red-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hard
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-steel transition-all"
          />
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-steel border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-semibold">Loading problems...</p>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
          <BookOpen className="mx-auto h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-300">No problems found</h3>
          <p className="text-slate-500 text-sm mt-1">Try relaxing your search terms or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProblems.map((prob) => (
            <div
              key={prob.id}
              onClick={() => setSelectedProblem(prob)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-6 shadow-md transition-all cursor-pointer flex flex-col justify-between hover:translate-y-[-2px] relative overflow-hidden group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    prob.difficulty === 'EASY'
                      ? 'bg-teal-green/10 text-teal-green border-teal-green/20'
                      : prob.difficulty === 'MEDIUM'
                        ? 'bg-amber-500/10 text-warning border border-warning/20'
                        : 'bg-red-500/10 text-danger border border-danger/20'
                  }`}>
                    {prob.difficulty}
                  </span>
                  
                  {prob.isBuiltIn && (
                    <span className="text-[9px] font-semibold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      BUILT-IN
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-steel-light transition-all truncate">
                  {prob.title}
                </h3>
                
                <p className="text-slate-400 text-xs line-clamp-3 mb-6 leading-relaxed">
                  {prob.description}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-auto">
                {prob.topicTags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                    {tag}
                  </span>
                ))}
                {prob.topicTags.length > 3 && (
                  <span className="text-[10px] text-slate-500 px-1 py-0.5">
                    +{prob.topicTags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Problem Detail Overlay Panel */}
      {selectedProblem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-slate-900 border-l border-slate-850 w-full max-w-2xl h-full flex flex-col justify-between shadow-2xl relative">
            <div className="absolute top-4 left-4">
              <button
                onClick={() => setSelectedProblem(null)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all bg-slate-950 hover:bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Library
              </button>
            </div>
            
            <div className="overflow-y-auto px-8 pt-20 pb-8 flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{selectedProblem.title}</h2>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  selectedProblem.difficulty === 'EASY'
                    ? 'bg-teal-green/10 text-teal-green border-teal-green/20'
                    : selectedProblem.difficulty === 'MEDIUM'
                      ? 'bg-amber-500/10 text-warning border border-warning/20'
                      : 'bg-red-500/10 text-danger border border-danger/20'
                }`}>
                  {selectedProblem.difficulty}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pb-4 border-b border-slate-800">
                {selectedProblem.topicTags.map((tag) => (
                  <span key={tag} className="text-xs text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
                <div className="text-slate-200 text-sm whitespace-pre-line leading-relaxed bg-slate-950/40 p-4 rounded-lg border border-slate-850">
                  {selectedProblem.description}
                </div>
              </div>

              {/* Samples */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedProblem.sampleInput && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sample Input</h4>
                    <pre className="bg-slate-950 border border-slate-855 p-3 rounded-lg text-xs font-mono text-steel-light overflow-x-auto">
                      {selectedProblem.sampleInput}
                    </pre>
                  </div>
                )}
                {selectedProblem.sampleOutput && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sample Output</h4>
                    <pre className="bg-slate-950 border border-slate-855 p-3 rounded-lg text-xs font-mono text-teal-green overflow-x-auto">
                      {selectedProblem.sampleOutput}
                    </pre>
                  </div>
                )}
              </div>

              {/* Hints */}
              {selectedProblem.hints && (
                <div className="bg-amber-950/10 border border-warning/20 text-warning rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Hint / Suggestions</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedProblem.hints}
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => setSelectedProblem(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-5 rounded-lg text-xs transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Problem Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-steel/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create Custom Problem</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateProblem} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {createError && (
                <div className="bg-red-900/30 border border-danger text-danger text-sm rounded-lg p-3 text-center">
                  {createError}
                </div>
              )}

              {/* Title & Difficulty */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Problem Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Find Node in BST"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-steel transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-steel transition-all cursor-pointer"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain the problem statement clearly. You can use markdown code snippets."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-steel transition-all"
                />
              </div>

              {/* Inputs/Outputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Sample Input
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. root = [1,2], val = 2"
                    value={newSampleInput}
                    onChange={(e) => setNewSampleInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-steel transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Sample Output
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Node 2 reference"
                    value={newSampleOutput}
                    onChange={(e) => setNewSampleOutput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-steel transition-all"
                  />
                </div>
              </div>

              {/* Hints */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Hints / Tips (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Try traversing recursively using DFS."
                  value={newHints}
                  onChange={(e) => setNewHints(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-steel transition-all"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Topic Tags (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Trees, DFS, Binary Search Tree"
                  value={newTagsString}
                  onChange={(e) => setNewTagsString(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-steel transition-all"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-steel hover:bg-steel-light text-white font-bold py-2 px-5 rounded-lg text-xs shadow hover:shadow-steel/20 transition-all cursor-pointer"
                >
                  {createLoading ? 'Creating...' : 'Create Problem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import prisma from '@/prisma/db';
import { revalidatePath } from 'next/cache';
import { Activity, MousePointerClick, BarChart3, Plus, ArrowRight, LayoutDashboard, Settings, GitPullRequest, CheckCircle, Trophy, ExternalLink } from 'lucide-react';
import { getSettings } from '@/lib/settings';
import { GitHubSettings, TestActions, CopySnippet } from './components';

export default async function Dashboard() {
  const projects = await prisma.project.findMany({
    include: { tests: { include: { variants: { include: { events: true } } } } }
  });

  const settings = getSettings();

  async function createProject(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    if (name && url) {
      await prisma.project.create({ data: { name, url } });
      revalidatePath('/');
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-blue-500/30">
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">A/B Engine</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* GitHub Settings Panel */}
        <GitHubSettings
          hasToken={!!settings.githubToken}
          repo={settings.githubRepo || ''}
          branch={settings.githubBranch || 'main'}
        />

        {projects.length === 0 ? (
          <div className="max-w-md mx-auto mt-20 p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h2 className="text-2xl font-semibold mb-2">Welcome to A/B Engine</h2>
            <p className="text-gray-400 mb-8 max-w-sm">Create your first project to get your integration snippet and start running AI-powered A/B tests.</p>

            <form action={createProject} className="space-y-4 relative z-10">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Project Name</label>
                <input name="name" required placeholder="e.g. My Next.js Blog" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-colors text-white placeholder-gray-600" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Site URL</label>
                <input name="url" required placeholder="https://example.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-colors text-white placeholder-gray-600" />
              </div>
              <button className="w-full py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 group">
                Create Project
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-12">
            {projects.map(project => (
              <div key={project.id} className="space-y-6">
                <div className="flex items-end justify-between border-b border-white/10 pb-6">
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight mb-2">{project.name}</h1>
                    <a href={project.url} target="_blank" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">{project.url}</a>
                  </div>

                  <CopySnippet projectId={project.id} />
                </div>

                {project.tests.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl border border-dashed border-white/20 bg-white/[0.02]">
                    <LayoutDashboard className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No tests running</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">Install the snippet on your site, visit your site, and add <code className="bg-black text-xs px-2 py-1 rounded">?ab_admin=true</code> to the URL to create your first test visually.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {project.tests.map((test) => {
                      const totalEvents = test.variants.reduce((acc, v) => acc + v.events.length, 0);

                      // Determine content type
                      let typeLabel = test.contentType || 'text';
                      const variantContent = test.variants[1]?.content || '';
                      if (variantContent.startsWith('MERMAID:')) typeLabel = 'diagram';
                      else if (variantContent.startsWith('GAME:')) typeLabel = 'game';
                      else {
                        try {
                          const p = JSON.parse(variantContent);
                          if (p.type === 'position') typeLabel = 'reposition';
                        } catch {}
                      }

                      const typeBadgeColors: Record<string, string> = {
                        text: 'bg-gray-500/20 text-gray-300',
                        button: 'bg-purple-500/20 text-purple-300',
                        hero: 'bg-amber-500/20 text-amber-300',
                        html: 'bg-cyan-500/20 text-cyan-300',
                        image: 'bg-pink-500/20 text-pink-300',
                        diagram: 'bg-blue-500/20 text-blue-300',
                        game: 'bg-green-500/20 text-green-300',
                        reposition: 'bg-orange-500/20 text-orange-300',
                      };

                      return (
                        <div key={test.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${test.status === 'completed' ? 'bg-blue-500' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse'}`} />
                                <span className={`text-xs font-semibold uppercase tracking-wider ${test.status === 'completed' ? 'text-blue-400' : 'text-emerald-500'}`}>
                                  {test.status === 'completed' ? 'Completed' : 'Live'}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeBadgeColors[typeLabel] || typeBadgeColors.text}`}>
                                  {typeLabel}
                                </span>
                              </div>
                              <h3 className="text-xl font-medium">{test.name}</h3>
                              <p className="text-sm text-gray-500 mt-1 font-mono truncate max-w-xs">{test.fingerprint}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-400 mb-1">Goal: <span className="text-white capitalize">{test.goal}</span></p>
                              <p className="text-2xl font-light">{totalEvents} <span className="text-sm text-gray-500">hits</span></p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {test.variants.map((variant, idx) => {
                              const views = variant.events.filter((e) => e.type === 'view').length;
                              const convs = variant.events.filter((e) => e.type === 'conversion').length;
                              const convRate = views > 0 ? ((convs / views) * 100).toFixed(1) : '0.0';
                              const barWidth = Math.max(5, (views / Math.max(1, totalEvents)) * 100);
                              const isWinner = test.winnerId === variant.id;

                              return (
                                <div key={variant.id} className={`bg-black/30 rounded-xl p-4 border ${isWinner ? 'border-emerald-500/30' : 'border-white/5'}`}>
                                  <div className="flex justify-between items-end mb-3">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-3 h-3 rounded-sm ${idx === 0 ? 'bg-gray-500' : isWinner ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                        <span className="font-medium text-sm text-gray-200">{variant.name}</span>
                                        {isWinner && <Trophy className="w-3.5 h-3.5 text-emerald-400" />}
                                      </div>
                                      <p className="text-xs text-gray-500 truncate max-w-[200px]" title={variant.content}>
                                        {(() => {
                                          if (variant.content.startsWith('MERMAID:')) return 'Mermaid diagram';
                                          if (variant.content.startsWith('GAME:')) return 'Game level';
                                          try {
                                            const p = JSON.parse(variant.content);
                                            if (p.type === 'position') return `Moved → ${p.parentSelector}`;
                                            if (p.text) return p.text;
                                          } catch {}
                                          return variant.content.slice(0, 80);
                                        })()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      {test.goal === 'click' ? (
                                        <div className="text-lg font-semibold text-white">{convRate}% <span className="text-xs text-gray-500 font-normal">CVR</span></div>
                                      ) : (
                                        <div className="text-lg font-semibold text-white">{views} <span className="text-xs text-gray-500 font-normal">Views</span></div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${idx === 0 ? 'bg-gray-500' : isWinner ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${barWidth}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Test Actions: declare winner + finalize */}
                          <TestActions
                            testId={test.id}
                            status={test.status}
                            winnerId={test.winnerId}
                            variants={test.variants.map((v) => ({ id: v.id, name: v.name }))}
                            hasGithub={!!settings.githubToken && !!settings.githubRepo}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

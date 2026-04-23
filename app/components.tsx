'use client';

import { useState } from 'react';
import { Settings, GitPullRequest, CheckCircle, ExternalLink, Eye, EyeOff, Trophy, Loader2 } from 'lucide-react';

// ---- GitHub Settings Panel ----
export function GitHubSettings({ hasToken, repo, branch }: { hasToken: boolean; repo: string; branch: string }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [repoVal, setRepoVal] = useState(repo);
  const [branchVal, setBranchVal] = useState(branch);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [connected, setConnected] = useState(hasToken);

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const body: any = { githubRepo: repoVal, githubBranch: branchVal };
      if (token) body.githubToken = token;

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setStatus({ ok: true, msg: 'Connected to GitHub successfully!' });
      setConnected(true);
      setToken('');
    } catch (e: any) {
      setStatus({ ok: false, msg: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${connected ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
            <Settings className={`w-4 h-4 ${connected ? 'text-emerald-400' : 'text-gray-400'}`} />
          </div>
          <div className="text-left">
            <p className="font-medium text-sm">GitHub Integration</p>
            <p className="text-xs text-gray-500">
              {connected ? `Connected to ${repoVal || 'repository'}` : 'Configure to enable PR & issue creation on finalize'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connected && <CheckCircle className="w-4 h-4 text-emerald-400" />}
          <span className="text-gray-500 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-white/5 pt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Personal Access Token {connected && <span className="text-emerald-400 normal-case">(saved)</span>}
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={connected ? '••••••••••••••••' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 outline-none focus:border-blue-500/50 transition-colors text-white placeholder-gray-600 font-mono text-sm"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-600 mt-1">Needs <code className="bg-black px-1 rounded">repo</code> scope. Generate at GitHub → Settings → Developer settings → Personal access tokens</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Repository</label>
              <input
                value={repoVal}
                onChange={(e) => setRepoVal(e.target.value)}
                placeholder="owner/repo"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-colors text-white placeholder-gray-600 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Base Branch</label>
              <input
                value={branchVal}
                onChange={(e) => setBranchVal(e.target.value)}
                placeholder="main"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-colors text-white placeholder-gray-600 text-sm"
              />
            </div>
          </div>

          {status && (
            <div className={`text-sm px-4 py-2 rounded-lg ${status.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {status.msg}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-white text-black font-medium hover:bg-gray-100 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {saving ? 'Verifying...' : 'Save & Verify'}
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Test Actions (Declare Winner + Finalize) ----
export function TestActions({
  testId,
  status,
  winnerId,
  variants,
  hasGithub,
}: {
  testId: string;
  status: string;
  winnerId: string | null;
  variants: { id: string; name: string }[];
  hasGithub: boolean;
}) {
  const [selectedWinner, setSelectedWinner] = useState(winnerId || '');
  const [declaring, setDeclaring] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [result, setResult] = useState<{ issue?: string; pr?: string } | null>(null);
  const [error, setError] = useState('');

  async function declareWinner() {
    if (!selectedWinner) return;
    setDeclaring(true);
    setError('');
    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId: selectedWinner }),
      });
      if (!res.ok) throw new Error('Failed to declare winner');
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
      setDeclaring(false);
    }
  }

  async function finalize() {
    const wId = selectedWinner || winnerId;
    if (!wId) {
      setError('Select a winner first');
      return;
    }
    setFinalizing(true);
    setError('');
    try {
      const res = await fetch(`/api/tests/${testId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId: wId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Finalize failed');
      setResult({ issue: data.issue?.url, pr: data.pr?.url });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFinalizing(false);
    }
  }

  if (result) {
    return (
      <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
        <p className="text-sm font-medium text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Test finalized!
        </p>
        {result.issue && (
          <a href={result.issue} target="_blank" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
            <ExternalLink className="w-3.5 h-3.5" /> View GitHub Issue
          </a>
        )}
        {result.pr && (
          <a href={result.pr} target="_blank" className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300">
            <GitPullRequest className="w-3.5 h-3.5" /> View Pull Request
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
      {/* Winner selection */}
      {!winnerId && status !== 'completed' && (
        <div className="flex items-center gap-2">
          <select
            value={selectedWinner}
            onChange={(e) => setSelectedWinner(e.target.value)}
            className="flex-1 bg-[#1a1a1f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
            style={{ colorScheme: 'dark' }}
          >
            <option value="" style={{ background: '#1a1a1f', color: '#9ca3af' }}>Select winner...</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id} style={{ background: '#1a1a1f', color: '#fff' }}>{v.name}</option>
            ))}
          </select>
          <button
            onClick={declareWinner}
            disabled={!selectedWinner || declaring}
            className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 text-sm font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            {declaring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />}
            Declare
          </button>
        </div>
      )}

      {/* Finalize button */}
      <button
        onClick={finalize}
        disabled={finalizing || (!winnerId && !selectedWinner) || !hasGithub}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium text-sm hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {finalizing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating Issue & PR...
          </>
        ) : (
          <>
            <GitPullRequest className="w-4 h-4" />
            Finalize → Create GitHub Issue & PR
          </>
        )}
      </button>

      {!hasGithub && (
        <p className="text-[11px] text-gray-600 text-center">Configure GitHub above to enable finalization</p>
      )}

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}

// ---- Copy Snippet ----
export function CopySnippet({ projectId }: { projectId: string }) {
  const [copied, setCopied] = useState(false);
  const snippet = `<script src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/sdk.js" data-project-id="${projectId}"></script>`;

  function copy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-w-md">
      <p className="text-xs text-gray-400 mb-2 font-mono uppercase">Installation Snippet</p>
      <code className="text-xs text-green-400 font-mono break-all line-clamp-2 select-all block mb-2">
        {snippet}
      </code>
      <button onClick={copy} className="text-xs text-gray-500 hover:text-white transition-colors">
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}

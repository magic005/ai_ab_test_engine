/**
 * GitHub API helper — uses fetch directly, no octokit dependency needed.
 * All methods require a personal access token with repo scope.
 */

const API = 'https://api.github.com';

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function ghFetch(token: string, path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, { ...opts, headers: { ...headers(token), ...(opts.headers || {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(body as any).message || res.statusText}`);
  return body as any;
}

/** Create a GitHub Issue with markdown body */
export async function createIssue(
  token: string,
  repo: string,
  title: string,
  body: string,
  labels: string[] = [],
) {
  return ghFetch(token, `/repos/${repo}/issues`, {
    method: 'POST',
    body: JSON.stringify({ title, body, labels }),
  });
}

/** Get the SHA of a branch's HEAD */
export async function getBranchSha(token: string, repo: string, branch: string) {
  const data = await ghFetch(token, `/repos/${repo}/git/ref/heads/${branch}`);
  return data.object.sha as string;
}

/** Create a new branch from a base SHA */
export async function createBranch(token: string, repo: string, branch: string, sha: string) {
  return ghFetch(token, `/repos/${repo}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
  });
}

/** Create or update a file on a branch */
export async function createOrUpdateFile(
  token: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
) {
  // Check if file exists to get its SHA
  let fileSha: string | undefined;
  try {
    const existing = await ghFetch(token, `/repos/${repo}/contents/${path}?ref=${branch}`);
    fileSha = existing.sha;
  } catch {
    // file doesn't exist yet — that's fine
  }

  const payload: any = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
  };
  if (fileSha) payload.sha = fileSha;

  return ghFetch(token, `/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/** Create a Pull Request */
export async function createPullRequest(
  token: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string,
) {
  return ghFetch(token, `/repos/${repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({ title, body, head, base }),
  });
}

/** Verify token is valid and has repo access */
export async function verifyToken(token: string, repo: string) {
  try {
    await ghFetch(token, `/repos/${repo}`);
    return { valid: true };
  } catch (e: any) {
    return { valid: false, error: e.message };
  }
}

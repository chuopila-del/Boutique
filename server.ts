import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';

interface GitHubUserProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

interface SessionRecord {
  accessToken: string;
  user: GitHubUserProfile;
  expiresAt: number;
}

interface PendingExchangeRecord {
  sessionToken: string;
  user: GitHubUserProfile;
  expiresAt: number;
}

const PORT = Number(process.env.PORT) || 3000;
const SESSION_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours
const EXCHANGE_TTL_MS = 1000 * 60 * 3; // 3 minutes
const STATE_TTL_MS = 1000 * 60 * 10; // 10 minutes
const SIGNING_KEY = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const sessions = new Map<string, SessionRecord>();
const pendingExchanges = new Map<string, PendingExchangeRecord>();

const REPO_NAME_REGEX = /^[a-zA-Z0-9._-]{1,100}$/;
const EXCLUDED_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '.aistudio', 'coverage']);

function getAppBaseUrl(): string {
  const raw = process.env.APP_URL?.trim();
  if (!raw || raw === 'MY_APP_URL') {
    return `http://localhost:${PORT}`;
  }
  return raw.replace(/\/+$/, '');
}

function getCallbackUrl(): string {
  return `${getAppBaseUrl()}/auth/callback`;
}

function getGitHubCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim() ?? '';
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim() ?? '';
  if (!clientId || !clientSecret) {
    return null;
  }
  return { clientId, clientSecret };
}

function createSignedState(): string {
  const payload = JSON.stringify({
    nonce: crypto.randomBytes(16).toString('hex'),
    exp: Date.now() + STATE_TTL_MS,
  });
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SIGNING_KEY).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySignedState(stateParam: unknown): boolean {
  if (typeof stateParam !== 'string' || !stateParam.includes('.')) {
    return false;
  }
  const [encoded, sig] = stateParam.split('.');
  if (!encoded || !sig) {
    return false;
  }
  const expectedSig = crypto
    .createHmac('sha256', SIGNING_KEY)
    .update(encoded)
    .digest('base64url');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      exp?: number;
    };
    return typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function cleanupExpiredMaps(): void {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt <= now) {
      sessions.delete(token);
    }
  }
  for (const [code, pending] of pendingExchanges.entries()) {
    if (pending.expiresAt <= now) {
      pendingExchanges.delete(code);
    }
  }
}

function requireGitHubSession(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  cleanupExpiredMaps();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sessão GitHub não autenticada.' });
    return;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token);
    res.status(401).json({ error: 'Sessão expirada. Conecte novamente ao GitHub.' });
    return;
  }
  res.locals.sessionToken = token;
  res.locals.githubSession = session;
  next();
}

function collectProjectFiles(baseDir: string): Array<{ repoPath: string; fullPath: string }> {
  const results: Array<{ repoPath: string; fullPath: string }> = [];
  const resolvedBase = path.resolve(baseDir);

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        continue;
      }
      const fullPath = path.resolve(currentDir, entry.name);
      if (!fullPath.startsWith(resolvedBase + path.sep)) {
        continue;
      }
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        if (
          entry.name.endsWith('.zip') ||
          entry.name === '.DS_Store' ||
          entry.name.startsWith('Screenshot_')
        ) {
          continue;
        }
        if (entry.name.startsWith('.env') && entry.name !== '.env.example') {
          continue;
        }
        const relPath = path.relative(resolvedBase, fullPath).split(path.sep).join('/');
        results.push({ repoPath: relPath, fullPath });
      }
    }
  }

  walk(resolvedBase);
  return results;
}

async function githubFetch(
  apiPath: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<globalThis.Response> {
  const url = `https://api.github.com${apiPath}`;
  return fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'Joias-Semi-Boutique-Exporter',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    },
  });
}

function renderCallbackHtml(payload: Record<string, unknown>, message: string): string {
  const safeJson = JSON.stringify(payload).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="UTF-8" />
    <title>Autenticação GitHub</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #0D0C0F; color: #F5F2EC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; text-align: center; }
      .card { max-width: 420px; border: 1px solid rgba(214,184,118,0.28); background: #161419; border-radius: 14px; padding: 28px; }
      h1 { font-size: 18px; margin: 0 0 8px; color: #E8CFA0; }
      p { font-size: 14px; color: #B8B0A4; margin: 0; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>GitHub</h1>
      <p>${message}</p>
    </div>
    <script>
      (function () {
        var data = ${safeJson};
        if (window.opener) {
          window.opener.postMessage(data, '*');
          window.close();
        } else {
          window.location.href = '/#github';
        }
      })();
    </script>
  </body>
</html>`;
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const DOWNLOAD_ALLOWLIST: Record<string, string> = {
    '1': 'joias-semi-1-codigo.zip',
    '2': 'joias-semi-2-imagens-a.zip',
    '3': 'joias-semi-3-imagens-b.zip',
    '4': 'joias-semi-4-imagens-c.zip',
  };

  app.get('/api/download/:part', (req: Request, res: Response) => {
    const partParam = typeof req.params.part === 'string' ? req.params.part : '';
    const filename = DOWNLOAD_ALLOWLIST[partParam];
    if (!filename) {
      res.status(404).json({ error: 'Arquivo não encontrado.' });
      return;
    }
    const publicDir = path.resolve(process.cwd(), 'public');
    const filePath = path.resolve(publicDir, filename);
    if (!filePath.startsWith(publicDir + path.sep) || !fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Arquivo não encontrado.' });
      return;
    }
    res.download(filePath, filename);
  });

  app.get('/api/github/status', (_req: Request, res: Response) => {
    const creds = getGitHubCredentials();
    res.json({
      configured: Boolean(creds),
      callbackUrl: getCallbackUrl(),
      appUrl: getAppBaseUrl(),
    });
  });

  app.get('/api/auth/github/url', (_req: Request, res: Response) => {
    const creds = getGitHubCredentials();
    if (!creds) {
      res.status(503).json({
        error:
          'Configure GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET nas variáveis de ambiente (Secrets) antes de conectar ao GitHub.',
      });
      return;
    }

    const state = createSignedState();
    const params = new URLSearchParams({
      client_id: creds.clientId,
      redirect_uri: getCallbackUrl(),
      scope: 'repo read:user',
      state,
    });

    res.json({
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
    });
  });

  const handleGitHubCallback = async (req: Request, res: Response): Promise<void> => {
    const { code, state, error } = req.query;

    if (typeof error === 'string' && error.length > 0) {
      res
        .status(400)
        .send(
          renderCallbackHtml(
            { type: 'GITHUB_OAUTH_ERROR', error: 'Autorização cancelada no GitHub.' },
            'Autorização cancelada. Pode fechar esta janela.'
          )
        );
      return;
    }

    if (typeof code !== 'string' || !code || !verifySignedState(state)) {
      res
        .status(400)
        .send(
          renderCallbackHtml(
            { type: 'GITHUB_OAUTH_ERROR', error: 'Pedido OAuth inválido ou expirado.' },
            'Validação OAuth inválida ou expirada. Tente novamente.'
          )
        );
      return;
    }

    const creds = getGitHubCredentials();
    if (!creds) {
      res
        .status(503)
        .send(
          renderCallbackHtml(
            { type: 'GITHUB_OAUTH_ERROR', error: 'Credenciais GitHub não configuradas.' },
            'Credenciais do servidor não configuradas.'
          )
        );
      return;
    }

    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: creds.clientId,
          client_secret: creds.clientSecret,
          code,
          redirect_uri: getCallbackUrl(),
        }),
      });

      const tokenData = (await tokenResponse.json()) as {
        access_token?: string;
        error_description?: string;
      };

      if (!tokenResponse.ok || !tokenData.access_token) {
        res
          .status(400)
          .send(
            renderCallbackHtml(
              {
                type: 'GITHUB_OAUTH_ERROR',
                error: tokenData.error_description || 'Falha ao obter token do GitHub.',
              },
              'Não foi possível concluir o login com o GitHub.'
            )
          );
        return;
      }

      const userResponse = await githubFetch('/user', tokenData.access_token);
      if (!userResponse.ok) {
        res
          .status(400)
          .send(
            renderCallbackHtml(
              { type: 'GITHUB_OAUTH_ERROR', error: 'Falha ao obter perfil do GitHub.' },
              'Erro ao carregar seu perfil do GitHub.'
            )
          );
        return;
      }

      const userJson = (await userResponse.json()) as GitHubUserProfile;
      const user: GitHubUserProfile = {
        login: userJson.login,
        name: userJson.name,
        avatar_url: userJson.avatar_url,
        html_url: userJson.html_url,
      };

      cleanupExpiredMaps();
      const sessionToken = crypto.randomBytes(32).toString('hex');
      sessions.set(sessionToken, {
        accessToken: tokenData.access_token,
        user,
        expiresAt: Date.now() + SESSION_TTL_MS,
      });

      const exchangeCode = crypto.randomBytes(24).toString('hex');
      pendingExchanges.set(exchangeCode, {
        sessionToken,
        user,
        expiresAt: Date.now() + EXCHANGE_TTL_MS,
      });

      res.send(
        renderCallbackHtml(
          { type: 'OAUTH_AUTH_SUCCESS', exchangeCode },
          'Autenticação concluída com sucesso. Esta janela vai fechar automaticamente.'
        )
      );
    } catch {
      res
        .status(500)
        .send(
          renderCallbackHtml(
            { type: 'GITHUB_OAUTH_ERROR', error: 'Erro interno na autenticação GitHub.' },
            'Erro ao comunicar com o GitHub. Tente novamente.'
          )
        );
    }
  };

  app.get(['/auth/callback', '/auth/callback/'], (req: Request, res: Response) => {
    void handleGitHubCallback(req, res);
  });

  app.post('/api/auth/github/session', (req: Request, res: Response) => {
    cleanupExpiredMaps();
    const exchangeCode =
      typeof req.body?.exchangeCode === 'string' ? req.body.exchangeCode.trim() : '';
    if (!exchangeCode) {
      res.status(400).json({ error: 'Código de sessão ausente.' });
      return;
    }
    const pending = pendingExchanges.get(exchangeCode);
    pendingExchanges.delete(exchangeCode);
    if (!pending || pending.expiresAt <= Date.now()) {
      res.status(401).json({ error: 'Código expirado. Conecte novamente ao GitHub.' });
      return;
    }
    res.json({
      sessionToken: pending.sessionToken,
      user: pending.user,
    });
  });

  app.post('/api/auth/github/logout', requireGitHubSession, (_req: Request, res: Response) => {
    const token = res.locals.sessionToken as string;
    sessions.delete(token);
    res.json({ ok: true });
  });

  app.get('/api/github/repos', requireGitHubSession, async (_req: Request, res: Response) => {
    const session = res.locals.githubSession as SessionRecord;
    try {
      const ghRes = await githubFetch(
        '/user/repos?sort=updated&per_page=30&affiliation=owner',
        session.accessToken
      );
      if (!ghRes.ok) {
        res.status(502).json({ error: 'Não foi possível listar repositórios do GitHub.' });
        return;
      }
      const repos = (await ghRes.json()) as Array<{
        name: string;
        full_name: string;
        private: boolean;
        default_branch: string;
        html_url: string;
      }>;
      res.json({
        user: session.user,
        repos: repos.map((r) => ({
          name: r.name,
          fullName: r.full_name,
          private: r.private,
          defaultBranch: r.default_branch || 'main',
          htmlUrl: r.html_url,
        })),
      });
    } catch {
      res.status(502).json({ error: 'Erro ao consultar repositórios no GitHub.' });
    }
  });

  app.post('/api/github/push', requireGitHubSession, async (req: Request, res: Response) => {
    const session = res.locals.githubSession as SessionRecord;
    const rawRepoName = typeof req.body?.repoName === 'string' ? req.body.repoName.trim() : '';
    const createNew = Boolean(req.body?.createNew);
    const isPrivate = Boolean(req.body?.isPrivate);
    const rawCommitMsg =
      typeof req.body?.commitMessage === 'string' && req.body.commitMessage.trim().length > 0
        ? req.body.commitMessage.trim().slice(0, 140)
        : 'Publicar catálogo Joias Semi Boutique';

    if (!REPO_NAME_REGEX.test(rawRepoName)) {
      res.status(400).json({
        error: 'Nome de repositório inválido. Use apenas letras, números, hífen, ponto ou underscore.',
      });
      return;
    }

    const owner = session.user.login;
    if (!REPO_NAME_REGEX.test(owner)) {
      res.status(400).json({ error: 'Utilizador GitHub inválido.' });
      return;
    }

    try {
      let defaultBranch = 'main';
      let repoHtmlUrl = `https://github.com/${owner}/${rawRepoName}`;

      if (createNew) {
        const createRes = await githubFetch('/user/repos', session.accessToken, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: rawRepoName,
            private: isPrivate,
            description: 'Joias Semi Boutique — Catálogo de moda feminina e atendimento WhatsApp',
            auto_init: true,
          }),
        });
        const createJson = (await createRes.json()) as {
          message?: string;
          default_branch?: string;
          html_url?: string;
        };
        if (!createRes.ok) {
          res.status(createRes.status === 422 ? 409 : 502).json({
            error: createJson.message || 'Não foi possível criar o repositório no GitHub.',
          });
          return;
        }
        defaultBranch = createJson.default_branch || 'main';
        repoHtmlUrl = createJson.html_url || repoHtmlUrl;
      } else {
        const repoRes = await githubFetch(`/repos/${owner}/${rawRepoName}`, session.accessToken);
        if (!repoRes.ok) {
          res.status(404).json({
            error: `Repositório "${owner}/${rawRepoName}" não encontrado.`,
          });
          return;
        }
        const repoJson = (await repoRes.json()) as {
          default_branch?: string;
          html_url?: string;
        };
        defaultBranch = repoJson.default_branch || 'main';
        repoHtmlUrl = repoJson.html_url || repoHtmlUrl;
      }

      // Ensure branch ref exists (GitHub auto_init can take a moment)
      let parentSha: string | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const refRes = await githubFetch(
          `/repos/${owner}/${rawRepoName}/git/ref/heads/${encodeURIComponent(defaultBranch)}`,
          session.accessToken
        );
        if (refRes.ok) {
          const refJson = (await refRes.json()) as { object?: { sha?: string } };
          parentSha = refJson.object?.sha ?? null;
          break;
        }
        if (attempt < 4) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }

      if (!parentSha) {
        // Initialize empty repo with README commit via Contents API so Git Data API works
        const initRes = await githubFetch(
          `/repos/${owner}/${rawRepoName}/contents/README.md`,
          session.accessToken,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: 'Initial commit',
              content: Buffer.from('# Joias Semi Boutique\n', 'utf8').toString('base64'),
              branch: defaultBranch,
            }),
          }
        );
        if (!initRes.ok) {
          res.status(502).json({ error: 'Não foi possível inicializar a branch do repositório.' });
          return;
        }
        const initJson = (await initRes.json()) as { commit?: { sha?: string } };
        parentSha = initJson.commit?.sha ?? null;
      }

      if (!parentSha) {
        res.status(502).json({ error: 'Não foi possível localizar o commit base da branch.' });
        return;
      }

      const files = collectProjectFiles(process.cwd());
      const treeEntries: Array<{
        path: string;
        mode: '100644';
        type: 'blob';
        sha: string;
      }> = [];

      const BATCH_SIZE = 8;
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (file) => {
            const contentBase64 = fs.readFileSync(file.fullPath).toString('base64');
            const blobRes = await githubFetch(
              `/repos/${owner}/${rawRepoName}/git/blobs`,
              session.accessToken,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: contentBase64,
                  encoding: 'base64',
                }),
              }
            );
            if (!blobRes.ok) {
              throw new Error(`Falha ao enviar arquivo: ${file.repoPath}`);
            }
            const blobJson = (await blobRes.json()) as { sha: string };
            return {
              path: file.repoPath,
              mode: '100644' as const,
              type: 'blob' as const,
              sha: blobJson.sha,
            };
          })
        );
        treeEntries.push(...batchResults);
      }

      const treeRes = await githubFetch(
        `/repos/${owner}/${rawRepoName}/git/trees`,
        session.accessToken,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tree: treeEntries,
          }),
        }
      );
      if (!treeRes.ok) {
        res.status(502).json({ error: 'Falha ao criar árvore de arquivos no GitHub.' });
        return;
      }
      const treeJson = (await treeRes.json()) as { sha: string };

      const commitRes = await githubFetch(
        `/repos/${owner}/${rawRepoName}/git/commits`,
        session.accessToken,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: rawCommitMsg,
            tree: treeJson.sha,
            parents: [parentSha],
          }),
        }
      );
      if (!commitRes.ok) {
        res.status(502).json({ error: 'Falha ao criar commit no GitHub.' });
        return;
      }
      const commitJson = (await commitRes.json()) as { sha: string };

      const updateRefRes = await githubFetch(
        `/repos/${owner}/${rawRepoName}/git/refs/heads/${encodeURIComponent(defaultBranch)}`,
        session.accessToken,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sha: commitJson.sha,
            force: true,
          }),
        }
      );
      if (!updateRefRes.ok) {
        res.status(502).json({ error: 'Falha ao atualizar a branch principal no GitHub.' });
        return;
      }

      res.json({
        ok: true,
        repoUrl: repoHtmlUrl,
        branch: defaultBranch,
        commitSha: commitJson.sha,
        filesCount: treeEntries.length,
      });
    } catch {
      res.status(500).json({ error: 'Erro ao enviar os arquivos para o GitHub.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();

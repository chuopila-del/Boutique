import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  FolderGit2,
  GitBranch,
  Github,
  Loader2,
  LogOut,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';

interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

interface GitHubRepo {
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
}

interface GitHubStatusResponse {
  configured: boolean;
  callbackUrl: string;
  appUrl: string;
}

interface GitHubIntegrationViewProps {
  onGoHome: () => void;
}

export function GitHubIntegrationView({ onGoHome }: GitHubIntegrationViewProps) {
  const [statusLoading, setStatusLoading] = useState(true);
  const [status, setStatus] = useState<GitHubStatusResponse | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);

  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [repoName, setRepoName] = useState('joias-semi-boutique');
  const [selectedExistingRepo, setSelectedExistingRepo] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [commitMessage, setCommitMessage] = useState('Publicar catálogo Joias Semi Boutique');

  const [connecting, setConnecting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pushSuccess, setPushSuccess] = useState<{
    repoUrl: string;
    branch: string;
    filesCount: number;
  } | null>(null);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/github/status');
      if (res.ok) {
        const data = (await res.json()) as GitHubStatusResponse;
        setStatus(data);
      }
    } catch {
      setErrorMsg('Não foi possível verificar o estado do servidor GitHub.');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const loadRepositories = useCallback(async (token: string) => {
    setReposLoading(true);
    try {
      const res = await fetch('/api/github/repos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Falha ao listar repositórios');
      }
      const data = (await res.json()) as { user: GitHubUser; repos: GitHubRepo[] };
      setUser(data.user);
      setRepos(data.repos);
      if (data.repos.length > 0) {
        setSelectedExistingRepo((prev) => prev || data.repos[0].name);
      }
    } catch {
      setErrorMsg('Não foi possível carregar os seus repositórios do GitHub.');
    } finally {
      setReposLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      const data = event.data as { type?: string; exchangeCode?: string; error?: string } | null;
      if (!data || typeof data !== 'object') {
        return;
      }
      if (data.type === 'GITHUB_OAUTH_ERROR') {
        setConnecting(false);
        setErrorMsg(data.error || 'Autenticação com o GitHub cancelada.');
        return;
      }
      if (data.type === 'OAUTH_AUTH_SUCCESS' && typeof data.exchangeCode === 'string') {
        void (async () => {
          try {
            const res = await fetch('/api/auth/github/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ exchangeCode: data.exchangeCode }),
            });
            const body = (await res.json()) as {
              sessionToken?: string;
              user?: GitHubUser;
              error?: string;
            };
            if (!res.ok || !body.sessionToken || !body.user) {
              throw new Error(body.error || 'Sessão inválida');
            }
            setSessionToken(body.sessionToken);
            setUser(body.user);
            setErrorMsg(null);
            await loadRepositories(body.sessionToken);
          } catch (err) {
            setErrorMsg(
              err instanceof Error ? err.message : 'Erro ao concluir ligação ao GitHub.'
            );
          } finally {
            setConnecting(false);
          }
        })();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadRepositories]);

  const handleConnectGitHub = async () => {
    setErrorMsg(null);
    setPushSuccess(null);
    setConnecting(true);
    try {
      const res = await fetch('/api/auth/github/url');
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setConnecting(false);
        setErrorMsg(
          data.error ||
            'Configure GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET antes de ligar ao GitHub.'
        );
        return;
      }

      const authWindow = window.open(
        data.url,
        'github_oauth_popup',
        'width=620,height=720'
      );
      if (!authWindow) {
        setConnecting(false);
        setErrorMsg(
          'O navegador bloqueou a janela de login do GitHub. Permita pop-ups para este site e tente novamente.'
        );
      }
    } catch {
      setConnecting(false);
      setErrorMsg('Erro ao iniciar a ligação com o GitHub.');
    }
  };

  const handleDisconnect = async () => {
    if (sessionToken) {
      try {
        await fetch('/api/auth/github/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    setSessionToken(null);
    setUser(null);
    setRepos([]);
    setPushSuccess(null);
    setErrorMsg(null);
  };

  const handlePushToGitHub = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionToken) return;
    setErrorMsg(null);
    setPushSuccess(null);

    const targetRepo = mode === 'new' ? repoName.trim() : selectedExistingRepo.trim();
    if (!/^[a-zA-Z0-9._-]{1,100}$/.test(targetRepo)) {
      setErrorMsg(
        'Nome do repositório inválido. Use apenas letras, números, ponto, hífen ou underscore.'
      );
      return;
    }

    setPushing(true);
    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          repoName: targetRepo,
          createNew: mode === 'new',
          isPrivate,
          commitMessage: commitMessage.trim() || 'Publicar catálogo Joias Semi Boutique',
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        repoUrl?: string;
        branch?: string;
        filesCount?: number;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.repoUrl) {
        throw new Error(data.error || 'Falha ao publicar no GitHub.');
      }
      setPushSuccess({
        repoUrl: data.repoUrl,
        branch: data.branch || 'main',
        filesCount: data.filesCount ?? 0,
      });
      await loadRepositories(sessionToken);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar projeto para o GitHub.');
    } finally {
      setPushing(false);
    }
  };

  const handleCopyCallback = async () => {
    if (!status?.callbackUrl) return;
    try {
      await navigator.clipboard.writeText(status.callbackUrl);
      setCopiedCallback(true);
      window.setTimeout(() => setCopiedCallback(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  return (
    <main className="mx-auto min-h-[72vh] max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onGoHome}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#D6B876]/35 bg-[#161419] px-4 py-2 text-sm font-semibold text-[#F5F2EC] transition-colors hover:border-[#D6B876] hover:bg-[#D6B876] hover:text-[#0D0C0F]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para a boutique</span>
        </button>

        <a
          href="#baixar"
          className="text-xs font-medium text-[#D6B876] underline-offset-4 hover:underline"
        >
          Ver também downloads ZIP
        </a>
      </div>

      <div className="border-b border-[#D6B876]/15 pb-6">
        <div className="flex items-center gap-2.5 text-sm font-medium text-[#D6B876]">
          <Github className="h-4 w-4" />
          <span>Integração Oficial GitHub</span>
        </div>
        <h1 className="font-display mt-1 text-3xl font-bold text-[#F5F2EC] sm:text-4xl">
          Publicar Projeto no GitHub
        </h1>
        <p className="mt-2 text-sm text-[#B8B0A4]">
          Conecte a sua conta GitHub por OAuth e envie todo o código-fonte e todas as imagens
          do catálogo directamente para um repositório seu.
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200"
        >
          {errorMsg}
        </div>
      )}

      {pushSuccess && (
        <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-5">
          <div className="flex items-start gap-3">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div className="flex-1">
              <h2 className="text-base font-semibold text-[#F5F2EC]">
                Projeto enviado com sucesso para o GitHub!
              </h2>
              <p className="mt-1 text-xs text-[#D8D0C5]">
                {pushSuccess.filesCount} ficheiros publicados na branch{' '}
                <span className="font-semibold text-[#E8CFA0]">{pushSuccess.branch}</span>.
              </p>
              <a
                href={pushSuccess.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#D6B876] px-4 py-2 text-xs font-semibold text-[#0D0C0F] hover:bg-[#E8CFA0]"
              >
                <span>Abrir repositório no GitHub</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {statusLoading ? (
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-[#D6B876]/15 bg-[#161419] p-6 text-sm text-[#B8B0A4]">
          <Loader2 className="h-4 w-4 animate-spin text-[#D6B876]" />
          <span>A verificar configuração da integração GitHub...</span>
        </div>
      ) : !status?.configured ? (
        <div className="mt-6 space-y-5 rounded-xl border border-[#D6B876]/25 bg-[#161419] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#F5F2EC]">
                Configuração inicial da App OAuth no GitHub
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#B8B0A4]">
                Para ligar a sua conta com segurança, crie uma GitHub OAuth App e adicione as
                credenciais nos Secrets do ambiente.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadStatus()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#D6B876]/30 px-3 py-2 text-xs font-medium text-[#E8CFA0] hover:border-[#D6B876]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Actualizar</span>
            </button>
          </div>

          <ol className="space-y-3 text-xs leading-relaxed text-[#D8D0C5]">
            <li>
              1. Aceda a{' '}
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#E8CFA0] underline underline-offset-4"
              >
                github.com/settings/developers
              </a>{' '}
              → <strong>OAuth Apps</strong> → <strong>New OAuth App</strong>.
            </li>
            <li>
              2. Em <strong>Authorization callback URL</strong>, cole exactamente este endereço:
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#D6B876]/20 bg-[#0D0C0F] px-3 py-2">
                <code className="flex-1 overflow-x-auto text-[11px] text-[#E8CFA0]">
                  {status?.callbackUrl}
                </code>
                <button
                  type="button"
                  onClick={() => void handleCopyCallback()}
                  className="inline-flex shrink-0 items-center gap-1 rounded border border-[#D6B876]/30 px-2.5 py-1 text-[11px] font-medium text-[#F5F2EC] hover:border-[#D6B876]"
                >
                  {copiedCallback ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </li>
            <li>
              3. Nos <strong>Secrets</strong> do painel do AI Studio, defina{' '}
              <code className="text-[#E8CFA0]">GITHUB_CLIENT_ID</code> e{' '}
              <code className="text-[#E8CFA0]">GITHUB_CLIENT_SECRET</code> e clique em{' '}
              <strong>Actualizar</strong> acima.
            </li>
          </ol>
        </div>
      ) : !user || !sessionToken ? (
        <div className="mt-6 rounded-xl border border-[#D6B876]/20 bg-[#161419] p-6">
          <h2 className="text-lg font-semibold text-[#F5F2EC]">Ligar conta GitHub</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#B8B0A4]">
            Ao autorizar via OAuth oficial do GitHub, poderá criar um repositório novo ou enviar
            os ficheiros do projecto para um repositório existente.
          </p>
          <button
            type="button"
            disabled={connecting}
            onClick={() => void handleConnectGitHub()}
            className="mt-5 inline-flex min-h-[44px] items-center gap-2.5 rounded-lg bg-[#D6B876] px-6 py-2.5 text-sm font-semibold text-[#0D0C0F] transition-colors hover:bg-[#E8CFA0] disabled:opacity-60"
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Github className="h-4 w-4" />
            )}
            <span>{connecting ? 'A aguardar autorização...' : 'Conectar com GitHub'}</span>
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#D6B876]/20 bg-[#161419] p-5">
            <div className="flex items-center gap-3.5">
              <img
                src={user.avatar_url}
                alt={user.login}
                referrerPolicy="no-referrer"
                className="h-11 w-11 rounded-full border border-[#D6B876]/40 object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-[#F5F2EC]">
                  {user.name || user.login}
                </p>
                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#D6B876] hover:underline"
                >
                  @{user.login}
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleDisconnect()}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[#D6B876]/30 px-3.5 py-1.5 text-xs font-medium text-[#B8B0A4] hover:border-[#D6B876] hover:text-[#F5F2EC]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Desconectar</span>
            </button>
          </div>

          <form
            onSubmit={(e) => void handlePushToGitHub(e)}
            className="space-y-5 rounded-xl border border-[#D6B876]/20 bg-[#161419] p-6"
          >
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                  mode === 'new'
                    ? 'bg-[#D6B876] text-[#0D0C0F]'
                    : 'border border-[#D6B876]/25 bg-[#0D0C0F] text-[#B8B0A4] hover:text-[#F5F2EC]'
                }`}
              >
                <FolderGit2 className="h-4 w-4" />
                <span>Criar novo repositório</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                  mode === 'existing'
                    ? 'bg-[#D6B876] text-[#0D0C0F]'
                    : 'border border-[#D6B876]/25 bg-[#0D0C0F] text-[#B8B0A4] hover:text-[#F5F2EC]'
                }`}
              >
                <GitBranch className="h-4 w-4" />
                <span>Repositório existente</span>
              </button>
            </div>

            {mode === 'new' ? (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="gh-repo-name"
                    className="block text-xs font-medium text-[#E8CFA0]"
                  >
                    Nome do novo repositório
                  </label>
                  <input
                    id="gh-repo-name"
                    type="text"
                    required
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="joias-semi-boutique"
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#D6B876]/25 bg-[#0D0C0F] px-3.5 text-sm text-[#F5F2EC] focus:border-[#D6B876] focus:outline-none"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-2.5 text-xs text-[#D8D0C5]">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="h-4 w-4 accent-[#D6B876]"
                  />
                  <span>Criar repositório privado</span>
                </label>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="gh-existing-repo"
                    className="block text-xs font-medium text-[#E8CFA0]"
                  >
                    Seleccione o repositório
                  </label>
                  <button
                    type="button"
                    disabled={reposLoading}
                    onClick={() => void loadRepositories(sessionToken)}
                    className="inline-flex items-center gap-1 text-[11px] text-[#D6B876] hover:underline"
                  >
                    <RefreshCw className={`h-3 w-3 ${reposLoading ? 'animate-spin' : ''}`} />
                    <span>Actualizar lista</span>
                  </button>
                </div>

                <select
                  id="gh-existing-repo"
                  value={selectedExistingRepo}
                  onChange={(e) => setSelectedExistingRepo(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-[#D6B876]/25 bg-[#0D0C0F] px-3.5 text-sm text-[#F5F2EC] focus:border-[#D6B876] focus:outline-none"
                >
                  {repos.length === 0 ? (
                    <option value="">Nenhum repositório encontrado</option>
                  ) : (
                    repos.map((repo) => (
                      <option key={repo.fullName} value={repo.name}>
                        {repo.fullName} ({repo.private ? 'Privado' : 'Público'} · {repo.defaultBranch})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor="gh-commit-msg"
                className="block text-xs font-medium text-[#E8CFA0]"
              >
                Mensagem do commit
              </label>
              <input
                id="gh-commit-msg"
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-[#D6B876]/25 bg-[#0D0C0F] px-3.5 text-sm text-[#F5F2EC] focus:border-[#D6B876] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={pushing || (mode === 'existing' && !selectedExistingRepo)}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#D6B876] px-6 py-3 text-sm font-semibold text-[#0D0C0F] transition-colors hover:bg-[#E8CFA0] disabled:opacity-60"
            >
              {pushing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>A enviar ficheiros e imagens para o GitHub...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Enviar projeto para o GitHub</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

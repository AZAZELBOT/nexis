import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Copy,
  Plus,
  RefreshCcw,
  RotateCcw,
  ShieldBan,
  ShieldCheck,
} from "lucide-react";

import { controlApi, extractErrorMessage } from "@/lib/api";
import { formatDateTime, shortId } from "@/lib/format";
import type {
  ControlMetricsResponse,
  MintTokenResponse,
  ProjectKeyPublicRecord,
  ProjectRecord,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_SCOPE = "token:mint";

export function ControlPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [keysByProject, setKeysByProject] = useState<
    Record<string, ProjectKeyPublicRecord[]>
  >({});
  const [metrics, setMetrics] = useState<ControlMetricsResponse | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [keyName, setKeyName] = useState("default");
  const [keyScopes, setKeyScopes] = useState(DEFAULT_SCOPE);
  const [tokenKeyId, setTokenKeyId] = useState("");
  const [tokenTtl, setTokenTtl] = useState(3600);
  const [tokenAudience, setTokenAudience] = useState("");
  const [mintedToken, setMintedToken] = useState("");
  const [output, setOutput] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedKeys = keysByProject[selectedProjectId] ?? [];
  const activeKeys = selectedKeys.filter((key) => !key.revoked_at);

  const refreshControlData = useCallback(async () => {
    const [projectList, controlMetrics] = await Promise.all([
      controlApi<ProjectRecord[]>("/projects"),
      controlApi<ControlMetricsResponse>("/metrics"),
    ]);

    const keyEntries = await Promise.all(
      projectList.map(async (project) => {
        const keys = await controlApi<ProjectKeyPublicRecord[]>(
          `/projects/${project.id}/keys`,
        );
        return [project.id, keys] as const;
      }),
    );
    const nextKeys: Record<string, ProjectKeyPublicRecord[]> = {};
    for (const [projectId, keys] of keyEntries) {
      nextKeys[projectId] = keys;
    }

    setProjects(projectList);
    setKeysByProject(nextKeys);
    setMetrics(controlMetrics);
    setSelectedProjectId((current) => {
      if (current && projectList.some((project) => project.id === current)) {
        return current;
      }
      return projectList[0]?.id ?? "";
    });
  }, []);

  const runAction = useCallback(async (work: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (requestError) {
      setError(extractErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void runAction(refreshControlData);
  }, [refreshControlData, runAction]);

  useEffect(() => {
    const key = activeKeys[0];
    if (!key) {
      setTokenKeyId("");
      return;
    }
    setTokenKeyId((current) => {
      if (current && activeKeys.some((entry) => entry.id === current)) {
        return current;
      }
      return key.id;
    });
  }, [activeKeys]);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = projectName.trim();
    if (!trimmedName) {
      setError("Project name is required.");
      return;
    }

    await runAction(async () => {
      const payload = await controlApi<ProjectRecord>("/projects", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
      });
      setProjectName("");
      setOutput(payload);
      await refreshControlData();
      setSelectedProjectId(payload.id);
    });
  }

  async function createKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProjectId) {
      setError("Select a project before creating a key.");
      return;
    }
    await runAction(async () => {
      const scopes = [
        ...new Set(
          keyScopes
            .split(",")
            .map((scope) => scope.trim())
            .filter(Boolean),
        ),
      ];
      if (scopes.length === 0) {
        scopes.push(DEFAULT_SCOPE);
      }

      const payload = await controlApi<ProjectKeyPublicRecord>(
        `/projects/${selectedProjectId}/keys`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            name: keyName.trim() || "default",
            scopes,
          }),
        },
      );
      setTokenKeyId(payload.id);
      setOutput(payload);
      await refreshControlData();
    });
  }

  async function mintToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProjectId || !tokenKeyId) {
      setError("Select project and key before minting.");
      return;
    }
    await runAction(async () => {
      const payload = await controlApi<MintTokenResponse>("/tokens", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          project_id: selectedProjectId,
          key_id: tokenKeyId,
          ttl_seconds: tokenTtl,
          audience: tokenAudience.trim() || undefined,
        }),
      });
      setMintedToken(payload.token);
      setOutput(payload);
      await refreshControlData();
    });
  }

  async function rotateKey(keyId: string) {
    if (!selectedProjectId) {
      return;
    }
    await runAction(async () => {
      const payload = await controlApi<ProjectKeyPublicRecord>(
        `/projects/${selectedProjectId}/keys/${keyId}/rotate`,
        {
          method: "POST",
        },
      );
      setTokenKeyId(payload.id);
      setOutput(payload);
      await refreshControlData();
    });
  }

  async function revokeKey(keyId: string) {
    if (!selectedProjectId) {
      return;
    }
    await runAction(async () => {
      const payload = await controlApi<ProjectKeyPublicRecord>(
        `/projects/${selectedProjectId}/keys/${keyId}/revoke`,
        {
          method: "POST",
        },
      );
      setOutput(payload);
      await refreshControlData();
    });
  }

  async function copyToken() {
    if (!mintedToken) {
      return;
    }
    await navigator.clipboard.writeText(mintedToken);
  }

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  return (
    <div className="grid gap-4 px-4 py-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-6 lg:px-6 lg:py-6">
      <div className="space-y-4">
        <Card className="border-border/80 bg-card/85">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Projects</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void runAction(refreshControlData)}
            >
              <RefreshCcw
                className={
                  busy ? "mr-1 size-3.5 animate-spin" : "mr-1 size-3.5"
                }
              />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No project yet.</p>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    project.id === selectedProjectId
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <p className="font-medium text-foreground">{project.name}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {project.id}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/85">
          <CardHeader>
            <CardTitle className="text-base">Create Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={createProject}>
              <div className="space-y-1.5">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="production-eu"
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                <Plus className="mr-1 size-4" />
                Create project
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="border-border/80 bg-card/85">
          <CardHeader>
            <CardTitle className="text-base">
              Key Management{" "}
              {selectedProject ? `- ${selectedProject.name}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
              onSubmit={createKey}
            >
              <div className="space-y-1.5">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  value={keyName}
                  onChange={(event) => setKeyName(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="keyScopes">Scopes</Label>
                <Input
                  id="keyScopes"
                  value={keyScopes}
                  onChange={(event) => setKeyScopes(event.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={busy || !selectedProjectId}
                >
                  <Plus className="mr-1 size-4" />
                  Add key
                </Button>
              </div>
            </form>

            {selectedKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No key for this project.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedKeys.map((key) => (
                  <div
                    key={key.id}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">
                        {key.name}
                      </p>
                      {key.revoked_at ? (
                        <Badge variant="destructive">Revoked</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {key.id}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {key.scopes.map((scope) => (
                        <Badge key={`${key.id}-${scope}`} variant="outline">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Created {formatDateTime(key.created_at)}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Boolean(key.revoked_at) || busy}
                        onClick={() => void rotateKey(key.id)}
                      >
                        <RotateCcw className="mr-1 size-3.5" />
                        Rotate
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={Boolean(key.revoked_at) || busy}
                        onClick={() => void revokeKey(key.id)}
                      >
                        <ShieldBan className="mr-1 size-3.5" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/80 bg-card/85">
            <CardHeader>
              <CardTitle className="text-base">Token Studio</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={mintToken}>
                <div className="space-y-1.5">
                  <Label htmlFor="tokenKey">Key</Label>
                  <Select
                    value={tokenKeyId || undefined}
                    onValueChange={setTokenKeyId}
                  >
                    <SelectTrigger id="tokenKey">
                      <SelectValue placeholder="Select key" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeKeys.map((key) => (
                        <SelectItem key={key.id} value={key.id}>
                          {key.name} ({shortId(key.id)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tokenTtl">TTL seconds</Label>
                  <Input
                    id="tokenTtl"
                    type="number"
                    min={30}
                    max={86400}
                    value={tokenTtl}
                    onChange={(event) =>
                      setTokenTtl(Number(event.target.value) || 3600)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tokenAudience">Audience</Label>
                  <Input
                    id="tokenAudience"
                    placeholder="ws://localhost:4000"
                    value={tokenAudience}
                    onChange={(event) => setTokenAudience(event.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={busy || !selectedProjectId || !tokenKeyId}
                >
                  <ShieldCheck className="mr-1 size-4" />
                  Mint token
                </Button>
              </form>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Last token</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void copyToken()}
                  >
                    <Copy className="mr-1 size-3.5" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={mintedToken}
                  readOnly
                  placeholder="Minted token appears here"
                  className="min-h-[110px] font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/85">
            <CardHeader>
              <CardTitle className="text-base">Control Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="rounded-md bg-muted px-3 py-2">
                Requests:{" "}
                <span className="font-mono">
                  {metrics?.counters.requests_total ?? 0}
                </span>
              </div>
              <div className="rounded-md bg-muted px-3 py-2">
                Projects created:{" "}
                <span className="font-mono">
                  {metrics?.counters.projects_created ?? 0}
                </span>
              </div>
              <div className="rounded-md bg-muted px-3 py-2">
                Keys created:{" "}
                <span className="font-mono">
                  {metrics?.counters.keys_created ?? 0}
                </span>
              </div>
              <div className="rounded-md bg-muted px-3 py-2">
                Tokens minted:{" "}
                <span className="font-mono">
                  {metrics?.counters.tokens_minted ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <Card className="border-border/80 bg-card/85">
          <CardHeader>
            <CardTitle className="text-base">Latest API Output</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[320px] overflow-auto rounded-lg border border-border bg-slate-950 p-3 font-mono text-xs text-emerald-200">
              {output ? JSON.stringify(output, null, 2) : "No output yet."}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

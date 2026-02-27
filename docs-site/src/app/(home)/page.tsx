import Link from "next/link";

const quickLinks = [
  {
    title: "Quickstart",
    href: "/docs/getting-started/quickstart",
    description: "Run the stack, mint a token, join your first room.",
  },
  {
    title: "TypeScript SDK",
    href: "/docs/sdks/typescript",
    description: "Client API, room lifecycle, events, and patch handling.",
  },
  {
    title: "Protocol",
    href: "/docs/api-reference/protocol",
    description: "Envelope format, handshake, state sync, and RPC flow.",
  },
];

const pillars = [
  {
    title: "Rust Data Plane",
    description:
      "Authoritative rooms, low-latency gameplay traffic, RPC, matchmaking, and state sync.",
  },
  {
    title: "Control Plane",
    description:
      "Project, key, and token lifecycle with operational endpoints and hosted-ready workflows.",
  },
  {
    title: "Client SDKs",
    description:
      "Engine-agnostic integration layer for realtime clients, events, and deterministic state updates.",
  },
];

const path = [
  {
    step: "01",
    title: "Boot the Stack",
    href: "/docs/getting-started/quickstart",
    description: "Start local services and verify connectivity.",
  },
  {
    step: "02",
    title: "Connect a Client",
    href: "/docs/getting-started/connect-client",
    description: "Handshake, auth, room join, and first messages.",
  },
  {
    step: "03",
    title: "Ship Room Logic",
    href: "/docs/tutorials/custom-room-plugin",
    description:
      "Implement authoritative behavior with plugin-based room types.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12 md:py-16">
      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-fd-primary/15 via-fd-card to-fd-card p-8 md:p-10">
        <p className="inline-flex rounded-full border bg-fd-background/80 px-3 py-1 text-xs font-medium text-fd-muted-foreground">
          Multiplayer Backend Documentation
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
          Build Realtime Games With NEXIS
        </h1>
        <p className="mt-4 max-w-3xl text-base text-fd-muted-foreground md:text-lg">
          NEXIS is an open-source, engine-agnostic multiplayer backend: Rust
          data plane for gameplay traffic, control plane for identity and
          operations, plus SDKs for fast client integration.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/docs/getting-started/quickstart"
            className="rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground"
          >
            Start With Quickstart
          </Link>
          <Link
            href="/docs"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            Browse Docs
          </Link>
          <Link
            href="https://github.com/TriForMine/nexis"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            GitHub
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {pillars.map((item) => (
          <article
            key={item.title}
            className="rounded-xl border bg-fd-card p-5"
          >
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-fd-muted-foreground">
              {item.description}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border bg-fd-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          Recommended Path
        </h2>
        <p className="mt-2 text-sm text-fd-muted-foreground">
          From first connection to production room logic.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {path.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border bg-fd-background p-5 transition-colors hover:bg-fd-accent/40"
            >
              <p className="text-xs font-semibold tracking-wider text-fd-muted-foreground">
                {item.step}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-fd-muted-foreground">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">
          Explore the Docs
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border bg-fd-card p-5 transition-colors hover:bg-fd-accent/40"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-fd-muted-foreground">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

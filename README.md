<div align="center">
  <strong>source‑agents</strong>
  <br />
  <em>Keep AGENTS.md and CLAUDE.md clean, consistent, and sourcing correctly.</em>

  <br /><br />
  <em>
    Scan projects • Fix sourcing • Convert symlinks • Dry‑run preview
  </em>
</div>

## Quick Start

Requirements: Node 18+, Bun 1.1+.

Clone the repo:
```
git clone https://github.com/iannuttall/source-agents.git
```

Enter the folder:
```
cd source-agents
```

Install dependencies:
```
bun install
```

Run interactively on a specific folder (recommended):
```
bun run dev --root ~/projects
```

Auto‑fix recommended actions:
```
bun run dev --root ~/projects --auto
```

Preview without making changes:
```
bun run dev --root ~/projects --dry-run
```

Exclude extra directories (in addition to node_modules, .git, dist, etc.):
```
bun run dev --root ~/projects --exclude '**/temp/**' '**/backup/**'
```

## Global CLI (optional)

Build the CLI:
```
bun run build
```

Link globally:
```
npm link
```

Run from anywhere:
```
source-agents --help
```

Example run:
```
source-agents --root ~/projects --auto
```

## Development

Run the TUI in dev mode:
```
bun run dev
```

Type‑check:
```
bun run type-check
```

Build:
```
bun run build
```

## Keyboard & Tips
- ↑↓ to navigate, Enter to select, 's' to skip, Esc/← to go back, Ctrl+C to exit.
- Default root is your home directory; pass --root to limit scope.

## License

MIT

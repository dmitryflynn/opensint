<div align="center">

# 🛰 OpenSINT

**An open-source, self-hostable intelligence-gathering workbench.**

Unify domain, IP, email, username, and file/hash intelligence in one console — then map what you find onto a visual investigation graph. Free forever, MIT-licensed, no account required.

</div>

---

## Why

Professional OSINT platforms bundle a dozen lookups behind a paywall. OpenSINT is a free reimplementation of that workflow that you run yourself. Most modules work with **zero configuration** using public data sources; optional API keys unlock richer results.

> **Scope & ethics.** OpenSINT aggregates *publicly available* information and **defensive** breach signals — *which* breaches an identifier appears in, never plaintext passwords, cookies, or session data. Use it for security research, attack-surface assessment, and authorised investigations only. You are responsible for complying with each upstream provider's terms and with applicable law.

## Features

| Module | What it does | Works without a key? |
| --- | --- | --- |
| **Universal search** | Auto-detects the entity type of any input and routes it to the right module | ✅ |
| **Domain intelligence** | WHOIS registration, live DNS (A/AAAA/MX/NS/TXT/CNAME/SOA/CAA), TLS certificate, passive subdomains via Certificate Transparency | ✅ |
| **IP intelligence** | Geolocation, ASN/ISP ownership, abuse reputation, exposed ports & services | ✅ geo · 🔑 reputation/ports |
| **Email intelligence** | Gravatar profile + linked accounts, breach exposure | ✅ gravatar · 🔑 breaches |
| **Username search** | Enumerates a handle across 120+ platforms (social, dev, gaming, security, creative, commerce) | ✅ |
| **File & hash analysis** | Reputation across 70+ antivirus engines by MD5/SHA-1/SHA-256, or upload a file | 🔑 VirusTotal |
| **Password exposure** | k-anonymity check against billions of breached passwords (count only) | ✅ |
| **Investigation boards** | Pin entities from any module and link them into a saveable, shareable graph | ✅ |

`✅ = free/public source` · `🔑 = optional API key for full results`

## Quick start

```bash
git clone https://github.com/<you>/opensint.git
cd opensint
npm install          # installs root, server, and web dependencies
npm run dev          # API on :4000, UI on :5173 (hot reload)
```

Open **http://localhost:5173**.

### Production (single port)

```bash
npm run build        # builds the React app into web/dist
npm start            # Express serves the API + the built UI on :4000
```

Open **http://localhost:4000**.

## Configuration

Every module runs on free/public sources out of the box. To unlock the optional integrations, copy the example env file and add the keys you want:

```bash
cp .env.example .env
```

| Variable | Unlocks | Get a key |
| --- | --- | --- |
| `HIBP_API_KEY` | Email breach exposure | <https://haveibeenpwned.com/API/Key> |
| `VIRUSTOTAL_API_KEY` | File & hash reputation | <https://www.virustotal.com/gui/my-apikey> |
| `ABUSEIPDB_API_KEY` | IP abuse reputation | <https://www.abuseipdb.com/account/api> |
| `SHODAN_API_KEY` | IP open ports & services | <https://account.shodan.io/> |
| `IPINFO_TOKEN` | Richer IP geolocation | <https://ipinfo.io/account/token> |

Restart the server after editing `.env`. The sidebar shows which integrations are live.

## Architecture

```
opensint/
├── server/                 Node + Express API (ES modules, dependency-light)
│   ├── index.js            App bootstrap; serves web/dist in production
│   ├── routes.js           REST endpoints, one per module
│   ├── config.js           Env + integration status
│   └── services/           One file per data source
│       ├── detect.js         identifier type detection
│       ├── dns.js  whois.js  ssl.js  subdomains.js
│       ├── ipinfo.js         geo + AbuseIPDB + Shodan
│       ├── email.js breach.js  gravatar + HIBP + Pwned Passwords
│       ├── username.js       multi-platform enumeration
│       ├── virustotal.js     file/hash reputation
│       └── store.js          flat-file investigation persistence
└── web/                    React + Vite single-page app
    └── src/pages/          Dashboard, per-module pages, graph board
```

- **No database.** Investigation boards persist to a single JSON file (`server/data/`), so self-hosting is trivial.
- **Graceful degradation.** Every service isolates its own failures — a dead upstream never takes down a whole lookup, and missing keys return a helpful note instead of an error.
- **Timeouts everywhere.** No slow provider can hang a request.

## API

All endpoints live under `/api` and return `{ ok, data }` or `{ ok: false, error }`.

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/api/detect?q=` | Identify an entity type |
| `GET` | `/api/domain?domain=` | Full domain report (or `/dns`, `/whois`, `/ssl`, `/subdomains`) |
| `GET` | `/api/ip?ip=` | IP intelligence |
| `GET` | `/api/email?email=` | Email intelligence |
| `GET` | `/api/username?username=` | Username enumeration |
| `GET` | `/api/hash?hash=` | Hash reputation |
| `POST` | `/api/file/scan` | Raw file body → VirusTotal |
| `POST` | `/api/password/check` | k-anonymity password exposure |
| `GET/POST/DELETE` | `/api/investigations` | CRUD for boards |

## Tech

Node 18+ · Express · React 18 · React Router · Vite. No paid services, no telemetry.

## Contributing

Issues and PRs welcome — new username platforms, additional data sources, and UI polish are all great first contributions. Keep additions to **public/defensive** sources in line with the project's scope.

## License

[MIT](LICENSE). Not affiliated with any commercial OSINT provider.

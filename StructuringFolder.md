### Architecture Overview: Feature-Driven Folder Structure

This architecture replaces type-based root folders (e.g., placing all components, actions, or schemas in global directories) with a **Feature-Driven Architecture** governed by **strict, one-way dependency boundaries**.

---

### 1. Three-Tier Structural Hierarchy

```text
src/
├── app/                  # Application Layer (Routing / Composition)
│   ├── dashboard/
│   │   └── products/
│   │       └── page.tsx  # Pure orchestrator: glues features together
│   └── globals.css
│
├── features/             # Feature Modules (Domain Encapsulation)
│   ├── products/
│   │   ├── components/   # Scoped exclusively to products
│   │   ├── schemas/      # Product validation schemas
│   │   └── server/       # DB queries, actions, mutations for products
│   ├── users/
│   └── analytics/
│
└── [shared]/             # Global Shared Layer (Primitives / Infrastructure)
    ├── components/       # Universal UI primitives (Button, Modal, Navbar)
    ├── lib/              # Client configs, cache handlers, DB connections
    └── utils/            # Generic formatters, helpers

```

* **Application Layer (`app/`)**: Pure glue code. Defines routes and layouts. Renders components by importing from features and shared libraries. Contains **no** domain-specific business logic, internal models, or non-global UI components.
* **Feature Layer (`features/<feature_name>/`)**: Self-contained business domains (e.g., `products`, `users`, `subscriptions`). Each feature folder mirrors typical subfolders (`components/`, `server/`, `schemas/`, `permissions/`) but only for its own domain.
* **Shared Layer (Root shared folders)**: Domain-agnostic utilities, shared UI primitives (design system), base database clients, and formatters used universally.

---

### 2. Dependency Flow Rules (One-Way Data Flow)

Dependencies flow strictly downward. Modules may never establish circular or lateral dependencies.

| Layer | Can Import From | Cannot Import From |
| --- | --- | --- |
| **App** (`app/`) | `features/*`, `shared/*` | Itself (circularly) |
| **Feature** (`features/<A>/`) | `features/<A>` (internally), `shared/*` | **Other features** (`features/<B>`), `app/` |
| **Shared** (`shared/*`) | `shared/*` (internal primitives) | `features/*`, `app/` |
| **Never-Import** (e.g., `middleware.ts`, background tasks) | `features/*`, `shared/*` | Nothing may import from this module |

---

### 3. Boundary Enforcement via ESLint

Enforce these boundaries automatically using [`eslint-plugin-boundaries`](https://github.com/javierbrea/eslint-plugin-boundaries) to prevent architectural drift across teams:

1. **Tag File Elements**:
* Label root folders (`components`, `lib`, `utils`, `drizzle`) as `shared`.
* Label `features/*` as `feature`, capturing the feature folder name as `${file.featureName}`.
* Label `app/*` as `app`.
* Label files like `middleware.ts` as `never-import`.


2. **Rules Configuration**:
* Set default behavior to `disallow: true`.
* Explicitly allow:
* `shared` $\rightarrow$ `shared`
* `feature` $\rightarrow$ `shared`
* `feature` $\rightarrow$ `feature` **only where `${from.featureName} === ${target.featureName}**` (prevents cross-feature coupling).
* `app` $\rightarrow$ `features`, `shared`, and global CSS files.





---

### 4. Handling Cross-Feature Coupling

Monolithic files that bridge multiple domains (such as a global `permissions.ts` that checks user status, product count, and subscription limits simultaneously) violate these boundaries.

* **Pattern A (Dependency Injection / Parameter Flattening):** Rather than importing `features/subscriptions` directly into `features/products`, pass primitive evaluation inputs (e.g., `hasActiveSubscription: boolean` or `maxProducts: number`) directly into the permission function.
* **Pattern B (Colocation):** Move feature-scoped permissions into their respective feature directories (e.g., `features/products/permissions.ts`), keeping validation localized to the domain that owns it.
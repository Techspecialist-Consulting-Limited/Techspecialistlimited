@AGENTS.md
## 4. Elite UI Engineering Skills (Native Enforcement)
- **The "Bento Grid" Skill**: When asked to build dashboards or data displays, defaults to a dynamic asymmetrical Bento Grid layout using Tailwind `grid grid-cols-1 md:grid-cols-3 gap-6`.
- **The "Micro-Interaction" Skill**: Every interactive element (buttons, cards, inputs) must have explicit hover, focus-visible, active, and disabled states. Use smooth transitions: `transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md`.
- **The "Glassmorphism" Skill**: For floating cards, overlays, and sidebars, apply premium dark/light mode glass effects: `bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-white/20 dark:border-zinc-800/50`.
- **The "Skeleton Loading" Skill**: While streaming data components, design a tailored pulsing Tailwind skeleton variant (`animate-pulse bg-zinc-200 dark:bg-zinc-800`) matching the exact layout dimensions of the final loaded state.


# Next.js & Tailwind CSS Elite Architecture Rules

## 1. Next.js App Router & React Core Rules
- **Server Components First**: All components are React Server Components (RSC) by default. Maximize async data prefetching directly within servers.
- **Client Boundaries**: Apply `"use client"` strictly at the absolute leaf nodes. Only use it for interaction, state (`useState`, `useReducer`), hooks (`useEffect`), or browser APIs.
- **Data Mutation**: Use Server Actions (`'use server'`) exclusively for data changes. Handle them with React's native form actions using `useActionState` and `useFormStatus`.
- **Loading & Streaming**: Always isolate heavy or dynamic client components inside React `<Suspense>` boundaries. Utilize Next.js `loading.tsx` to secure an LCP < 2.5s.

## 2. Tailwind CSS & UI Design Standards
- **Component Styling**: Write clean, utility-first Tailwind classes. Avoid creating arbitrary global CSS rules.
- **Design Tokens**: Restrict colors, spacing, and rounding to semantic design tokens. Use `theme('colors.primary')`, `gap-4`, `rounded-xl`, etc.
- **Responsiveness**: Always use mobile-first breakpoints (`sm:`, `md:`, `lg:`, `xl:`). Ensure flawless cross-device layout rendering.
- **Animations**: Implement premium micro-interactions using native Tailwind transitions (`transition-all duration-200 ease-in-out`), transforms, and state modifiers (`hover:`, `focus-visible:`, `active:`).
- **Class Organization**: Group Tailwind classes logically (Layout -> Flexbox/Grid -> Spacing -> Sizing -> Typography -> Visual/Colors -> Interactive/States).

## 3. Code Generation Workflow
- **Plan Mode**: For multi-file implementations or complex user interfaces, map out the layout architecture first before writing raw code.
- **Zero Placeholder Code**: Always write complete, production-ready, typed components. Never use comments like `// TODO: Implement later`.
- **No Extra Dependencies**: Leverage native Tailwind features and vanilla React hooks before suggesting external npm packages.

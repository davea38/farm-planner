# Operational Guide

## Project

- Project: farm-planner
- Language: TypeScript
- Framework: React 19 + Vite 7

## Commands

- Build: `npx tsc -b && npx vite build`
- Test: (no test framework yet)
- Lint: `npx eslint .`
- Dev: `npm run dev`

## Learnings

- `npm create vite@latest . -- --template react-ts` fails in non-empty dirs; use temp dir + copy instead.
- Node v24.13.0, npm 11.6.2 available.
- Vite boilerplate includes App.css, react.svg, vite.svg - remove them when cleaning up.

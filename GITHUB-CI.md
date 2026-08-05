# GitHub continuous integration

The workflow in `.github/workflows/ci.yml` runs automatically for pushes and
pull requests targeting `main`, `master`, or `develop`.

It checks:

- exact dependency installation;
- Prisma schema and migrations against PostgreSQL;
- linting and automated tests when configured;
- TypeScript correctness;
- the optimized Next.js production build.

## First upload

```powershell
git add .
git commit -m "Add automated CI checks"
git push
```

Open the repository on GitHub and select the **Actions** tab. A green check
means the project passed. Open any red result to see the exact failed step.

The database credentials in this workflow are temporary test values created
only inside GitHub's runner. Never add `.env`, `.env.local`, or `.env.docker`
to Git.

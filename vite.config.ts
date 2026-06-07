import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const pagesBase =
  process.env.GITHUB_PAGES === 'true' && repositoryName ? `/${repositoryName}/` : '/'

export default defineConfig({
  base: pagesBase,
  plugins: [react()],
})

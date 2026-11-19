import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const [repositoryOwner, repositoryName] = process.env.GITHUB_REPOSITORY?.split('/') ?? []
const isUserSite = repositoryName === `${repositoryOwner}.github.io`
const base =
  process.env.GITHUB_ACTIONS === 'true' && repositoryName && !isUserSite
    ? `/${repositoryName}/`
    : '/'

// Static hosts such as Netlify send .glb files uncompressed. Replace each
// built model.glb with a gzipped model.glb.gz (about a third of the size);
// the viewer unzips it in the browser (src/components/3d/gzipGLTFLoader.js).
const gzipModels = () => ({
  name: 'gzip-models',
  apply: 'build',
  writeBundle({ dir }) {
    const models = join(dir, 'models')
    for (const file of readdirSync(models, { recursive: true })) {
      if (!file.endsWith('.glb')) continue
      const path = join(models, file)
      writeFileSync(`${path}.gz`, gzipSync(readFileSync(path), { level: 9 }))
      rmSync(path)
    }
  },
})

export default defineConfig({
  plugins: [react(), gzipModels()],
  base,
})

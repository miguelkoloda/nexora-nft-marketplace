import { preview } from 'vite'

const cleanupPlugin = {
  name: 'browser-test-preview-cleanup',
  configurePreviewServer(server) {
    server.middlewares.use('/__test/shutdown', (_request, response) => {
      response.statusCode = 200
      response.end('Preview server stopped')
      setTimeout(() => {
        void server.close()
      }, 25)
    })
  },
}

await preview({
  configFile: false,
  root: process.cwd(),
  plugins: [cleanupPlugin],
  preview: {
    host: '127.0.0.1',
    port: 5187,
    strictPort: true,
  },
})

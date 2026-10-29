const adminHeaders = { 'X-Demo-Admin': 'local-demo-only-token' }

export default async function globalTeardown() {
  await fetch('http://127.0.0.1:5188/__demo/shutdown', {
    method: 'POST',
    headers: adminHeaders,
  }).catch(() => undefined)

  await fetch('http://127.0.0.1:5187/__test/shutdown').catch(() => undefined)
}

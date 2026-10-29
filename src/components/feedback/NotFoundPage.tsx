import { Link } from '@tanstack/react-router'

export function NotFoundPage() {
  return (
    <section className="not-found page-wrap">
      <span className="eyebrow">ERRO 404</span>
      <h1>Esta peça não está por aqui.</h1>
      <p>Volte ao mercado para descobrir outras obras.</p>
      <Link className="button button-primary" to="/">
        Explorar o mercado
      </Link>
    </section>
  )
}

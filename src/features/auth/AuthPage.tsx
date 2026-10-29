import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowUpRight, Eye, EyeOff, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ApiError } from '../../api/client'
import { useLogin, useRegister } from '../../api/hooks'
import { HomePage } from '../catalog/HomePage'

const allowedReturnPaths = [
  '/',
  '/cart',
  '/checkout',
  '/account/profile',
  '/account/wallets',
] as const

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldErrors = Object.values(error.fields ?? {})
    return fieldErrors.length ? fieldErrors.join(' ') : error.message
  }
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação.'
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formError, setFormError] = useState('')
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { returnTo?: string }
  const loginMutation = useLogin()
  const registerMutation = useRegister()
  const register = mode === 'register'
  const pending = loginMutation.isPending || registerMutation.isPending
  const returnTo =
    allowedReturnPaths.find((path) => path === search.returnTo) ?? '/'

  async function finishAuthentication() {
    const nftMatch = search.returnTo?.match(/^\/nft\/([a-z0-9-]+)$/i)
    if (nftMatch) {
      await navigate({ to: '/nft/$nftId', params: { nftId: nftMatch[1] } })
      return
    }
    await navigate({ to: returnTo })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')

    if (register) {
      const username = String(data.get('username') ?? '').trim()
      const confirmation = String(data.get('confirmation') ?? '')
      if (password !== confirmation) {
        setFormError('As senhas não coincidem.')
        return
      }
      if (password.length < 8) {
        setFormError('Use ao menos 8 caracteres na senha.')
        return
      }
      try {
        await registerMutation.mutateAsync({
          username,
          displayName: username,
          email,
          password,
        })
        await finishAuthentication()
      } catch (error) {
        setFormError(errorMessage(error))
      }
      return
    }

    try {
      await loginMutation.mutateAsync({ email, password })
      await finishAuthentication()
    } catch (error) {
      setFormError(errorMessage(error))
    }
  }

  return (
    <div className="auth-overlay-page">
      <HomePage />
      <Dialog.Root
        open
        modal
        onOpenChange={(open) => {
          if (!open) void navigate({ to: '/' })
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="auth-backdrop" />
          <Dialog.Content className="auth-dialog">
            <section
              className={`auth-card ${register ? 'auth-register' : 'auth-login'}`}
            >
              <Dialog.Close asChild>
                <Link to="/" className="auth-close" aria-label="Fechar diálogo">
                  <X size={16} />
                </Link>
              </Dialog.Close>
              <nav className="auth-tabs" aria-label="Autenticação">
                <Link
                  to="/login"
                  search={{ returnTo: search.returnTo }}
                  className={!register ? 'is-active' : undefined}
                >
                  Entrar
                </Link>
                <span>|</span>
                <Link
                  to="/register"
                  search={{ returnTo: search.returnTo }}
                  className={register ? 'is-active' : undefined}
                >
                  Criar conta
                </Link>
              </nav>
              <Link to="/" className="wordmark">
                KURIO
              </Link>
              <Dialog.Title className="auth-title">
                {register ? 'Criar perfil de colecionador' : 'Entrar'}
              </Dialog.Title>
              <Dialog.Description className="auth-description">
                {register
                  ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
                  : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}
              </Dialog.Description>
              <form
                className="auth-form"
                onSubmit={(event) => void submit(event)}
              >
                {register ? (
                  <>
                    <label>
                      <span>Nome de usuário</span>
                      <Input
                        name="username"
                        placeholder="Nome de usuário"
                        autoComplete="username"
                        required
                      />
                    </label>
                    <label>
                      <span>E-mail</span>
                      <Input
                        name="email"
                        placeholder="Digite seu e-mail"
                        type="email"
                        autoComplete="email"
                        required
                      />
                    </label>
                    <label>
                      <span>Senha</span>
                      <div className="password-input">
                        <Input
                          name="password"
                          placeholder="Senha"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          minLength={8}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={
                            showPassword ? 'Ocultar senha' : 'Mostrar senha'
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={13} />
                          ) : (
                            <Eye size={13} />
                          )}
                        </button>
                      </div>
                    </label>
                    <label>
                      <span>Confirmar senha</span>
                      <div className="password-input">
                        <Input
                          name="confirmation"
                          placeholder="Confirmar senha"
                          type={showConfirmation ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmation((value) => !value)}
                          aria-label={
                            showConfirmation
                              ? 'Ocultar confirmação de senha'
                              : 'Mostrar confirmação de senha'
                          }
                        >
                          {showConfirmation ? (
                            <EyeOff size={13} />
                          ) : (
                            <Eye size={13} />
                          )}
                        </button>
                      </div>
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      <span>E-mail</span>
                      <Input
                        name="email"
                        placeholder="contato@email.com"
                        type="email"
                        autoComplete="email"
                        required
                      />
                    </label>
                    <label>
                      <span>Senha</span>
                      <div className="password-input">
                        <Input
                          name="password"
                          placeholder="••••••••••••"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={
                            showPassword ? 'Ocultar senha' : 'Mostrar senha'
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={13} />
                          ) : (
                            <Eye size={13} />
                          )}
                        </button>
                      </div>
                    </label>
                    <button
                      type="button"
                      className="forgot-password"
                      disabled
                      title="Recuperação de senha não está disponível nesta demonstração."
                    >
                      Esqueceu a senha?
                    </button>
                  </>
                )}
                <Button
                  type="submit"
                  className="auth-submit"
                  disabled={pending}
                >
                  {pending
                    ? 'Aguarde...'
                    : register
                      ? 'Criar perfil'
                      : 'Entrar'}
                </Button>
                {formError && (
                  <p className="auth-form-error" role="alert">
                    {formError}
                  </p>
                )}
              </form>
              <div className="auth-separator">
                <span />
                Ou continue com
                <span />
              </div>
              <div className="social-login-list">
                <button
                  className="social-login"
                  type="button"
                  disabled
                  title="Login social não está integrado nesta demonstração."
                >
                  <b className="google-mark">G</b>Continuar com Google
                </button>
                <button
                  className="social-login"
                  type="button"
                  disabled
                  title="Login social não está integrado nesta demonstração."
                >
                  <b className="facebook-mark">f</b>Continuar com Facebook
                </button>
              </div>
              <p className="auth-switch">
                {register ? 'Já tem uma conta?' : 'Novo na Kurio?'}{' '}
                <Link
                  to={register ? '/login' : '/register'}
                  search={{ returnTo: search.returnTo }}
                >
                  {register ? 'Entre' : 'Crie uma conta'}
                </Link>
              </p>
              <span className="auth-arrow" aria-hidden="true">
                <ArrowUpRight size={13} />
              </span>
            </section>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

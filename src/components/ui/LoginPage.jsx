import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, PanelLeft, User } from 'lucide-react'
import { rememberedUsername, rememberUsername, signIn } from '../../auth.js'
import { preloadModel } from '../3d/CatalogModelViewer.jsx'

export default function LoginPage({ home, firstModel }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState(rememberedUsername)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => Boolean(rememberedUsername()))
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)

  // Download the first model while the user signs in, so it opens at once.
  useEffect(() => { preloadModel(firstModel) }, [firstModel])

  const submit = (event) => {
    event.preventDefault()
    if (!signIn(username, password)) {
      setError('Incorrect username or password.')
      return
    }
    rememberUsername(remember ? username.trim() : '')
    navigate(home, { replace: true })
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit} noValidate>
        <header className="login-brand">
          <span className="workspace-brand-mark">◆</span>
          <span>Aviation 3D Explorer</span>
        </header>

        <div className="login-body">
          <div className="login-eyebrow">Workspace access</div>
          <h1>Sign in</h1>
          <p className="login-intro">Explore engine models, isolate sections with hotspots and drill into individual components.</p>

          <label className="login-label" htmlFor="login-username">Username</label>
          <div className="login-field">
            <User size={17} />
            <input
              id="login-username"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(event) => { setUsername(event.target.value); setError('') }}
              autoFocus={!username}
            />
          </div>

          <label className="login-label" htmlFor="login-password">Password</label>
          <div className="login-field">
            <Lock size={17} />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => { setPassword(event.target.value); setError('') }}
              autoFocus={Boolean(username)}
            />
            <button
              type="button"
              className="login-eye"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="login-row">
            <label className="login-remember">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              Remember me
            </label>
            <button type="button" className="login-forgot" onClick={() => setForgotOpen((value) => !value)}>
              Forgot password?
            </button>
          </div>

          {forgotOpen && <p className="login-note">Contact your workspace administrator to reset your password.</p>}
          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="login-submit">Sign in <ArrowRight size={17} /></button>
        </div>

        <footer className="login-footer">
          <span><PanelLeft size={13} /> AVIATION WORKSPACE</span>
          <span>v1.0</span>
        </footer>
      </form>
    </main>
  )
}

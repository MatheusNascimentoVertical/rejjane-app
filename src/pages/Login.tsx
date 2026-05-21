import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

const LOGO = '/bella-logo.jpeg';

function EnvIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export function Login() {
  const [email, setEmail]     = useState('');
  const [senha, setSenha]     = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [erro, setErro]         = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [shake, setShake]       = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetOk, setResetOk]   = useState(false);
  const [resetErro, setResetErro] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const emailOk = isValidEmail(email);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const entrar = async () => {
    setErro(''); setErroSenha('');
    if (!email) { setErro('Informe o e-mail'); triggerShake(); return; }
    if (!emailOk) { setErro('E-mail inválido'); triggerShake(); return; }
    if (!senha) { setErroSenha('Informe a senha'); triggerShake(); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch {
      setErroSenha('E-mail ou senha incorretos');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const abrirForgot = () => {
    setResetEmail(email);
    setResetOk(false);
    setResetErro('');
    setShowForgot(true);
  };

  const enviarReset = async () => {
    setResetErro('');
    if (!isValidEmail(resetEmail)) { setResetErro('E-mail inválido'); return; }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetOk(true);
    } catch {
      setResetErro('Não foi possível enviar. Verifique o e-mail.');
    } finally {
      setResetLoading(false);
    }
  };

  const flowers = [
    { className: 'login-float login-float-a', x: [0, 8, -5, 0], y: [0, -18, 10, 0], rotate: [0, 15, -8, 0] },
    { className: 'login-float login-float-b', x: [0, -10, 6, 0], y: [0, 12, -20, 0], rotate: [0, -20, 12, 0] },
    { className: 'login-float login-float-c', x: [0, 6, -8, 0], y: [0, -10, 16, 0], rotate: [0, 10, -18, 0] },
    { className: 'login-float login-float-d', x: [0, -8, 5, 0], y: [0, 14, -8, 0], rotate: [0, -12, 20, 0] },
  ];

  return (
    <div className="login-bg">
      {flowers.map((f, i) => (
        <motion.div
          key={i}
          className={f.className}
          animate={{ x: f.x, y: f.y, rotate: f.rotate }}
          transition={{ duration: 5 + i * 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          ✿
        </motion.div>
      ))}

      <motion.div
        className={`login-card${shake ? ' login-shake' : ''}`}
        ref={cardRef}
        initial={{ y: 48, scale: 0.94, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28, delay: 0.08 }}
      >
        <motion.div
          className="login-head"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
        >
          <div className="login-logo-wrap">
            <img src={LOGO} alt="Bella" className="login-logo" />
          </div>
          <div className="login-brand">Bella Personalizados</div>
          <div className="login-brand-sub">Sistema de Gestão</div>
        </motion.div>

        <motion.div
          className="login-sep"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.38, duration: 0.5, ease: 'easeOut' }}
        />

        <div className="login-body">
          <motion.div
            className="lf"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
          >
            <label className="lf-label">E-mail</label>
            <div className="lf-input-wrap">
              <span className="lf-icon"><EnvIcon /></span>
              <input
                className={`lf-input${erro ? ' lf-error' : emailOk && email ? ' lf-ok' : ''}`}
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErro(''); }}
                placeholder="seu@email.com"
                autoComplete="email"
                onKeyDown={e => e.key === 'Enter' && entrar()}
              />
              <AnimatePresence>
                {emailOk && email && (
                  <motion.span
                    className="lf-check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <CheckIcon />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {erro && (
                <motion.div
                  className="lf-msg"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {erro}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="lf"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52 }}
          >
            <label className="lf-label">Senha</label>
            <div className="lf-input-wrap">
              <span className="lf-icon"><LockIcon /></span>
              <input
                className={`lf-input${erroSenha ? ' lf-error' : ''}`}
                type={showPass ? 'text' : 'password'}
                value={senha}
                onChange={e => { setSenha(e.target.value); setErroSenha(''); }}
                placeholder="••••••••"
                autoComplete="current-password"
                onKeyDown={e => e.key === 'Enter' && entrar()}
              />
              <button type="button" className="lf-eye" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <AnimatePresence>
              {erroSenha && (
                <motion.div
                  className="lf-msg"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {erroSenha}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.button
            className="login-btn"
            onClick={entrar}
            disabled={loading}
            whileHover={{ translateY: -2, boxShadow: '0 8px 24px rgba(168,90,79,0.35)' }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {loading ? <span className="login-spin" /> : 'Entrar'}
          </motion.button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.68 }}
            style={{ textAlign: 'center', marginTop: 8 }}
          >
            <button type="button" className="login-forgot-btn" onClick={abrirForgot}>
              Esqueci a senha
            </button>
          </motion.div>
        </div>

        <AnimatePresence>
          {showForgot && (
            <motion.div
              className="login-reset-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="login-reset-inner">
                {resetOk ? (
                  <div className="login-reset-ok">
                    <div className="login-reset-check"><CheckIcon /></div>
                    <div className="login-reset-hint">Link enviado! Verifique seu e-mail.</div>
                  </div>
                ) : (
                  <>
                    <label className="lf-label" style={{ marginBottom: 6, display: 'block' }}>Redefinir senha</label>
                    <input
                      className={`lf-input${resetErro ? ' lf-error' : ''}`}
                      type="email"
                      value={resetEmail}
                      onChange={e => { setResetEmail(e.target.value); setResetErro(''); }}
                      placeholder="seu@email.com"
                      style={{ marginBottom: 8 }}
                    />
                    {resetErro && <div className="lf-msg" style={{ marginBottom: 8 }}>{resetErro}</div>}
                    <button
                      className="login-btn-sm"
                      onClick={enviarReset}
                      disabled={resetLoading}
                    >
                      {resetLoading ? <span className="login-spin" style={{ width: 14, height: 14 }} /> : 'Enviar link de redefinição'}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="login-forgot-btn"
                  onClick={() => setShowForgot(false)}
                  style={{ marginTop: 8 }}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

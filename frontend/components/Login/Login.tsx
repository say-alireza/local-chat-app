'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Login.module.css';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/chat');
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginLeft}>
          <h1 className={styles.loginTitle}>Login</h1>
          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <div className={styles.loginFormInner}>
              <label className={styles.loginLabel} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={styles.loginInput}
                placeholder="Type your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label className={styles.loginLabel} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={styles.loginInput}
                placeholder="Type your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className={styles.loginOptions}>
                <label className={styles.loginRemember}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={styles.loginCheckbox}
                  />
                  <span className={styles.loginCheckboxCustom}></span>
                  <span>Remember me</span>
                </label>
                <a href="#" className={styles.loginForgot}>Forgot password?</a>
              </div>

              <button type="submit" className={styles.loginBtn}>Log in</button>
            </div>

            <div className={styles.loginDivider}>
              <span>Or</span>
            </div>

            <button type="button" className={styles.loginBtnGoogle}>
              Sign in with Google
            </button>
          </form>
        </div>
        <div className={styles.loginRight}>
          <img
            src="/login-image.png"
            alt="Cozy desk setup"
            className={styles.loginImage}
          />
        </div>
      </div>
    </div>
  );
}

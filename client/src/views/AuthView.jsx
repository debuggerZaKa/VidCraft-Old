import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import {
  Alignment,
  Fit,
  Layout,
  useRive,
  useStateMachineInput,
} from "@rive-app/react-canvas";
import { useAuth } from "../auth/AuthContext";

const RIVE_SRC = "/rive/6415-23087-animated-login-character.riv";
const STATE_MACHINE = "Login Machine";

const LoginTeddy = ({
  emailFocus,
  passwordFocus,
  obscurePassword,
  emailLength,
  trigger,
}) => {
  const { rive, RiveComponent } = useRive({
    src: RIVE_SRC,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Cover,
      alignment: Alignment.Center,
    }),
  });

  const isChecking = useStateMachineInput(rive, STATE_MACHINE, "isChecking");
  const isHandsUp = useStateMachineInput(rive, STATE_MACHINE, "isHandsUp");
  const lookA = useStateMachineInput(rive, STATE_MACHINE, "numLook");
  const lookB = useStateMachineInput(rive, STATE_MACHINE, "look");
  const successA = useStateMachineInput(rive, STATE_MACHINE, "trigSuccess");
  const successB = useStateMachineInput(rive, STATE_MACHINE, "success");
  const failA = useStateMachineInput(rive, STATE_MACHINE, "trigFail");
  const failB = useStateMachineInput(rive, STATE_MACHINE, "fail");

  const look = lookA || lookB;
  const success = successA || successB;
  const fail = failA || failB;

  useEffect(() => {
    if (!isChecking && !isHandsUp) return;

    if (passwordFocus) {
      if (isHandsUp) isHandsUp.value = obscurePassword;
      if (isChecking) isChecking.value = !obscurePassword;
      return;
    }

    if (emailFocus) {
      if (isChecking) isChecking.value = true;
      if (isHandsUp) isHandsUp.value = false;
      return;
    }

    if (isChecking) isChecking.value = false;
    if (isHandsUp) isHandsUp.value = false;
  }, [emailFocus, passwordFocus, obscurePassword, isChecking, isHandsUp]);

  useEffect(() => {
    if (!look) return;
    look.value = Math.min(100, Math.max(0, emailLength * 4.5));
  }, [emailLength, look]);

  useEffect(() => {
    if (!trigger) return;
    const kind = String(trigger).startsWith("success")
      ? "success"
      : String(trigger).startsWith("fail")
        ? "fail"
        : "";
    if (!kind) return;
    const t = setTimeout(() => {
      if (kind === "success") success?.fire?.();
      if (kind === "fail") fail?.fire?.();
    }, 120);
    return () => clearTimeout(t);
  }, [trigger, success, fail]);

  return (
    <div className="vc-auth-rive">
      <RiveComponent className="vc-auth-rive-canvas" />
    </div>
  );
};

export const AuthView = ({ mode = "login", onSwitchMode, onSuccess }) => {
  const { login, register } = useAuth();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [obscurePassword, setObscurePassword] = useState(true);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [riveTrigger, setRiveTrigger] = useState(null);
  const [loginPressed, setLoginPressed] = useState(false);

  const pressTimer = useRef(null);

  useEffect(() => {
    setError("");
    setRiveTrigger(null);
  }, [mode]);

  useEffect(() => {
    if (!riveTrigger) return undefined;
    const t = setTimeout(() => setRiveTrigger(null), 1600);
    return () => clearTimeout(t);
  }, [riveTrigger]);

  const canSubmit = useMemo(() => {
    if (busy) return false;
    if (!email.trim() || password.length < 6) return false;
    if (isSignup && (name.trim().length < 2 || password !== confirm)) return false;
    return true;
  }, [busy, email, password, isSignup, name, confirm]);

  const fireFail = () => {
    if (!isSignup) setRiveTrigger(`fail-${Date.now()}`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      fireFail();
      return;
    }

    if (isSignup && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    setEmailFocus(false);
    setPasswordFocus(false);

    try {
      if (isSignup) {
        await register({ name: name.trim(), email: email.trim(), password });
        onSuccess?.();
      } else {
        await login({ email: email.trim(), password });
        setRiveTrigger(`success-${Date.now()}`);
        await new Promise((resolve) => setTimeout(resolve, 1200));
        onSuccess?.();
      }
    } catch (err) {
      setError(err?.message || "Something went wrong.");
      fireFail();
    } finally {
      setBusy(false);
    }
  };

  const setPressed = (pressed) => {
    if (busy) return;
    setLoginPressed(pressed);
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (!pressed) return;
    pressTimer.current = setTimeout(() => setLoginPressed(false), 180);
  };

  return (
    <div className={`vc-auth-shell${isSignup ? " is-signup" : ""}`}>
      <aside className="vc-auth-brand-pane">
        <div className="vc-auth-orbits" aria-hidden="true">
          <span className="vc-auth-orb o1" />
          <span className="vc-auth-orb o2" />
          <span className="vc-auth-orb o3" />
          <span className="vc-auth-orb o4" />
          <span className="vc-auth-orb o5" />
          <span className="vc-auth-orb o6" />
          <span className="vc-auth-orb o7" />
          <span className="vc-auth-mesh" />
          <span className="vc-auth-beam" />
        </div>
        <div className="vc-auth-brand-inner">
          <div className="vc-auth-eyebrow">AI creation studio</div>
          <div className="vc-auth-wordmark">VidCraft</div>
          <p className="vc-auth-motto">
            {isSignup
              ? "Build your creative identity — then make something worth watching."
              : "Where ideas become frames, clips, and finished stories."}
          </p>
          <div className="vc-auth-rule" aria-hidden="true" />
        </div>
      </aside>

      <section className="vc-auth-form-pane">
        <div className={`vc-auth-glass-wrap${isSignup ? "" : " has-rive"}`}>
          {!isSignup && (
            <LoginTeddy
              emailFocus={emailFocus}
              passwordFocus={passwordFocus}
              obscurePassword={obscurePassword}
              emailLength={email.length}
              trigger={riveTrigger}
            />
          )}

          <div className="vc-auth-glass">
            <div className="vc-auth-glass-kicker">
              {isSignup ? "Create account" : "Welcome back"}
            </div>
            <p className="vc-auth-glass-sub">
              {isSignup
                ? "Fill in your details to get started."
                : "Enter your credentials to continue."}
            </p>

            <form className="vc-auth-form" onSubmit={handleSubmit}>
              {isSignup && (
                <label className="vc-auth-field">
                  <span className="vc-auth-label">NAME</span>
                  <div className="vc-auth-input-shell">
                    <User size={16} strokeWidth={1.8} />
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={2}
                    />
                  </div>
                </label>
              )}

              <label className="vc-auth-field">
                <span className="vc-auth-label">{isSignup ? "EMAIL" : "EMAIL"}</span>
                <div className="vc-auth-input-shell">
                  <Mail size={16} strokeWidth={1.8} />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                    required
                  />
                </div>
              </label>

              <label className="vc-auth-field">
                <span className="vc-auth-label">PASSWORD</span>
                <div className="vc-auth-input-shell">
                  <Lock size={16} strokeWidth={1.8} />
                  <input
                    type={obscurePassword ? "password" : "text"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    placeholder={isSignup ? "At least 6 characters" : "••••••••"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocus(true)}
                    onBlur={() => setPasswordFocus(false)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="vc-auth-eye"
                    aria-label={obscurePassword ? "Show password" : "Hide password"}
                    onClick={() => setObscurePassword((v) => !v)}
                  >
                    {obscurePassword ? (
                      <EyeOff size={16} strokeWidth={1.8} />
                    ) : (
                      <Eye size={16} strokeWidth={1.8} />
                    )}
                  </button>
                </div>
              </label>

              {isSignup && (
                <label className="vc-auth-field">
                  <span className="vc-auth-label">CONFIRM PASSWORD</span>
                  <div className="vc-auth-input-shell">
                    <Lock size={16} strokeWidth={1.8} />
                    <input
                      type={obscurePassword ? "password" : "text"}
                      autoComplete="new-password"
                      placeholder="Repeat password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </label>
              )}

              {error && <div className="vc-error">{error}</div>}

              <button
                className={`vc-auth-cta${loginPressed ? " is-pressed" : ""}`}
                type="submit"
                disabled={!canSubmit}
                onMouseDown={() => setPressed(true)}
                onMouseUp={() => setPressed(false)}
                onMouseLeave={() => setPressed(false)}
                onTouchStart={() => setPressed(true)}
                onTouchEnd={() => setPressed(false)}
              >
                {busy ? (
                  <>
                    <span className="vc-spinner" />
                    {isSignup ? "Creating account…" : "Signing in…"}
                  </>
                ) : isSignup ? (
                  "SIGN UP"
                ) : (
                  "LOGIN"
                )}
              </button>
            </form>

            <p className="vc-auth-switch">
              {isSignup ? "Already have an account?" : "New to VidCraft?"}{" "}
              <button type="button" className="vc-auth-link" onClick={onSwitchMode}>
                {isSignup ? "Sign in" : "Create an account"}
              </button>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

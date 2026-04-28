import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-solid";
import { Show, createSignal } from "solid-js";

export default function LoginRoute() {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [message, setMessage] = createSignal("");
  const [pending, setPending] = createSignal(false);

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    setMessage("");
    setPending(true);

    const response = await fetch("/api/auth/sign-in/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email(), password: password() }),
    }).catch(error => ({ ok: false, statusText: error instanceof Error ? error.message : String(error) }));

    setPending(false);

    if (!("ok" in response) || !response.ok) {
      setMessage(`Sign in failed: ${"statusText" in response ? response.statusText : "unknown error"}`);
      return;
    }

    window.location.href = "/";
  };

  return (
    <main class="app-frame">
      <Title>Sign in</Title>
      <section class="new-project-shell">
        <div class="new-project-copy surface--ink">
          <span class="pill"><LockKeyhole size={15} /> Internal access</span>
          <p class="eyebrow">Stylyf Builder</p>
          <h1 class="display-title">Sign in to build.</h1>
          <p class="body-copy" style={{ color: "color-mix(in oklab, var(--builder-paper) 72%, transparent)" }}>
            Use your Depths AI workspace account.
          </p>
        </div>

        <form class="new-project-form surface" onSubmit={submit}>
          <p class="eyebrow">Login</p>
          <label class="field-label">
            Email
            <input class="input-field" type="email" value={email()} onInput={event => setEmail(event.currentTarget.value)} required />
          </label>
          <label class="field-label">
            Password
            <input class="input-field" type="password" value={password()} onInput={event => setPassword(event.currentTarget.value)} required />
          </label>
          <Show when={message()}>
            <p class="prompt-example" role="alert">{message()}</p>
          </Show>
          <div class="button-row">
            <button class="button" type="submit" disabled={pending()}>
              {pending() ? "Signing in..." : "Sign in"} <ArrowRight size={18} />
            </button>
            <A href="/" class="button button--quiet">Dashboard</A>
          </div>
          <span class="pill pill--coral"><Sparkles size={15} /> Private beta</span>
        </form>
      </section>
    </main>
  );
}

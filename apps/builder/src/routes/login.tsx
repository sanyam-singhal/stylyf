import { Title } from "@solidjs/meta";
import { Show, createSignal } from "solid-js";
import { AuthPageShell } from "~/components/shells/page/auth";
import { Button } from "~/components/registry/actions-navigation/button";
import { TextField } from "~/components/registry/form-inputs/text-field";

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
      setMessage(`Authentication failed: ${"statusText" in response ? response.statusText : "unknown error"}`);
      return;
    }

    window.location.href = "/";
  };

  return (
    <>
      <Title>Sign in</Title>
      <AuthPageShell
        title="Sign in"
        subtitle="Access the internal Stylyf Builder with your Depths AI email and password."
      >
        <form class="space-y-4" onSubmit={submit}>
          <TextField label="Email" type="email" value={email()} onValueChange={setEmail} required />
          <TextField label="Password" type="password" value={password()} onValueChange={setPassword} required />
          <Show when={message()}>
            <p class="rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {message()}
            </p>
          </Show>
          <Button type="submit" fullWidth pending={pending()}>
            Sign in
          </Button>
        </form>
        <div class="pt-2 text-center text-sm text-muted-foreground">
          Accounts are manually provisioned by the Depths AI admin team.
        </div>
      </AuthPageShell>
    </>
  );
}

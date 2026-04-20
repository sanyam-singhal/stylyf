// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          <script
            innerHTML={`(() => {
              const key = "stylyf-theme";
              const saved = localStorage.getItem(key);
              const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              const theme = saved === "light" || saved === "dark" ? saved : prefersDark ? "dark" : "light";
              const root = document.documentElement;
              root.dataset.theme = theme;
              root.classList.toggle("dark", theme === "dark");
            })();`}
          />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));

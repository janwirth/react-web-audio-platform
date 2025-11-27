import { type ServerResponse } from "node:http";
import { extname, join } from "node:path";
import { type Connect, type Plugin } from "vite";
import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

export const storiesPlugin = (): Plugin => {
  const storyEntries = new Map<string, string>();

  return {
    apply: "serve",
    name: "stories",
    resolveId(id) {
      if (id.startsWith("virtual:story-entry:")) {
        return `\0${id}`;
      }
    },
    load(id) {
      if (id.startsWith("\0virtual:story-entry:")) {
        const storyPath = storyEntries.get(id);
        if (storyPath) {
          return `
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import StoryComponent from "${storyPath}";
import "/src/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <StoryComponent />
  </StrictMode>
);`;
        }
      }
    },
    transformIndexHtml(html, ctx) {
      // This is called for HTML files, but we're generating HTML dynamically
      return html;
    },
    configureServer(server) {
      // Handle virtual module requests first
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.originalUrl ?? req.url;
        if (!reqUrl) return next();

        const url = new URL(reqUrl, `http://${req.headers.host || "localhost"}`);

        // Handle virtual story entry module requests
        if (url.pathname.startsWith("/virtual:story-entry:")) {
          const virtualId = url.pathname.slice(1); // Remove leading slash
          const resolvedId = `\0${virtualId}`;
          const storyPath = storyEntries.get(resolvedId);

          if (storyPath) {
            try {
              // Use Vite's transformRequest to get the transformed code
              const result = await server.transformRequest(virtualId, { ssr: false });
              if (result && result.code) {
                res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
                res.end(result.code);
                return;
              }
            } catch (error) {
              console.error("Error transforming virtual module:", error);
            }
          }
        }

        return next();
      });

      return () => {
        server.middlewares.use(async (req, res, next) => {
          const reqUrl = req.originalUrl ?? req.url;
          const host = req.headers["x-forwarded-host"] ?? req.headers.host;

          if (!reqUrl) return next();
          if (!host) return next();

          const url = new URL(reqUrl, `http://${host}`);

          // Only handle requests in the stories directory
          if (!url.pathname.startsWith("/stories/")) {
            return next();
          }

          const pathname = url.pathname;

          // Handle index endpoint
          if (pathname === "/stories/index" || pathname === "/stories/index.json") {
            try {
              const storiesDir = resolve(server.config.root, "fixture-viewer/stories");
              const stories: string[] = [];

              if (existsSync(storiesDir)) {
                const files = readdirSync(storiesDir);
                for (const file of files) {
                  const filePath = join(storiesDir, file);
                  const stat = statSync(filePath);
                  if (stat.isFile() && file.endsWith(".tsx")) {
                    // Return without extension
                    const nameWithoutExt = file.replace(/\.tsx$/, "");
                    stories.push(`/stories/${nameWithoutExt}`);
                  }
                }
              }

              res.setHeader("Content-Type", "application/json; charset=UTF-8");
              res.statusCode = 200;
              res.end(JSON.stringify(stories.sort(), null, 2));
              return;
            } catch (error) {
              console.error("Error reading stories directory:", error);
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error: error instanceof Error ? error.message : String(error),
                })
              );
              return;
            }
          }

          // Skip if it has an extension (we want clean URLs without .tsx)
          if (extname(pathname)) {
            return next();
          }

          try {
            // Extract story name from pathname (e.g., /stories/example-story -> example-story)
            const storyName = pathname.replace(/^\/stories\//, "");
            if (!storyName) {
              return next();
            }

            // Resolve to the actual .tsx file
            const filePath = `fixture-viewer/stories/${storyName}.tsx`;
            const fullPath = resolve(server.config.root, filePath);

            // Check if the file exists
            if (!existsSync(fullPath)) {
              return next();
            }

            // Create virtual entry ID for this story
            const storyPath = `/${filePath}`;
            const virtualEntryId = `virtual:story-entry:${pathname.replace(/[^a-zA-Z0-9]/g, "-")}`;
            const resolvedVirtualId = `\0${virtualEntryId}`;
            storyEntries.set(resolvedVirtualId, storyPath);

            // Use a script src that Vite can process
            // The virtual module will be handled by Vite's plugin system
            const virtualModuleUrl = `/${virtualEntryId}`;

            const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Story</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${virtualModuleUrl}"></script>
  </body>
</html>`;

            res.setHeader("Content-Type", "text/html; charset=UTF-8");
            res.statusCode = 200;
            res.end(html);
          } catch (error) {
            console.error("Error rendering story:", error);
            res.statusCode = 500;
            res.end(`Error: ${error instanceof Error ? error.message : String(error)}`);
          }
        });
      };
    },
  };
};


import { defineConfig } from "cypress";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    baseUrl: "http://127.0.0.1:5174",
    supportFile: false,
    video: false,
    setupNodeEvents(on, config) {
      on("task", {
        prepareSalesAnalytics() {
          const root = resolve(config.projectRoot, "..");
          const fixture = readFileSync(
            resolve(root, "cohida-backend/scripts/analytics-demo.sql"),
            "utf8",
          );
          const reset = `\nUPDATE cohida.orders SET status = 'EM_TRANSITO', delivered_at = NULL
            WHERE coupon_code = 'ANALYTICS-DEMO-MAR-' || extract(year from current_date)::int;\n`;
          execFileSync(
            "docker",
            [
              "compose",
              "exec",
              "-T",
              "postgres",
              "sh",
              "-c",
              'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"',
            ],
            {
              cwd: root,
              input: fixture + reset,
              stdio: ["pipe", "pipe", "pipe"],
            },
          );
          return null;
        },
      });
    },
  },
});

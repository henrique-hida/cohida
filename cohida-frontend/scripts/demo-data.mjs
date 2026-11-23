const action = process.argv[2];
const methods = {
  seed: { method: "POST", success: "Dados demonstrativos carregados." },
  remove: {
    method: "DELETE",
    success: "Produtos e cupons demonstrativos desativados.",
  },
};

if (!Object.hasOwn(methods, action)) {
  console.error("Use: npm run demo:seed ou npm run demo:remove");
  process.exit(1);
}

const apiBaseUrl = (
  process.env.COHIDA_API_URL ?? "http://localhost:8080/api"
).replace(/\/$/, "");

try {
  const login = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.COHIDA_DEMO_ADMIN_EMAIL ?? "e2e.admin@cohida.test",
      password: process.env.COHIDA_DEMO_ADMIN_PASSWORD ?? "Cypress@123",
    }),
  });
  if (!login.ok) throw new Error(`Login falhou com HTTP ${login.status}.`);
  const { accessToken } = await login.json();
  if (!accessToken) throw new Error("Login não retornou um token.");
  const response = await fetch(`${apiBaseUrl}/admin/demo/seed`, {
    method: methods[action].method,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `A API respondeu com HTTP ${response.status}.`);
  }

  const result = action === "seed" ? await response.json() : null;
  console.log(methods[action].success);
  if (result) console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(
    `Não foi possível ${action === "seed" ? "carregar" : "desativar"} os dados demonstrativos: ${error.message}`,
  );
  process.exitCode = 1;
}

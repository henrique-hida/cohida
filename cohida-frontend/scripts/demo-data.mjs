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
  const response = await fetch(`${apiBaseUrl}/admin/demo/seed`, {
    method: methods[action].method,
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

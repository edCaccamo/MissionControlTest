import { buildApp } from "./app";
import { config } from "./config";

const start = async () => {
  const app = buildApp();

  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
    console.log(`NASA API running on http://localhost:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile, type ExecFileOptions } from "node:child_process";

function run(file: string, args: string[], options: ExecFileOptions): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = execFile(file, args, { ...options, encoding: "utf8" }, (error, stdout, stderr) => error ? reject(Object.assign(error, { stdout, stderr })) : resolve({ stdout, stderr }));
    child.stdin?.end();
  });
}
const cli = join(process.cwd(), "node_modules/@earendil-works/pi-coding-agent/dist/cli.js");

test("installed Pi loads the actual package, discovers keyless models and resumes cache offline", async () => {
  const root = await mkdtemp(join(tmpdir(), "ofm-cli-"));
  let inference = 0;
  const server = createServer(async (req, res) => {
    if (req.url === "/models") {
      res.end(JSON.stringify({ data: [{ id: "test-model:free", name: "Fixture model", isFree: true,
        supported_parameters: ["tools"], context_length: 32768 }] })); return;
    }
    inference++;
    assert.equal(req.headers.authorization, undefined);
    res.writeHead(200, { "content-type": "text/event-stream" });
    res.end('data: {"id":"fixture","choices":[{"index":0,"delta":{"content":"PI_EXTENSION_OK"},"finish_reason":null}]}\n\ndata: {"id":"fixture","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":10,"completion_tokens":3,"total_tokens":13}}\n\ndata: [DONE]\n\n');
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address(); assert.ok(addr && typeof addr !== "string");
  const preload = join(root, "fixture.mjs");
  // Test-only transport redirects the real upstream boundary, not the extension.
  await writeFile(preload, `await import(${JSON.stringify(join(process.cwd(), "node_modules/@earendil-works/pi-coding-agent/dist/core/http-dispatcher.js"))});
    const real = globalThis.fetch; globalThis.fetch = (url, init) => {
    const req = new Request(url, init);
    if (req.url.startsWith('https://api.kilo.ai/api/gateway/')) {
      const target = req.url.replace('https://api.kilo.ai/api/gateway', 'http://127.0.0.1:${addr.port}');
      return real(new Request(target, req));
    }
    throw new Error('Unexpected external network: ' + new URL(req.url).host);
  };`);
  const env = { ...process.env, PI_CODING_AGENT_DIR: root, PI_OFFLINE: "0", OPENCODE_API_KEY: "" };
  const flags = ["-ne", "-ns", "-np", "-nc", "-na", "--no-session", "-e", "."];
  try {
    const result = await run(process.execPath, ["--import", preload, cli, ...flags, "--model", "ofm-kilo/test-model:free", "--no-tools", "-p", "Say hello"], { env, timeout: 30000 });
    assert.match(result.stdout, /PI_EXTENSION_OK/);
    assert.equal(inference, 1);
    const cache = JSON.parse(await readFile(join(root, "models-store.json"), "utf8"));
    assert.equal(cache["ofm-kilo"].models[0].id, "test-model:free");
    const offline = await run(process.execPath, [cli, ...flags, "--offline", "--list-models", "test-model"], { env, timeout: 30000 });
    assert.match(offline.stdout, /ofm-kilo/);
    assert.match(offline.stdout, /test-model:free/);
    const privacy = await run(process.execPath, [cli, ...flags, "--offline", "--model", "ofm-kilo/test-model:free", "-p", "/free-models privacy"], { env, timeout: 30000 });
    assert.match(privacy.stderr, /Do not send secrets/);
    assert.equal(inference, 1);
  } finally {
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
    await rm(root, { recursive: true, force: true });
  }
});

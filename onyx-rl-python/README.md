# ONYX RL Python Runtime

Python RL training modules for the ONYX Sovereign AI OS.
Ported from [Gen-Verse/OpenClaw-RL](https://github.com/Gen-Verse/OpenClaw-RL).

## Architecture

```
onyx-rl-python/
├── swe-rl/        SWE-Bench reinforcement learning (GitHub issue → patch)
├── terminal-rl/   Terminal agent multi-turn RL
├── toolcall-rl/   Tool-call RL with Python sandbox
└── hermes-benchmarks/  ONYX Hermes evaluation environments
```

## Setup

### 1. Install SWE-RL dependencies

```bash
pip install -r swe-rl/requirements.txt
```

### 2. Install Terminal-RL dependencies

```bash
pip install -r terminal-rl/requirements.txt
```

### 3. Install Toolcall-RL dependencies

```bash
pip install -r toolcall-rl/requirements.txt
```

### 4. Install ONYX framework (required by all modules)

```bash
# Install slime (Gen-Verse internal RL framework):
pip install git+https://github.com/Gen-Verse/slime.git

# Or install from your local clone:
pip install -e /path/to/slime
```

## Running Each Component

### SWE-RL Flask Server

Accepts GitHub issue URLs from `@onyx/swe` and runs the SWE-RL pipeline:

```bash
cd swe-rl/

# Start the HTTP API server
SWE_RL_PORT=7080 \
SWE_ENV_SERVER_URL=http://localhost:18090 \
python swe_server.py

# Test: POST an issue URL
curl -X POST http://localhost:7080/issue \
  -H 'Content-Type: application/json' \
  -d '{"issueUrl": "https://github.com/django/django/issues/12345"}'
```

**Required env vars:**

| Variable | Default | Description |
|---|---|---|
| `SWE_RL_PORT` | `7080` | Flask server port |
| `SWE_ENV_SERVER_URL` | `http://localhost:18090` | Docker pool server URL |
| `SWE_DOCKER_REGISTRY` | `docker.io` | Docker image registry |
| `GITHUB_TOKEN` | *(optional)* | Increases GitHub API rate limit |
| `SWE_STEP_LIMIT` | `30` | Max agent steps per episode |
| `SWE_MAX_CONCURRENT` | `8` | Max concurrent rollouts |

### SWE-RL Docker Pool Server

```bash
cd swe-rl/

# Start the pool server (GPU head node)
python server/swe_env_pool_server.py \
  --port 18090 \
  --exec-server-urls http://10.0.0.10:5000,http://10.0.0.11:5000

# Start the exec server (each ECS Docker node)
python server/swe_exec_server.py --port 5000 --host 0.0.0.0
```

### SWE-RL Training

```bash
cd swe-rl/

# Preprocess SWE-Bench dataset
python data/preprocess_swe_dataset.py

# Pull Docker images
bash data/pull_swebench_verified_images.sh

# Run training (requires slime framework + GPU cluster)
# See scripts/run_swe_rl_4b_4nodes_colocate.sh for full invocation
SWE_CONFIG_PATH=swebench.yaml \
python -m slime.train \
  --custom-generate-function-path generate_with_swe.generate \
  --custom-rm-path generate_with_swe.reward_func
```

### Terminal-RL

```bash
cd terminal-rl/

# Set RL_PORT so rollout_log.py can POST results back to the TypeScript loop
RL_PORT=8080 python -m your_training_script
```

**Required env vars:**

| Variable | Default | Description |
|---|---|---|
| `RL_PORT` | `8080` | ONYX TypeScript RL loop port |

### Toolcall-RL

```bash
cd toolcall-rl/

# Preprocess DAPO-Math dataset
mkdir -p /root/dapo-math-17k-processed
python rl_data_preprocess.py

# Run training (requires slime framework + GPU)
python -m slime.train \
  --custom-generate-function-path generate_with_retool.generate \
  --custom-rm-path generate_with_retool.reward_func
```

## Integration with ONYX TypeScript Layer

### swe-rl ↔ @onyx/swe

The `@onyx/swe` TypeScript package POSTs GitHub issue URLs to the Flask server:

```typescript
// In @onyx/swe
const result = await fetch(`http://localhost:${SWE_RL_PORT}/issue`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ issueUrl: 'https://github.com/owner/repo/issues/123' }),
});
```

### terminal-rl ↔ @onyx/rl

The `rollout_log.py` module POSTs training results to `@onyx/rl`:

```typescript
// @onyx/rl listens on RL_PORT
app.post('/outcome', async (req, res) => {
  const { rollout_id, source, ...metrics } = req.body;
  // Process training metrics...
});
```

## Tests

Run these to verify the port is correct:

```bash
# Test 1: swe_utils imports cleanly
python -c "import sys; sys.path.insert(0, 'swe-rl'); import swe_utils; print('swe_utils OK')"

# Test 2: terminal-rl POST endpoint URL is correct
python -c "
import ast, sys
sys.path.insert(0, 'terminal-rl')
src = open('terminal-rl/rollout_log.py').read()
assert 'RL_PORT' in src, 'RL_PORT not found'
assert '/outcome' in src, '/outcome not found'
print('terminal-rl POST endpoint: OK')
"

# Test 3: toolcall-rl has no 'openclaw' strings (all replaced with 'onyx')
python -c "
src = open('toolcall-rl/tool_sandbox.py').read()
assert 'openclaw' not in src.lower() or 'onyx' in src.lower(), 'openclaw string found — substitution failed'
print('toolcall-rl string substitution: OK')
"
```

## Environment Variables Reference

| Variable | Used By | Description |
|---|---|---|
| `SWE_RL_PORT` | swe-rl | Flask API server port (default: 7080) |
| `SWE_ENV_SERVER_URL` | swe-rl | Docker pool server URL |
| `SWE_DOCKER_REGISTRY` | swe-rl | Docker image registry |
| `SWE_MAX_CONCURRENT` | swe-rl | Max concurrent rollouts (default: 8) |
| `SWE_STEP_LIMIT` | swe-rl | Max steps per episode (default: 30) |
| `SWE_EVAL_TIMEOUT` | swe-rl | Eval timeout seconds (default: 300) |
| `SWE_ROLLOUT_TIMEOUT` | swe-rl | Total rollout timeout (default: 1800) |
| `SWE_SAVE_TRAJ_DIR` | swe-rl | Directory to save rollout artifacts |
| `RL_PORT` | terminal-rl | ONYX TypeScript RL loop port (default: 8080) |
| `GITHUB_TOKEN` | swe-rl | GitHub API auth token |
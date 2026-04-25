/**
 * @onyx/hermes-adapter
 *
 * Routes incoming Hermes ACP requests to ONYX skill execution.
 * Maps Hermes skill request format → HTTP call to @onyx/hermes ACP server.
 * Maps ONYX skill result → Hermes expected response format.
 *
 * Layer: L7 Workflow
 * Depends on: @onyx/hermes ACP server (via HTTP)
 */

export interface HermesAcpRequest {
  method: string;
  skillName: string;
  params: Record<string, unknown>;
  sessionId?: string;
}

export interface HermesAcpResponse {
  result?: Record<string, unknown>;
  error?: string;
  statusCode: number;
}

export interface OnyxSkillRequest {
  skillId: string;
  input: Record<string, unknown>;
  sessionId?: string;
  userId?: string;
}

export interface OnyxSkillResult {
  skillId: string;
  output: Record<string, unknown>;
  success: boolean;
  error?: string;
  durationMs?: number;
}

export interface HermesAdapter {
  toOnyxSkillRequest(req: HermesAcpRequest): OnyxSkillRequest;
  toHermesResponse(result: OnyxSkillResult): HermesAcpResponse;
  handleRequest(req: HermesAcpRequest): Promise<HermesAcpResponse>;
}

function toOnyxSkillRequest(req: HermesAcpRequest): OnyxSkillRequest {
  return {
    skillId: req.skillName,
    input: {
      ...req.params,
      _method: req.method,
    },
    sessionId: req.sessionId,
  };
}

function toHermesResponse(result: OnyxSkillResult): HermesAcpResponse {
  if (!result.success) {
    return {
      statusCode: 500,
      error: result.error ?? "ONYX skill execution failed",
    };
  }

  return {
    statusCode: 200,
    result: {
      ...result.output,
      _skillId: result.skillId,
      _durationMs: result.durationMs,
    },
  };
}

async function handleRequest(
  req: HermesAcpRequest,
  hermesAcpUrl: string
): Promise<HermesAcpResponse> {
  const skillReq = toOnyxSkillRequest(req);

  try {
    const url = `${hermesAcpUrl}/skill/${encodeURIComponent(req.skillName)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: JSON.stringify(skillReq.input),
        sessionId: skillReq.sessionId,
        userId: skillReq.userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        error: errorText || `HTTP error ${response.status}`,
      };
    }

    const data = await response.json() as {
      result?: string;
      tokensUsed?: number;
      latencyMs?: number;
    };

    const onyxResult: OnyxSkillResult = {
      skillId: req.skillName,
      output: {
        result: data.result,
        tokensUsed: data.tokensUsed,
      },
      success: true,
      durationMs: data.latencyMs,
    };

    return toHermesResponse(onyxResult);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[onyx-hermes-adapter] request failed for '${req.skillName}': ${errMsg}`);

    return {
      statusCode: 500,
      error: `ONYX skill execution error: ${errMsg}`,
    };
  }
}

export function createHermesAdapter(hermesAcpUrl: string): HermesAdapter {
  const adapter: HermesAdapter = {
    toOnyxSkillRequest,
    toHermesResponse,

    async handleRequest(req: HermesAcpRequest): Promise<HermesAcpResponse> {
      return handleRequest(req, hermesAcpUrl);
    },
  };

  return adapter;
}

export { toOnyxSkillRequest, toHermesResponse };
import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string>;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.status = body.status;
    this.code = body.code;
    this.fieldErrors = body.fieldErrors ?? {};
  }

  /** Backend paths look like "variants[0].stock"; react-hook-form expects "variants.0.stock". */
  fieldPaths(): [string, string][] {
    return Object.entries(this.fieldErrors).map(([path, msg]) => [path.replace(/\[(\d+)\]/g, ".$1"), msg]);
  }
}

export async function toApiError(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return new ApiError({ ...body, status: body.status ?? res.status, code: body.code ?? "UNKNOWN" });
  } catch {
    return new ApiError({ status: res.status, code: "UNKNOWN", message: res.statusText });
  }
}

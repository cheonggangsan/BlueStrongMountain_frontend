export class ApiSchemaError extends Error {
  /**
   * @param {{ context: string, issues: any[] }} param0
   */
  constructor({ context, issues }) {
    super("서버 응답 형식이 예상과 달라요. 잠시 후 다시 시도해주세요.");
    this.name = "ApiSchemaError";
    this.code = "API_SCHEMA_INVALID";
    this.context = context;
    this.issues = issues;
  }
}

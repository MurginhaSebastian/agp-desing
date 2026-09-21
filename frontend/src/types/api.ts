/** Error con forma RFC 7807 (ProblemDetail de Spring) */
export interface ApiProblem {
  title: string
  status: number
  detail?: string
  errors?: Record<string, string>
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(problem: ApiProblem) {
    super(problem.detail ?? problem.title)
    this.name = 'ApiError'
    this.status = problem.status
    this.fieldErrors = problem.errors ?? {}
  }
}

export class AppError extends Error {
	constructor(
		message: string,
		public statusCode: number,
	) {
		super(message);
		this.name = "AppError";
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string, id?: number | string) {
		super(id ? `${resource} ${id} not found` : `${resource} not found`, 404);
		this.name = "NotFoundError";
	}
}

export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 400);
		this.name = "ValidationError";
	}
}

export class AuthError extends AppError {
	constructor(message = "Unauthorised") {
		super(message, 401);
		this.name = "AuthError";
	}
}

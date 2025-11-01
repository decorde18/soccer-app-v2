// api/[table]/route.js

import { handleCrudRequest } from "@/lib/apiHandler";

export const GET = handleCrudRequest;
export const POST = handleCrudRequest;
export const PUT = handleCrudRequest;
export const PATCH = handleCrudRequest;
export const DELETE = handleCrudRequest;

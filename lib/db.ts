import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo?: {
    userId?: string;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
    },
    operationType,
    path
  };
  // Log detailed error internally
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Throw a sanitized generic error to prevent leaking sensitive data to the UI
  throw new Error('An error occurred while communicating with the database.');
}

export const makeId = () => Math.random().toString(36).substring(2, 15);

import type { Session, User } from '@lerno/auth';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
    }
    interface PageData {
      user?: User | null;
    }
    // interface Error {}
    // interface Platform {}
  }
}

export {};

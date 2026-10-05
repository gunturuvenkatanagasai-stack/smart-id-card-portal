import { Request, Response, NextFunction } from "express";

export type AuthUser = {
  id: number;
  name: string;
  username?: string | null;
  email: string;
  role: "STUDENT" | "HOD" | "PRINCIPAL" | "ADMIN" | "ID_CARD_STAFF" | "SUPER_ADMIN";
  department?: string | null;
  isActive?: boolean;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// In-memory token session lookup stores for active staff and student tokens
export const activeStaffSessions = new Map<string, AuthUser>();
export const activeStudentSessions = new Map<string, AuthUser>();

export function normalizeDepartment(dept?: string | null): string {
  if (!dept) return "";
  const d = dept.trim().toUpperCase();
  if (d === "CSE" || d.includes("COMPUTER")) return "CSE";
  if (d === "IT" || d.includes("INFORMATION")) return "IT";
  if (d === "ECE" || d.includes("ELECTRONIC")) return "ECE";
  if (d === "EEE" || d.includes("ELECTRICAL")) return "EEE";
  if (d === "MECH" || d.includes("MECHANICAL")) return "MECHANICAL";
  if (d === "CIVIL") return "CIVIL";
  if (d === "AIDS" || d.includes("DATA") || d.includes("AIDS")) return "AIDS";
  if (d === "AIML" || d.includes("MACHINE") || d.includes("AIML") || d.includes("ARTIFICIAL")) return "AIML";
  return d;
}

export function departmentsMatch(dept1?: string | null, dept2?: string | null): boolean {
  if (!dept1 || !dept2) return false;
  if (dept1 === "ALL" || dept2 === "ALL") return true;
  return normalizeDepartment(dept1) === normalizeDepartment(dept2);
}

export function formatRoleName(role: string): string {
  if (role === "HOD") return "HOD";
  if (role === "PRINCIPAL") return "Principal";
  if (role === "ADMIN") return "Admin";
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "STUDENT") return "Student";
  if (role === "ID_CARD_STAFF") return "Staff";
  return role;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Please log in." });
    return;
  }

  const token = authHeader.substring(7).trim();
  const user = activeStaffSessions.get(token) || activeStudentSessions.get(token);

  if (!user) {
    res.status(401).json({ error: "Invalid or expired session token. Please log in again." });
    return;
  }

  if (user.isActive === false) {
    res.status(403).json({ error: "Access denied. Account is inactive." });
    return;
  }

  req.user = user;
  next();
}

// Backward compatibility alias
export const authenticateStaff = requireAuth;

export function optionalAuthenticateStaff(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const user = activeStaffSessions.get(token) || activeStudentSessions.get(token);
    if (user && user.isActive !== false) {
      req.user = user;
    }
  }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    const userRole = req.user.role;
    const isSuper = userRole === "SUPER_ADMIN";

    if (!isSuper && !allowedRoles.includes(userRole)) {
      const requiredRoleText =
        allowedRoles.length === 1
          ? formatRoleName(allowedRoles[0] ?? "")
          : allowedRoles.map(formatRoleName).join(" or ");
      res.status(403).json({
        error: `Access denied. ${requiredRoleText} authorization required.`,
        requiredRoles: allowedRoles,
        userRole,
      });
      return;
    }

    next();
  };
}

export function requireHodDepartmentMatch(req: Request, res: Response, targetDepartment: string): boolean {
  if (!req.user) return false;
  if (req.user.role === "SUPER_ADMIN" || req.user.department === "ALL") return true;

  if (req.user.role === "HOD") {
    return departmentsMatch(req.user.department, targetDepartment);
  }

  return true;
}

export function requireDepartmentAccess(getTargetDepartment: (req: Request) => string | Promise<string | undefined> | undefined) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    if (req.user.role === "SUPER_ADMIN" || req.user.department === "ALL") {
      next();
      return;
    }

    const targetDept = await getTargetDepartment(req);
    if (!targetDept || !departmentsMatch(req.user.department, targetDept)) {
      res.status(403).json({
        error: "Access denied. You are only authorized to access applications from your department.",
      });
      return;
    }

    next();
  };
}

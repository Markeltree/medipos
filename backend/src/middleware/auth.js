import jwt from "jsonwebtoken";
import { HttpError } from "../lib/http.js";
import { Staff } from "../models/index.js";

export const ADMIN = "Admin";
export const PHARMACIST = "Pharmacist";
export const CASHIER = "Cashier";
export const INVENTORY = "Inventory Manager";

/** Who may change what. Reading is open to every signed-in staff member. */
export const can = {
  manageCatalogue: [ADMIN, INVENTORY],
  adjustStock: [ADMIN, INVENTORY],
  manageSuppliers: [ADMIN, INVENTORY],
  managePurchases: [ADMIN, INVENTORY],
  sell: [ADMIN, PHARMACIST, CASHIER],
  refund: [ADMIN, PHARMACIST],
  editCustomers: [ADMIN, PHARMACIST, CASHIER],
  deleteCustomers: [ADMIN],
  handlePrescriptions: [ADMIN, PHARMACIST],
  manageStaff: [ADMIN],
  manageSettings: [ADMIN],
};

export function signToken(staff, config) {
  return jwt.sign({ sub: staff._id ?? staff.id, role: staff.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: "HS256",
  });
}

/**
 * Checks the Bearer token, then loads the staff member so that a deactivated
 * account or a changed role takes effect on the next request, not at token expiry.
 */
export function requireAuth(config) {
  return async (req, _res, next) => {
    const header = req.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new HttpError(401, "Sign in to continue");

    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    } catch {
      throw new HttpError(401, "Your session has expired. Sign in again.");
    }

    const staff = await Staff.findById(payload.sub);
    if (!staff || staff.status === "Inactive") throw new HttpError(401, "This account is no longer active");
    req.user = { id: staff._id, name: staff.name, email: staff.email, role: staff.role };
    next();
  };
}

export function requireRole(roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError(403, "Your role is not allowed to do this");
    }
    next();
  };
}

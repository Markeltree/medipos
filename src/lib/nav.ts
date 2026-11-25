import {
  BarChart3,
  Boxes,
  CalendarClock,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Pill,
  Receipt,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  UserCog,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  crumb: string;
  description: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/* Single source of truth for sidebar, breadcrumbs and page titles. */
export const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard, crumb: "Overview", description: "Today at a glance" },
      { label: "Point of Sale", href: "/pos", icon: ShoppingCart, crumb: "Point of Sale", description: "Counter sales" },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { label: "Medicines", href: "/products", icon: Pill, crumb: "Medicines", description: "Products and pricing" },
      { label: "Categories", href: "/categories", icon: Tags, crumb: "Categories", description: "Group medicines by class" },
      { label: "Inventory", href: "/inventory", icon: Boxes, crumb: "Inventory", description: "Stock, batches and movements" },
      { label: "Expiry", href: "/expiry", icon: CalendarClock, crumb: "Expiry Management", description: "Track near-expiry stock" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Suppliers", href: "/suppliers", icon: Truck, crumb: "Suppliers", description: "Vendors and balances" },
      { label: "Purchases", href: "/purchases", icon: ClipboardList, crumb: "Purchases", description: "Purchase orders" },
      { label: "Sales History", href: "/sales", icon: Receipt, crumb: "Sales History", description: "Transactions and refunds" },
      { label: "Customers", href: "/customers", icon: Users, crumb: "Customers", description: "Profiles and loyalty" },
      { label: "Prescriptions", href: "/prescriptions", icon: FileText, crumb: "Prescriptions", description: "Verify and dispense" },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Reports & Analytics", href: "/reports", icon: BarChart3, crumb: "Reports & Analytics", description: "Sales, P&L and valuation" },
      { label: "Staff", href: "/staff", icon: UserCog, crumb: "Staff Management", description: "Team and roles" },
      { label: "Settings", href: "/settings", icon: Settings, crumb: "Settings", description: "Store and billing setup" },
    ],
  },
];

export const allNavItems = navGroups.flatMap((g) => g.items);

export function findNav(pathname: string): NavItem | undefined {
  return allNavItems.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
}

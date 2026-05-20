"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Settings,
  LogOut,
  User,
  Home,
  ChevronRight,
  ChevronDown,
  HandCoins,
  Car,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { TopNavigationProps } from "@/lib/interfaces";
import Notifications from "./Notifications";
import { usePermissions } from "@/hooks/usePermissions";
import { useLogout } from "@/hooks/useLogout";
import { useFullName } from "@/hooks/useFullname";
import { useEmail } from "@/hooks/useEmail";

type PermissionType = "page" | "section" | "subsection" | "action";

type NavItem = {
  label: string;
  href?: string;
  icon?: any;
  badge?: string;
  permission?: {
    type: PermissionType;
    id: string;
  };
  subsections?: NavItem[];
};

const allNavItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/home",
    permission: { type: "page", id: "dashboard" },
  },
  {
    label: "Employee Portal",
    icon: User,
    permission: { type: "page", id: "employee-portal" },
    subsections: [
      {
        label: "Requests",
        permission: { type: "section", id: "requests" },
        subsections: [
          {
            label: "Service Request",
            href: "/home/employee-portal/requests/service-requests",
            permission: { type: "subsection", id: "service-request" },
          },
          {
            label: "Purchase Request",
            href: "/home/employee-portal/requests/purchase-requests",
            permission: { type: "subsection", id: "purchase-request" },
          },
          {
            label: "Request for Payment",
            href: "/home/employee-portal/requests/request-for-payment",
            permission: { type: "subsection", id: "request-for-payment" },
          },
          {
            label: "Liquidation",
            href: "/home/employee-portal/requests/liquidation",
            permission: { type: "section", id: "liquidation-emp" },
          },
        ],
      },
    ],
  },
  {
    label: "Finance",
    icon: HandCoins,
    permission: { type: "page", id: "finance" },
    subsections: [
      {
        label: "Service Requests",
        href: "/home/finance/service-requests",
        permission: { type: "section", id: "service-requests" },
      },
      {
        label: "Purchase Requests",
        href: "/home/finance/purchase-requests",
        permission: { type: "section", id: "purchase-requests" },
        badge: "12",
      },
      {
        label: "Review Requests",
        href: "/home/finance/review-requests",
        permission: { type: "section", id: "review-requests" },
      },
      {
        label: "Service Order",
        href: "/home/finance/service-orders",
        permission: { type: "section", id: "service-order" },
      },
      {
        label: "Purchase Order",
        href: "/home/finance/purchase-orders",
        permission: { type: "section", id: "purchase-order" },
      },
      {
        label: "Review Orders",
        href: "/home/finance/review-orders",
        permission: { type: "section", id: "review-orders" },
      },
      {
        label: "Request for Payment",
        href: "/home/finance/request-for-payment",
        permission: { type: "section", id: "rfp-finance" },
      },
      {
        label: "Liquidation",
        href: "/home/finance/liquidation",
        permission: { type: "section", id: "liquidation-fin" },
      },
      {
        label: "Finance Settings",
        href: "/home/finance/settings",
        permission: { type: "section", id: "finance-settings" },
      },
    ],
  },
  {
    label: "Car Booking",
    icon: Car,
    permission: { type: "page", id: "car-booking" },
    subsections: [
      {
        label: "Bookings",
        href: "/home/jmave/bookings",
        permission: { type: "section", id: "bookings" },
        badge: "12",
      },
      {
        label: "Quick Quotations",
        href: "/home/jmave/quick-quotations",
        permission: { type: "section", id: "quick-quotations" },
      },
      {
        label: "Compution and Itenerary",
        href: "/home/jmave/compution-and-itenerary",
        permission: { type: "section", id: "compution-and-itenerary" },
      },
      {
        label: "Internal Breakdowns",
        href: "/home/jmave/internal-breakdowns",
        permission: { type: "section", id: "internal-breakdowns" },
      },
      {
        label: "Vehicle Rental Agreements",
        href: "/home/jmave/vra",
        permission: { type: "section", id: "vra" },
      },
      {
        label: "Car Booking Settings",
        href: "/home/jmave/settings",
        permission: { type: "section", id: "jmave-settings" },
      },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/home/settings",
    permission: { type: "page", id: "settings" },
  },
];

export default function TopNavigation({
  notifications = [],
}: TopNavigationProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { logout } = useLogout();

  const { hasPageAccess, hasSectionAccess, hasSubsectionAccess, isLoading } =
    usePermissions();

  const checkPermission = useCallback(
    (permission?: { type: PermissionType; id: string }) => {
      if (!permission) return true;

      switch (permission.type) {
        case "page":
          return hasPageAccess(permission.id);
        case "section":
          return hasSectionAccess(permission.id);
        case "subsection":
          return hasSubsectionAccess(permission.id);
        default:
          return false;
      }
    },
    [hasPageAccess, hasSectionAccess, hasSubsectionAccess],
  );

  const isActive = useCallback(
    (item: NavItem): boolean => {
      if (item.href) {
        if (pathname === item.href) return true;
        if (pathname.startsWith(`${item.href}/`)) return true;
      }
      return item.subsections?.some(isActive) ?? false;
    },
    [pathname],
  );

  const toggleExpand = useCallback((label: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }, []);

  const filterNavItems = useCallback(
    (items: NavItem[]): NavItem[] => {
      return items
        .map((item) => {
          if (!checkPermission(item.permission)) return null;

          if (item.subsections) {
            const filteredChildren = filterNavItems(item.subsections);

            if (!item.href && filteredChildren.length === 0) return null;

            return {
              ...item,
              subsections: filteredChildren,
            };
          }

          return item;
        })
        .filter(Boolean) as NavItem[];
    },
    [checkPermission],
  );

  const navItems = useMemo(() => {
    if (isLoading) return [];
    return filterNavItems(allNavItems);
  }, [isLoading, filterNavItems]);

  const renderNavItem = useCallback(
    (item: NavItem, depth: number = 0): React.ReactNode => {
      const hasSubs = item.subsections?.length;
      const active = isActive(item);
      const expanded = expandedItems.has(item.label);
      const paddingLeft = depth * 16 + 12;

      return (
        <div key={`${depth}-${item.label}`} className="flex flex-col">
          {hasSubs ? (
            <button
              onClick={() => toggleExpand(item.label)}
              className={`group flex items-center gap-3 rounded-lg px-3 py-3 transition-all text-left w-full ${
                active
                  ? "bg-[#2B3A9F]/10 text-[#2B3A9F]"
                  : "text-slate-600 hover:bg-white hover:text-[#2B3A9F]"
              }`}
              style={{ paddingLeft }}
            >
              {depth === 0 && item.icon && (
                <item.icon
                  className={`h-5 w-5 ${active ? "text-[#2B3A9F]" : ""}`}
                />
              )}

              {depth > 0 && (
                <div
                  className={`h-2 w-2 rounded-full ${
                    active ? "bg-[#2B3A9F]" : "bg-slate-400"
                  }`}
                />
              )}

              <span className="font-medium flex-1">{item.label}</span>

              {item.badge && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                  {item.badge}
                </span>
              )}

              {expanded ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>
          ) : (
            <Link
              href={item.href!}
              onClick={() => setIsOpen(false)}
              className={`group flex items-center gap-3 rounded-lg px-3 py-3 transition-all ${
                pathname === item.href
                  ? "bg-[#2B3A9F] text-white"
                  : "text-slate-600 hover:bg-white hover:text-[#2B3A9F]"
              }`}
              style={{ paddingLeft }}
            >
              {depth === 0 && item.icon && (
                <item.icon
                  className={`h-5 w-5 ${
                    pathname === item.href ? "text-white" : ""
                  }`}
                />
              )}

              {depth > 0 && (
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    pathname === item.href ? "bg-white" : "bg-slate-400"
                  }`}
                />
              )}

              <span className="font-medium">{item.label}</span>

              <ChevronRight
                className={`ml-auto h-4 w-4 transition-all ${
                  pathname === item.href
                    ? "opacity-100 text-white"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              />
            </Link>
          )}

          {hasSubs && expanded && (
            <div
              className={`mt-1 flex flex-col gap-1 ${
                depth === 0
                  ? "ml-4 border-l-2 border-slate-200 pl-4"
                  : "ml-2 pl-2"
              }`}
            >
              {item.subsections!.map((sub) => renderNavItem(sub, depth + 1))}
            </div>
          )}
        </div>
      );
    },
    [expandedItems, isActive, pathname, toggleExpand],
  );

  useEffect(() => {
    const findParents = (
      items: NavItem[],
      path: string,
      parents: string[] = [],
    ): string[] => {
      for (const item of items) {
        if (item.href && path.startsWith(item.href)) return parents;

        if (item.subsections) {
          const found = findParents(item.subsections, path, [
            ...parents,
            item.label,
          ]);
          if (found.length) return found;
        }
      }
      return [];
    };

    const parents = findParents(navItems, pathname);

    if (parents.length) {
      setExpandedItems((prev) => new Set([...prev, ...parents]));
    }
  }, [pathname, navItems]);

  function getInitials() {
    const name = useFullName().fullName;
    const parts = name?.split(" ") || [];

    const initials =
      parts.length > 0
        ? parts
            .slice(0, 2)
            .map((p) => p[0].toUpperCase())
            .join("")
        : "JD";

    return { initials, name: name || null };
  }

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-center px-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2B3A9F]/30 border-t-[#2B3A9F]" />
            <span className="text-slate-500">Loading navigation...</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-slate-700" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-80 p-0 bg-slate-50">
              <SheetHeader className="border-b border-slate-200 bg-white p-6">
                <SheetTitle className="flex items-center gap-3">
                  <Image
                    src="/astra_logo_small.png"
                    alt="Astra"
                    width={50}
                    height={50}
                    priority
                  />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-slate-900">
                      Astra Portal
                    </span>
                    <span className="text-xs text-slate-500">
                      Astra Business Solutions
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1 p-4 pb-24">
                {navItems.map((item) => renderNavItem(item))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/home" className="flex items-center gap-3">
            <Image
              src="/astra_logo_small.png"
              alt="Astra"
              width={50}
              height={50}
              priority
            />
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          {/* <Notifications initialNotifications={notifications} /> */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9 border-2 border-slate-200">
                  <AvatarImage src="/avatar.png" />
                  <AvatarFallback>{getInitials().initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">{getInitials().name}</p>
                  <p className="text-xs text-slate-500">{useEmail().email}</p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>

              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={logout}
                className="text-red-600 cursor-pointer flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

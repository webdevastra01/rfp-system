"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Shield,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  UserCog,
  Wallet,
  Settings,
  FileText,
  LayoutDashboard,
  Loader2,
  Car,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Types
interface PermissionAction {
  id: string;
  name: string;
  enabled: boolean;
}

interface PermissionSection {
  id: string;
  name: string;
  enabled: boolean;
  subsections?: PermissionSection[];
  actions?: PermissionAction[];
}

interface PermissionPage {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  sections: PermissionSection[];
}

interface UserPermissionsData {
  permitted_pages: string[];
  permitted_sections: string[];
  permitted_subsections: string[];
  permitted_actions: string[];
}

interface RolePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onPermissionsChange?: (permissions: PermissionPage[]) => void;
}

// Default permissions structure (all defined IDs)
const createDefaultPermissions = (): PermissionPage[] => [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    enabled: true,
    sections: [],
  },
  {
    id: "employee-portal",
    name: "Employee Portal",
    icon: <UserCog className="w-5 h-5" />,
    enabled: true,
    sections: [
      {
        id: "requests",
        name: "Requests",
        enabled: true,
        subsections: [
          {
            id: "service-request",
            name: "Service Request",
            enabled: true,
            actions: [
              {
                id: "approve-reject-service",
                name: "Approve/Reject Requests",
                enabled: false,
              },
            ],
          },
          {
            id: "purchase-request",
            name: "Purchase Request",
            enabled: true,
            actions: [
              {
                id: "approve-reject-purchase",
                name: "Approve/Reject Requests",
                enabled: false,
              },
            ],
          },
        ],
      },
      {
        id: "rfp-emp",
        name: "Request for Payment",
        enabled: true,
      },
      {
        id: "liquidation-emp",
        name: "Liquidation",
        enabled: true,
      },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    icon: <Wallet className="w-5 h-5" />,
    enabled: true,
    sections: [
      { id: "service-requests", name: "Service Requests", enabled: true },
      { id: "purchase-requests", name: "Purchase Requests", enabled: true },
      { id: "review-requests", name: "Review Requests", enabled: true },
      { id: "service-order", name: "Service Order", enabled: true },
      { id: "purchase-order", name: "Purchase Order", enabled: true },
      { id: "review-orders", name: "Review Orders", enabled: true },
      {
        id: "rfp-finance",
        name: "Request for Payment",
        enabled: true,
        actions: [
          {
            id: "approve-reject-rfp-fin",
            name: "Approve/Reject Requests",
            enabled: false,
          },
        ],
      },
      {
        id: "liquidation-fin",
        name: "Liquidation",
        enabled: true,
        actions: [
          {
            id: "approve-reject-liq-fin",
            name: "Approve/Reject Requests",
            enabled: false,
          },
        ],
      },
      { id: "finance-settings", name: "Settings", enabled: true },
    ],
  },
  {
    id: "car-booking",
    name: "Car Booking",
    icon: <Car className="w-5 h-5" />,
    enabled: true,
    sections: [
      { id: "bookings", name: "Bookings", enabled: true },
      { id: "quick-quotations", name: "Quick Quotations", enabled: true },
      {
        id: "compution-and-itenerary",
        name: "Compution and Itenerary",
        enabled: true,
      },
      { id: "internal-breakdowns", name: "Internal Breakdowns", enabled: true },
      { id: "vra", name: "Vehicle Rental Agreements", enabled: true },
      { id: "jmave-settings", name: "Car Booking Settings", enabled: true },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    icon: <Settings className="w-5 h-5" />,
    enabled: true,
    sections: [
      { id: "user-account", name: "User Account Settings", enabled: true },
      { id: "company", name: "Company Settings", enabled: true },
      { id: "branch", name: "Branch Settings", enabled: true },
      { id: "department", name: "Department Settings", enabled: true },
      { id: "roles", name: "Roles Settings", enabled: true },
    ],
  },
];

// Extract all permitted IDs from the permission tree
const extractPermittedIds = (
  permissions: PermissionPage[],
): UserPermissionsData => {
  const data: UserPermissionsData = {
    permitted_pages: [],
    permitted_sections: [],
    permitted_subsections: [],
    permitted_actions: [],
  };

  permissions.forEach((page) => {
    if (page.enabled) data.permitted_pages.push(page.id);

    page.sections.forEach((section) => {
      if (section.enabled) data.permitted_sections.push(section.id);

      section.subsections?.forEach((sub) => {
        if (sub.enabled) data.permitted_subsections.push(sub.id);
        sub.actions?.forEach((action) => {
          if (action.enabled) data.permitted_actions.push(action.id);
        });
      });

      section.actions?.forEach((action) => {
        if (action.enabled) data.permitted_actions.push(action.id);
      });
    });
  });

  return data;
};

// Apply permitted IDs to the default permission structure
const applyPermittedIds = (
  defaults: PermissionPage[],
  permitted: UserPermissionsData,
): PermissionPage[] => {
  const pageSet = new Set(permitted.permitted_pages);
  const sectionSet = new Set(permitted.permitted_sections);
  const subsectionSet = new Set(permitted.permitted_subsections);
  const actionSet = new Set(permitted.permitted_actions);

  return defaults.map((page) => ({
    ...page,
    enabled: pageSet.has(page.id),
    sections: page.sections.map((section) => ({
      ...section,
      enabled: sectionSet.has(section.id),
      subsections: section.subsections?.map((sub) => ({
        ...sub,
        enabled: subsectionSet.has(sub.id),
        actions: sub.actions?.map((action) => ({
          ...action,
          enabled: actionSet.has(action.id),
        })),
      })),
      actions: section.actions?.map((action) => ({
        ...action,
        enabled: actionSet.has(action.id),
      })),
    })),
  }));
};

export default function RolePermissionsDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onPermissionsChange,
}: RolePermissionsDialogProps) {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [permissions, setPermissions] = useState<PermissionPage[]>(
    createDefaultPermissions(),
  );
  const [expandedPages, setExpandedPages] = useState<Set<string>>(
    new Set(createDefaultPermissions().map((p) => p.id)),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingPermissions, setHasExistingPermissions] = useState(false);

  // Fetch existing permissions when dialog opens
  useEffect(() => {
    if (!open || !userId) return;

    const fetchPermissions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_permissions")
          .select(
            "permitted_pages, permitted_sections, permitted_subsections, permitted_actions",
          )
          .eq("user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows

        if (data) {
          setHasExistingPermissions(true);
          const permitted: UserPermissionsData = {
            permitted_pages: data.permitted_pages || [],
            permitted_sections: data.permitted_sections || [],
            permitted_subsections: data.permitted_subsections || [],
            permitted_actions: data.permitted_actions || [],
          };
          const merged = applyPermittedIds(
            createDefaultPermissions(),
            permitted,
          );
          setPermissions(merged);
        } else {
          // New user - all enabled by default
          setHasExistingPermissions(false);
          setPermissions(createDefaultPermissions());
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
        setPermissions(createDefaultPermissions());
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [open, userId, supabase]);

  // Filter permissions based on search
  const filteredPermissions = permissions.filter((page) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      page.name.toLowerCase().includes(query) ||
      page.sections.some(
        (section) =>
          section.name.toLowerCase().includes(query) ||
          section.subsections?.some((sub) =>
            sub.name.toLowerCase().includes(query),
          ) ||
          section.actions?.some((action) =>
            action.name.toLowerCase().includes(query),
          ),
      )
    );
  });

  const togglePage = (pageId: string) => {
    setExpandedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) newSet.delete(pageId);
      else newSet.add(pageId);
      return newSet;
    });
  };

  const updatePageEnabled = (pageId: string, enabled: boolean) => {
    setPermissions((prev) =>
      prev.map((page) => (page.id === pageId ? { ...page, enabled } : page)),
    );
  };

  const updateSectionEnabled = (
    pageId: string,
    sectionId: string,
    enabled: boolean,
  ) => {
    setPermissions((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        return {
          ...page,
          sections: page.sections.map((section) =>
            section.id === sectionId ? { ...section, enabled } : section,
          ),
        };
      }),
    );
  };

  const updateSubsectionEnabled = (
    pageId: string,
    sectionId: string,
    subsectionId: string,
    enabled: boolean,
  ) => {
    setPermissions((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        return {
          ...page,
          sections: page.sections.map((section) => {
            if (section.id !== sectionId) return section;
            return {
              ...section,
              subsections: section.subsections?.map((sub) =>
                sub.id === subsectionId ? { ...sub, enabled } : sub,
              ),
            };
          }),
        };
      }),
    );
  };

  const updateActionEnabled = (
    pageId: string,
    sectionId: string,
    actionId: string,
    enabled: boolean,
    isSubsection: boolean = false,
    subsectionId?: string,
  ) => {
    setPermissions((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        return {
          ...page,
          sections: page.sections.map((section) => {
            if (section.id !== sectionId) return section;

            if (isSubsection && subsectionId) {
              return {
                ...section,
                subsections: section.subsections?.map((sub) => {
                  if (sub.id !== subsectionId) return sub;
                  return {
                    ...sub,
                    actions: sub.actions?.map((action) =>
                      action.id === actionId ? { ...action, enabled } : action,
                    ),
                  };
                }),
              };
            }

            return {
              ...section,
              actions: section.actions?.map((action) =>
                action.id === actionId ? { ...action, enabled } : action,
              ),
            };
          }),
        };
      }),
    );
  };

  // Save permissions to database using JSONB upsert
  const savePermissions = async () => {
    setIsSaving(true);
    try {
      const permittedData = extractPermittedIds(permissions);

      const { error } = await supabase.from("user_permissions").upsert(
        {
          user_id: userId,
          ...permittedData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) throw error;

      setHasExistingPermissions(true);
      onPermissionsChange?.(permissions);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving permissions:", error);
      alert("Failed to save permissions. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getEnabledCount = (page: PermissionPage) => {
    let count = 0;
    if (page.enabled) count++;
    page.sections.forEach((section) => {
      if (section.enabled) count++;
      section.subsections?.forEach((sub) => {
        if (sub.enabled) count++;
      });
      section.actions?.forEach((action) => {
        if (action.enabled) count++;
      });
    });
    return count;
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] lg:max-w-[1000px] w-full max-h-[90vh] overflow-y-auto p-6 border-t-4 border-t-sky-600">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            <span className="ml-2 text-slate-600">Loading permissions...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] lg:max-w-[1000px] w-full max-h-[90vh] overflow-y-auto p-6 border-t-4 border-t-sky-600">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl flex items-center gap-2 text-sky-600">
            <div className="p-2 rounded-lg bg-sky-50">
              <Shield className="w-6 h-6 text-sky-600" />
            </div>
            Role Permissions
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Manage access permissions for{" "}
            <span className="font-semibold text-sky-600">{userName}</span>.
            {hasExistingPermissions
              ? " Updating existing permissions."
              : " Setting up default permissions for new user."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-600" />
              <Input
                placeholder="Search permissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-slate-200 focus:border-sky-600 focus:ring-sky-600/20"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Badge
                variant="outline"
                className="bg-sky-50 text-sky-700 border-sky-200"
              >
                {permissions.reduce(
                  (acc, page) => acc + getEnabledCount(page),
                  0,
                )}{" "}
                Enabled
              </Badge>
            </div>
          </div>

          {/* Permissions Tree */}
          <div className="space-y-4">
            {filteredPermissions.map((page) => (
              <Card
                key={page.id}
                className={cn(
                  "border-slate-200 shadow-sm overflow-hidden transition-all duration-200",
                  !page.enabled && "opacity-60",
                )}
              >
                {/* Page Header */}
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {page.sections.length > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-sky-100"
                          onClick={() => togglePage(page.id)}
                        >
                          {expandedPages.has(page.id) ? (
                            <ChevronDown className="w-4 h-4 text-sky-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-sky-600" />
                          )}
                        </Button>
                      ) : (
                        <div className="w-8" />
                      )}
                      <div className="p-2 rounded-lg bg-sky-100 text-sky-600">
                        {page.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                          {page.name}
                          <Badge className="bg-sky-100 text-sky-700 border-sky-200">
                            {getEnabledCount(page)}
                          </Badge>
                        </CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-sm text-slate-600 cursor-pointer">
                        Access
                      </Label>
                      <Checkbox
                        checked={page.enabled}
                        onCheckedChange={(checked) =>
                          updatePageEnabled(page.id, checked as boolean)
                        }
                        className="data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                      />
                    </div>
                  </div>
                </CardHeader>

                {/* Sections */}
                {expandedPages.has(page.id) && page.sections.length > 0 && (
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {page.sections.map((section) => (
                        <div key={section.id} className="p-4">
                          {/* Section Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 pl-4">
                              <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                              <h4 className="font-medium text-slate-800">
                                {section.name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={section.enabled}
                                onCheckedChange={(checked) =>
                                  updateSectionEnabled(
                                    page.id,
                                    section.id,
                                    checked as boolean,
                                  )
                                }
                                className="data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                              />
                            </div>
                          </div>

                          {/* Subsections */}
                          {section.subsections &&
                            section.subsections.length > 0 && (
                              <div className="ml-8 space-y-2 mb-3">
                                {section.subsections.map((subsection) => (
                                  <div
                                    key={subsection.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-100"
                                  >
                                    <div className="flex items-center gap-3">
                                      <FileText className="w-4 h-4 text-slate-400" />
                                      <span className="text-sm font-medium text-slate-700">
                                        {subsection.name}
                                      </span>
                                    </div>
                                    <Checkbox
                                      checked={subsection.enabled}
                                      onCheckedChange={(checked) =>
                                        updateSubsectionEnabled(
                                          page.id,
                                          section.id,
                                          subsection.id,
                                          checked as boolean,
                                        )
                                      }
                                      className="data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                          {/* Actions */}
                          {section.actions && section.actions.length > 0 && (
                            <div className="ml-8 flex flex-wrap gap-2">
                              {section.actions.map((action) => (
                                <div
                                  key={action.id}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-full border transition-colors",
                                    action.enabled
                                      ? "bg-sky-50 border-sky-200 text-sky-700"
                                      : "bg-slate-50 border-slate-200 text-slate-500",
                                  )}
                                >
                                  <Checkbox
                                    checked={action.enabled}
                                    onCheckedChange={(checked) =>
                                      updateActionEnabled(
                                        page.id,
                                        section.id,
                                        action.id,
                                        checked as boolean,
                                        false,
                                      )
                                    }
                                    className="data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                                  />
                                  <span className="text-xs font-medium">
                                    {action.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 mt-6 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-200 hover:bg-slate-50"
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={savePermissions}
            className="bg-sky-600 hover:bg-sky-700 text-white"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {hasExistingPermissions
                  ? "Update Permissions"
                  : "Save Permissions"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

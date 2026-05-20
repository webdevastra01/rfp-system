"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  User,
  Car,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowUpDown,
  FileText,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Booking, StatCardProps } from "@/lib/interfaces";
import BookingStatusBadge from "./BookingStatusBadge";
import BookingDetailDialog from "./BookingDetailDialog";

const ITEMS_PER_PAGE = 10;

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_BOOKINGS: Booking[] = [
  {
    id: "1",
    reference: "BK-2026-001",
    requester: "Sarah Mitchell",
    department: "Sales",
    vehicleType: "Sedan",
    vehicleId: "VH-1042",
    destination: "Downtown Conference Center",
    purpose: "Client meeting with Apex Industries",
    startDate: "2026-05-21T09:00",
    endDate: "2026-05-21T14:00",
    passengers: 2,
    status: "pending",
    requestedAt: "2026-05-20T10:30",
  },
  {
    id: "2",
    reference: "BK-2026-002",
    requester: "James Rodriguez",
    department: "Operations",
    vehicleType: "Van",
    vehicleId: "VH-2056",
    destination: "Warehouse District - Block C",
    purpose: "Equipment transport for inventory audit",
    startDate: "2026-05-22T07:00",
    endDate: "2026-05-22T16:00",
    passengers: 4,
    status: "approved",
    requestedAt: "2026-05-19T14:15",
    approver: "Michael Chen",
    approvedAt: "2026-05-19T16:45",
  },
  {
    id: "3",
    reference: "BK-2026-003",
    requester: "Emily Watson",
    department: "HR",
    vehicleType: "SUV",
    vehicleId: "VH-3018",
    destination: "Airport - Terminal 2",
    purpose: "Executive pickup - Board member arrival",
    startDate: "2026-05-21T16:00",
    endDate: "2026-05-21T19:00",
    passengers: 1,
    status: "approved",
    requestedAt: "2026-05-20T08:00",
    approver: "David Park",
    approvedAt: "2026-05-20T09:30",
  },
  {
    id: "4",
    reference: "BK-2026-004",
    requester: "Robert Kim",
    department: "Finance",
    vehicleType: "Sedan",
    vehicleId: "VH-1045",
    destination: "Regional Tax Office",
    purpose: "Quarterly tax filing submission",
    startDate: "2026-05-23T10:00",
    endDate: "2026-05-23T12:00",
    passengers: 1,
    status: "rejected",
    requestedAt: "2026-05-18T11:20",
    approver: "Lisa Thompson",
    approvedAt: "2026-05-18T13:00",
    rejectionReason: "Vehicle unavailable - scheduled maintenance",
  },
  {
    id: "5",
    reference: "BK-2026-005",
    requester: "Amanda Foster",
    department: "Procurement",
    vehicleType: "Truck",
    vehicleId: "VH-4089",
    destination: "Supplier Facility - North Zone",
    purpose: "Bulk material collection - Q2 supplies",
    startDate: "2026-05-24T06:00",
    endDate: "2026-05-24T18:00",
    passengers: 2,
    status: "pending",
    requestedAt: "2026-05-20T15:45",
  },
  {
    id: "6",
    reference: "BK-2026-006",
    requester: "Daniel Lee",
    department: "Logistics",
    vehicleType: "Van",
    vehicleId: "VH-2061",
    destination: "Distribution Center - East Hub",
    purpose: "Route optimization survey and delivery",
    startDate: "2026-05-22T08:00",
    endDate: "2026-05-22T17:00",
    passengers: 3,
    status: "pending",
    requestedAt: "2026-05-20T09:15",
  },
  {
    id: "7",
    reference: "BK-2026-007",
    requester: "Michelle Brooks",
    department: "Sales",
    vehicleType: "Sedan",
    vehicleId: "VH-1050",
    destination: "Tech Park - Building 7",
    purpose: "Product demo for prospective client",
    startDate: "2026-05-25T13:00",
    endDate: "2026-05-25T16:00",
    passengers: 2,
    status: "approved",
    requestedAt: "2026-05-19T10:00",
    approver: "Michael Chen",
    approvedAt: "2026-05-19T11:30",
  },
  {
    id: "8",
    reference: "BK-2026-008",
    requester: "Christopher Evans",
    department: "Project Management",
    vehicleType: "SUV",
    vehicleId: "VH-3025",
    destination: "Construction Site - Phase 2",
    purpose: "Site inspection and progress review",
    startDate: "2026-05-23T07:30",
    endDate: "2026-05-23T15:30",
    passengers: 5,
    status: "pending",
    requestedAt: "2026-05-20T16:20",
  },
  {
    id: "9",
    reference: "BK-2026-009",
    requester: "Jennifer Walsh",
    department: "Customer Service",
    vehicleType: "Sedan",
    vehicleId: "VH-1055",
    destination: "Client Office - West District",
    purpose: "On-site support and system training",
    startDate: "2026-05-24T09:00",
    endDate: "2026-05-24T13:00",
    passengers: 2,
    status: "rejected",
    requestedAt: "2026-05-19T13:10",
    approver: "David Park",
    approvedAt: "2026-05-19T15:20",
    rejectionReason: "Duplicate request - BK-2026-007 covers same route",
  },
  {
    id: "10",
    reference: "BK-2026-010",
    requester: "Kevin Martinez",
    department: "IT",
    vehicleType: "Van",
    vehicleId: "VH-2070",
    destination: "Data Center - Remote Facility",
    purpose: "Hardware delivery and installation",
    startDate: "2026-05-26T08:00",
    endDate: "2026-05-26T16:00",
    passengers: 3,
    status: "approved",
    requestedAt: "2026-05-18T09:00",
    approver: "Lisa Thompson",
    approvedAt: "2026-05-18T10:15",
  },
  {
    id: "11",
    reference: "BK-2026-011",
    requester: "Rachel Green",
    department: "Marketing",
    vehicleType: "SUV",
    vehicleId: "VH-3030",
    destination: "Exhibition Center - Hall B",
    purpose: "Event setup and material transport",
    startDate: "2026-05-27T06:00",
    endDate: "2026-05-27T20:00",
    passengers: 4,
    status: "pending",
    requestedAt: "2026-05-20T11:00",
  },
  {
    id: "12",
    reference: "BK-2026-012",
    requester: "Thomas Anderson",
    department: "Finance",
    vehicleType: "Sedan",
    vehicleId: "VH-1060",
    destination: "Bank Headquarters",
    purpose: "Confidential document delivery",
    startDate: "2026-05-22T11:00",
    endDate: "2026-05-22T12:30",
    passengers: 1,
    status: "pending",
    requestedAt: "2026-05-20T14:30",
  },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Components ─────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, trend, variant }: StatCardProps) {
  const variantStyles = {
    default: "bg-white border-[#E2E8F0]",
    pending: "bg-white border-amber-200",
    approved: "bg-white border-emerald-200",
    rejected: "bg-white border-rose-200",
  };

  const iconBgStyles = {
    default: "bg-[#EEF2FF] text-[#2B3A9F]",
    pending: "bg-amber-50 text-amber-600",
    approved: "bg-emerald-50 text-emerald-600",
    rejected: "bg-rose-50 text-rose-600",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${variantStyles[variant]} bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {value.toLocaleString()}
          </p>
          {trend && (
            <p className="text-xs font-medium text-slate-500">{trend}</p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBgStyles[variant]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sortField, setSortField] = useState<keyof Booking>("requestedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // ─── Computed Data ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const approved = bookings.filter((b) => b.status === "approved").length;
    const rejected = bookings.filter((b) => b.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (booking) =>
          booking.reference.toLowerCase().includes(query) ||
          booking.requester.toLowerCase().includes(query) ||
          booking.destination.toLowerCase().includes(query) ||
          booking.vehicleId.toLowerCase().includes(query) ||
          booking.purpose.toLowerCase().includes(query) ||
          booking.department.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((booking) => booking.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;

      return 0;
    });

    return result;
  }, [bookings, searchQuery, statusFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSort = (field: keyof Booking) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const handleApprove = (id: string) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id
          ? {
              ...booking,
              status: "approved",
              approver: "Current User",
              approvedAt: new Date().toISOString(),
            }
          : booking,
      ),
    );
  };

  const handleReject = (id: string) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id
          ? {
              ...booking,
              status: "rejected",
              approver: "Current User",
              approvedAt: new Date().toISOString(),
              rejectionReason: "Rejected by administrator",
            }
          : booking,
      ),
    );
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailOpen(true);
  };

  const handleCreateBooking = () => {
    // Placeholder for create booking action
    alert("Create New Booking - This would open a booking creation form");
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto p-6 md:p-8">
        {/* ─── Header Section ─────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Bookings Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage vehicle bookings, approvals, and fleet allocations across
              all departments.
            </p>
          </div>
          <Button
            onClick={handleCreateBooking}
            className="w-fit gap-2 bg-[#2B3A9F] text-white hover:bg-[#1e2870]"
          >
            <Plus className="h-4 w-4" />
            Create New Booking
          </Button>
        </div>

        {/* ─── KPI Stats Row ──────────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Bookings"
            value={stats.total}
            icon={<FileText className="h-5 w-5" />}
            trend="All time records"
            variant="default"
          />
          <StatCard
            title="Pending Bookings"
            value={stats.pending}
            icon={<Clock className="h-5 w-5" />}
            trend="Awaiting approval"
            variant="pending"
          />
          <StatCard
            title="Approved Bookings"
            value={stats.approved}
            icon={<CheckCircle2 className="h-5 w-5" />}
            trend="Confirmed & scheduled"
            variant="approved"
          />
          <StatCard
            title="Rejected Bookings"
            value={stats.rejected}
            icon={<XCircle className="h-5 w-5" />}
            trend="Declined requests"
            variant="rejected"
          />
        </div>

        {/* ─── Main Operational Content ───────────────────────────────────── */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-[#E2E8F0] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by reference, requester, destination..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 border-[#E2E8F0] bg-slate-50 text-sm placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#2B3A9F]/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[160px] border-[#E2E8F0] bg-slate-50 text-sm">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-slate-500">
                {filteredBookings.length} result
                {filteredBookings.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="px-5 py-3 text-left">
                    <button
                      onClick={() => handleSort("reference")}
                      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700"
                    >
                      Reference
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left">
                    <button
                      onClick={() => handleSort("requester")}
                      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700"
                    >
                      Requester
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vehicle
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Destination
                  </th>
                  <th className="px-5 py-3 text-left">
                    <button
                      onClick={() => handleSort("startDate")}
                      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700"
                    >
                      Schedule
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {paginatedBookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-slate-300" />
                        <p>No bookings found matching your criteria.</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("all");
                            setCurrentPage(1);
                          }}
                          className="text-[#2B3A9F]"
                        >
                          Clear filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="group transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#2B3A9F]">
                            {booking.reference}
                          </span>
                          <span className="text-xs text-slate-500">
                            {booking.department}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF2FF] text-xs font-bold text-[#2B3A9F]">
                            {booking.requester
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">
                              {booking.requester}
                            </span>
                            <span className="text-xs text-slate-500">
                              {booking.passengers}{" "}
                              {booking.passengers === 1
                                ? "passenger"
                                : "passengers"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">
                            {booking.vehicleType}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            {booking.vehicleId}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="text-sm text-slate-700 line-clamp-2">
                            {booking.destination}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 text-sm text-slate-700">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(booking.startDate)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {formatTime(booking.startDate)} -{" "}
                            {formatTime(booking.endDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <BookingStatusBadge status={booking.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(booking)}
                            className="h-8 gap-1.5 text-xs text-slate-600 hover:text-[#2B3A9F] hover:bg-[#EEF2FF]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>

                          {booking.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(booking.id)}
                                className="h-8 gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReject(booking.id)}
                                className="h-8 gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              >
                                <X className="h-3.5 w-3.5" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#E2E8F0] px-5 py-4">
              <div className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-700">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-700">
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredBookings.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-700">
                  {filteredBookings.length}
                </span>{" "}
                results
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 border-[#E2E8F0]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 p-0 text-xs ${
                        currentPage === page
                          ? "bg-[#2B3A9F] text-white hover:bg-[#1e2870]"
                          : "border-[#E2E8F0] text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </Button>
                  ),
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 border-[#E2E8F0]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Detail Dialog */}
      <BookingDetailDialog
        booking={selectedBooking}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}

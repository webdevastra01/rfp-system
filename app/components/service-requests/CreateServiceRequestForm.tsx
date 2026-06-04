"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  Plus,
  Trash2,
  X,
  FileText,
  Calendar,
  Building2,
  Briefcase,
  CreditCard,
  Package,
  User,
  Upload,
  ArrowRight,
  Wrench,
  Hash,
  Calculator,
  Clock,
  Car,
  ArrowLeft,
  ChevronsUpDown,
  Check,
  Loader2,
} from "lucide-react";
import { useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateServiceRequestFormProps, ServiceItem } from "@/lib/interfaces";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { SearchableCombobox } from "../inputs/SearchableCombobox";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function CreateServiceRequestForm({
  types,
  companies,
  departments,
  vehicles,
  vendors,
  paymentMethods,
  units,
  module,
}: CreateServiceRequestFormProps) {
  const router = useRouter();

  // === FORM STATE ===
  const [title, setTitle] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [expectedCompletion, setExpectedCompletion] = useState("");
  const [requiredBy, setRequiredBy] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection states
  const [priority, setPriority] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [plateNumber, setPlateNumber] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // Items state
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    unit: "",
    quantity: 0,
    unitPrice: 0,
  });

  // Vendor state
  const [selectedVendor, setSelectedVendor] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [isContactAutoFilled, setIsContactAutoFilled] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [contactTouched, setContactTouched] = useState(false);
  const [openPopover, setOpenPopover] = useState(false);

  // === COMPUTED ===
  const selectedPlateNumber = vehicles?.find(
    (p) => p.vehicle_id === plateNumber,
  );

  const itemTotal = useMemo(() => {
    return (newItem.quantity || 0) * (newItem.unitPrice || 0);
  }, [newItem.quantity, newItem.unitPrice]);

  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);

  // === OPTIONS MEMO ===
  const vehicleOptions = useMemo(() => {
    return (
      vehicles?.map((v) => ({
        ...v,
        id: v.vehicle_id,
        name: v.plate_number,
        subtitle: `${v.car_type} • ${v.owners_first_name} ${v.owners_last_name}`,
      })) || []
    );
  }, [vehicles]);

  const companyOptions = useMemo(() => {
    return (
      companies?.map((c) => ({
        ...c,
        id: c.company_id,
        name: c.name,
      })) || []
    );
  }, [companies]);

  const departmentOptions = useMemo(() => {
    return (
      departments?.map((d) => ({
        ...d,
        id: d.department_id,
        name: d.name,
      })) || []
    );
  }, [departments]);

  const typeOptions = useMemo(() => {
    return (
      types?.map((t) => ({
        ...t,
        id: t.type_id,
        name: t.name,
      })) || []
    );
  }, [types]);

  const paymentMethodOptions = useMemo(() => {
    return (
      paymentMethods?.map((p) => ({
        ...p,
        id: p.payment_method_id,
        name: p.name,
      })) || []
    );
  }, [paymentMethods]);

  const unitOptions = useMemo(() => {
    return (
      units?.map((u) => ({
        ...u,
        id: u.unit_id,
        name: u.name,
      })) || []
    );
  }, [units]);

  // === HANDLERS ===
  const handleAddItem = () => {
    if (!newItem.name || !newItem.unit || newItem.quantity <= 0) {
      toast.error("Cannot add item", {
        description:
          "Please enter the item name, select a unit, and set a quantity greater than 0.",
      });
      return;
    }

    const item: ServiceItem = {
      id: Date.now(),
      name: newItem.name,
      description: newItem.description,
      unit: newItem.unit,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      total: newItem.quantity * newItem.unitPrice,
    };

    setItems([...items, item]);
    setNewItem({
      name: "",
      description: "",
      unit: "",
      quantity: 0,
      unitPrice: 0,
    });

    toast.success("Item added", {
      description: `${item.name} (${item.quantity} ${getUnitName(item.unit)}) added to your request.`,
    });
  };

  const handleRemoveItem = (id: number) => {
    const itemToRemove = items.find((item) => item.id === id);
    setItems(items.filter((item) => item.id !== id));

    if (itemToRemove) {
      toast.info("Item removed", {
        description: `${itemToRemove.name} has been removed from the list.`,
      });
    }
  };

  const handleClearForm = () => {
    setNewItem({
      name: "",
      description: "",
      unit: "",
      quantity: 0,
      unitPrice: 0,
    });
  };

  const getPriorityStyles = (p: string) => {
    switch (p) {
      case "High":
        return {
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          dot: "bg-rose-500",
          button: "border-rose-200 text-rose-700 bg-rose-50/50",
        };
      case "Medium":
        return {
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
          button: "border-amber-200 text-amber-700 bg-amber-50/50",
        };
      case "Low":
        return {
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
          button: "border-emerald-200 text-emerald-700 bg-emerald-50/50",
        };
      default:
        return { badge: "", dot: "", button: "text-slate-500" };
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getVendorByName = useCallback(
    (name: string) => {
      return vendors?.find((v) => v?.name === name) || null;
    },
    [vendors],
  );

  const handleVendorSelect = useCallback(
    (vendorName: string) => {
      if (vendorName === selectedVendor) {
        setSelectedVendor("");
        setSelectedVendorId("");
        setContactPerson("");
        setIsContactAutoFilled(false);
        return;
      }

      const vendor = getVendorByName(vendorName);
      if (!vendor) {
        console.warn("Vendor not found:", vendorName);
        return;
      }

      setSelectedVendor(vendor.name);
      setSelectedVendorId(vendor.vendor_id);

      const vendorContact = vendor?.contact_person?.trim();
      if (vendorContact && (!contactTouched || !contactPerson.trim())) {
        setContactPerson(vendorContact);
        setIsContactAutoFilled(true);
      }
    },
    [selectedVendor, getVendorByName, contactTouched, contactPerson],
  );

  const handleContactChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target?.value ?? "";
      setContactPerson(value);
      setContactTouched(true);
      setIsContactAutoFilled(false);
    },
    [],
  );

  const handleContactFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (isContactAutoFilled) {
        e.target?.select?.();
      }
    },
    [isContactAutoFilled],
  );

  // === UNIT HANDLER - Sync with newItem ===
  const handleUnitSelect = useCallback((unitId: string) => {
    setNewItem((prev) => ({ ...prev, unit: unitId }));
  }, []);

  // Helper to get unit name
  const getUnitName = (unitId: string) => {
    const unit = units?.find((u) => u.unit_id === unitId);
    return unit?.name || unitId;
  };

  // Handler for file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);

    if (selectedFiles.length > 0) {
      toast.success(
        `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`,
        {
          description: "Files are ready to upload with your request.",
        },
      );
    }
  };

  // Handler for click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handler for drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);

    if (droppedFiles.length > 0) {
      toast.success(
        `${droppedFiles.length} file${droppedFiles.length > 1 ? "s" : ""} added`,
        {
          description: "Files dropped successfully.",
        },
      );
    }
  };

  // Remove a file
  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    setFiles((prev) => prev.filter((_, i) => i !== index));

    if (fileToRemove) {
      toast.info("File removed", {
        description: `${fileToRemove.name} has been removed.`,
      });
    }
  };

  // === FILE UPLOAD LOGIC ===
  const uploadFiles = async () => {
    const supabase = createClient();
    const fileIds: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      const filePath = `service-requests/${fileName}`;

      // 1️⃣ Upload file
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Upload failed", {
          description: `Could not upload ${file.name}. Please check your connection and try again.`,
        });
        throw uploadError;
      }

      // 2️⃣ Generate long signed URL
      const twentyYears = 60 * 60 * 24 * 365 * 20;

      const { data: signedData, error: signedError } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, twentyYears);

      if (signedError) {
        console.error("Signed URL error:", signedError);
        toast.error("File processing failed", {
          description: "Could not generate secure link for the file.",
        });
        throw signedError;
      }

      const url = signedData?.signedUrl;

      // 3️⃣ Insert into files table
      const { data: fileRecord, error: insertError } = await supabase
        .from("files")
        .insert([
          {
            type: file.type,
            url: url,
          },
        ])
        .select("file_id")
        .single();

      if (insertError) {
        console.error("Insert file error:", insertError);
        toast.error("File save failed", {
          description: "Could not save file information to the database.",
        });
        throw insertError;
      }

      // 4️⃣ Collect IDs
      fileIds.push(fileRecord.file_id);
    }

    return fileIds;
  };

  // === CREATE SERVICE REQUEST ===
  const createServiceRequest = useCallback(async () => {
    // Validation checks with clear error messages
    if (!title.trim()) {
      toast.error("Service title is required", {
        description:
          "Please enter a descriptive title for this service request.",
      });
      return;
    }
    if (!category) {
      toast.error("Service category is required", {
        description: "Please select a category from the dropdown.",
      });
      return;
    }
    if (!priority) {
      toast.error("Priority level is required", {
        description: "Please select High, Medium, or Low priority.",
      });
      return;
    }
    if (!company) {
      toast.error("Company is required", {
        description: "Please select the company requesting this service.",
      });
      return;
    }
    if (items.length === 0) {
      toast.error("At least one item is required", {
        description: "Please add materials or labor items to your request.",
      });
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your service request...", {
      description: "This may take a moment if files are being uploaded.",
    });

    const supabase = createClient();

    const storedUser = localStorage.getItem("userProfile");
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (!user?.profile.user_id) {
      toast.error("Authentication required", {
        description: "Please sign in to submit a service request.",
        id: toastId,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // 1️⃣ Upload files first
      let fileIds: string[] = [];
      if (files.length > 0) {
        toast.loading(
          `Uploading ${files.length} file${files.length > 1 ? "s" : ""}...`,
          { id: toastId },
        );
        fileIds = await uploadFiles();
      }

      // 2️⃣ Build payload
      const payload = {
        title,
        service_category: category,
        priority_level: priority,
        company: company,
        department: department || null,
        vehicle: plateNumber || null,

        preferred_date: preferredDate || null,
        expected_completion: expectedCompletion || null,
        required_by: requiredBy || null,

        preferred_vendor: selectedVendor || null,
        contact_person: contactPerson || null,
        payment_method: paymentMethod || null,

        description: serviceDescription || null,
        items: items,

        requested_by: user.user_id,

        // store uploaded file IDs
        supporting_documents: fileIds,
      };

      // 3️⃣ Insert service request
      toast.loading("Finalizing your request...", { id: toastId });
      const { data, error } = await supabase
        .from("service_requests")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      toast.success("Service request submitted successfully", {
        description: `Request #${data.request_number} has been created and sent for approval.`,
        id: toastId,
        duration: 6000,
      });
      router.push(`/home/${module}/service-requests`);
    } catch (err: any) {
      console.error("Create Service Request Error:", err);
      toast.error("Failed to submit request", {
        description:
          err.message ||
          "An unexpected error occurred. Please try again or contact support.",
        id: toastId,
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    title,
    category,
    priority,
    company,
    department,
    plateNumber,
    preferredDate,
    expectedCompletion,
    requiredBy,
    selectedVendor,
    contactPerson,
    paymentMethod,
    serviceDescription,
    items,
    files,
  ]);

  // === VALIDATION ===
  const isSubmitDisabled = useMemo(() => {
    return (
      !title.trim() ||
      !category ||
      !priority ||
      !company ||
      items.length === 0 ||
      isSubmitting
    );
  }, [title, category, priority, company, items, isSubmitting]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-3">
            <Link href={`/home/${module}/service-requests`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="secondary"
                  className="bg-indigo-50 text-[#2B3A9F] border-indigo-200 font-medium"
                >
                  <Wrench className="w-3 h-3 mr-1" />
                  New Service Request
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Create Service Request
              </h1>
              <p className="text-sm text-slate-500">
                Submit a service request for materials, labor, or maintenance
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Request Information Card */}
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-md">
                  <FileText className="w-4 h-4 text-[#2B3A9F]" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Request Details
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-900">
                  Service Title <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Office Air Conditioning Repair"
                  className="h-11 border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 bg-white"
                />
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Service Category */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    Service Category <span className="text-rose-500">*</span>
                  </Label>
                  <SearchableCombobox
                    value={category}
                    onSelect={(id) => setCategory(id)}
                    options={typeOptions}
                    placeholder="Search or select category..."
                    searchPlaceholder="Search categories..."
                    emptyMessage="No categories found."
                    valueKey="type_id"
                    displayKey="name"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getPriorityStyles(priority).dot}`}
                    />
                    Priority Level <span className="text-rose-500">*</span>
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-between h-11 border-slate-200 hover:border-slate-300 transition-colors ${priority ? getPriorityStyles(priority).button : "text-slate-500"}`}
                      >
                        {priority || "Select priority"}
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start">
                      {[
                        {
                          label: "High",
                          color: "text-rose-600",
                          bg: "bg-rose-50",
                        },
                        {
                          label: "Medium",
                          color: "text-amber-600",
                          bg: "bg-amber-50",
                        },
                        {
                          label: "Low",
                          color: "text-emerald-600",
                          bg: "bg-emerald-50",
                        },
                      ].map((p) => (
                        <DropdownMenuItem
                          key={p.label}
                          className={`cursor-pointer ${p.color}`}
                          onClick={() => setPriority(p.label)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${p.color.replace("text-", "bg-")}`}
                            />
                            {p.label}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    Company <span className="text-rose-500">*</span>
                  </Label>
                  <SearchableCombobox
                    value={company}
                    onSelect={(id) => setCompany(id)}
                    options={companyOptions}
                    placeholder="Search or select company..."
                    searchPlaceholder="Search companies..."
                    emptyMessage="No companies found."
                    valueKey="company_id"
                    displayKey="name"
                  />
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Department
                  </Label>
                  <SearchableCombobox
                    value={department}
                    onSelect={(id) => setDepartment(id)}
                    options={departmentOptions}
                    placeholder="Search or select department..."
                    searchPlaceholder="Search departments..."
                    emptyMessage="No departments found."
                    valueKey="department_id"
                    displayKey="name"
                    optional
                    optionalLabel="No Department"
                  />
                </div>

                {/* Preferred Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Preferred Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="h-11 pl-10 border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                </div>

                {/* Expected Completion */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Expected Completion
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      type="date"
                      value={expectedCompletion}
                      onChange={(e) => setExpectedCompletion(e.target.value)}
                      className="h-11 pl-10 border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-100" />

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-900">
                  Service Description <span className="text-rose-500">*</span>
                </Label>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Describe the service needed, including scope of work, specific requirements, and any relevant details..."
                  className="w-full min-h-25 px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2B3A9F]/40 focus:border-[#2B3A9F]/80 resize-y transition-all"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-400" />
                  Supporting Documents
                  {files.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-indigo-50 text-[#2B3A9F]"
                    >
                      {files.length} file{files.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </Label>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                />

                {/* Clickable drop zone */}
                <div
                  onClick={handleUploadClick}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-[#2B3A9F]/80 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#2B3A9F]/20 transition-colors">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#2B3A9F]" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 mb-1">
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-slate-500">
                    PDF, images, or documents up to 10MB
                  </p>
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-sm text-slate-700 truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Asset Vehicles */}
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-md">
                  <Car className="w-4 h-4 text-[#2B3A9F]" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Asset Vehicle
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Plate Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    Plate Number
                  </Label>
                  <SearchableCombobox
                    value={plateNumber}
                    onSelect={(id) => setPlateNumber(id)}
                    options={vehicleOptions}
                    placeholder="Search or select plate..."
                    searchPlaceholder="Search by plate, type, or owner..."
                    emptyMessage="No vehicles found."
                    valueKey="vehicle_id"
                    displayKey="plate_number"
                    optional
                    optionalLabel="No Vehicle"
                  />
                </div>

                {/* Car Type - Read only */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Car Type
                  </Label>
                  <div className="h-11 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-slate-700 text-sm flex items-center">
                    {selectedPlateNumber?.car_type || (
                      <span className="text-slate-400">
                        Select vehicle first
                      </span>
                    )}
                  </div>
                </div>

                {/* Owner's First Name - Read only */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Owner&apos;s First Name
                  </Label>
                  <div className="h-11 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-slate-700 text-sm flex items-center">
                    {selectedPlateNumber?.owners_first_name || (
                      <span className="text-slate-400">
                        Select vehicle first
                      </span>
                    )}
                  </div>
                </div>

                {/* Owner's Last Name - Read only */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Owner&apos;s Last Name
                  </Label>
                  <div className="h-11 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-slate-700 text-sm flex items-center">
                    {selectedPlateNumber?.owners_last_name || (
                      <span className="text-slate-400">
                        Select vehicle first
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor & Payment Card */}
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-md">
                  <User className="w-4 h-4 text-[#2B3A9F]" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Vendor & Payment
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Preferred Vendor */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Preferred Vendor
                    <span className="text-slate-400 font-normal ml-1">
                      (Optional)
                    </span>
                  </Label>
                  <Popover open={openPopover} onOpenChange={setOpenPopover}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPopover}
                        className="w-full justify-between h-11 border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-normal"
                      >
                        <span className="truncate">
                          {selectedVendor || "Search or select vendor..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Search vendors..." />
                        <CommandList>
                          <CommandEmpty>No vendors found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value=""
                              onSelect={() => {
                                setSelectedVendor("");
                                setSelectedVendorId("");
                                setContactPerson("");
                                setIsContactAutoFilled(false);
                                setOpenPopover(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  !selectedVendor ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <span className="text-slate-500 italic">
                                None
                              </span>
                            </CommandItem>
                            {Array.isArray(vendors) &&
                              vendors.map((vendor) => {
                                if (!vendor?.vendor_id || !vendor?.name)
                                  return null;
                                const isSelected =
                                  selectedVendorId === vendor.vendor_id;

                                return (
                                  <CommandItem
                                    key={vendor.vendor_id}
                                    value={vendor.name}
                                    onSelect={() =>
                                      handleVendorSelect(vendor.name)
                                    }
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 shrink-0",
                                        isSelected
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    <div className="flex flex-col min-w-0">
                                      <span className="truncate">
                                        {vendor.name}
                                      </span>
                                      {vendor.contact_person && (
                                        <span className="text-xs text-slate-400 truncate">
                                          Contact: {vendor.contact_person}
                                        </span>
                                      )}
                                    </div>
                                  </CommandItem>
                                );
                              })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Contact Person */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      htmlFor="contact-person"
                      className="text-sm font-medium text-slate-700"
                    >
                      Contact Person
                    </Label>
                    {isContactAutoFilled && (
                      <span className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full shrink-0">
                        Auto-filled
                      </span>
                    )}
                  </div>
                  <Input
                    id="contact-person"
                    value={contactPerson}
                    onChange={handleContactChange}
                    onFocus={handleContactFocus}
                    placeholder="Name or contact details"
                    autoComplete="off"
                    className={cn(
                      "h-11 border-slate-200 transition-colors duration-200",
                      "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
                      isContactAutoFilled &&
                        "bg-violet-50/50 border-violet-200 text-violet-900",
                    )}
                  />
                  {isContactAutoFilled && (
                    <p className="text-xs text-slate-500">
                      Tap to edit if different
                    </p>
                  )}
                </div>

                {/* Required By */}
                <div className="space-y-2">
                  <Label
                    htmlFor="required-by"
                    className="text-sm font-medium text-slate-700"
                  >
                    Required By
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="required-by"
                      type="date"
                      value={requiredBy}
                      onChange={(e) => setRequiredBy(e.target.value)}
                      className="h-11 pl-10 border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    Payment Method
                  </Label>
                  <SearchableCombobox
                    value={paymentMethod}
                    onSelect={(id) => setPaymentMethod(id)}
                    options={paymentMethodOptions}
                    placeholder="Search or select payment..."
                    searchPlaceholder="Search payment methods..."
                    emptyMessage="No payment methods found."
                    valueKey="payment_method_id"
                    displayKey="name"
                    optional
                    optionalLabel="No Payment Method"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Materials & Labor Section */}
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 rounded-md">
                    <Package className="w-4 h-4 text-[#2B3A9F]" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Materials & Labor
                  </CardTitle>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-600"
                >
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Add Item Form */}
              <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/60">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-4">
                  <div className="space-y-2 lg:col-span-3">
                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Item / Service <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g., Plumbing Service"
                      value={newItem.name}
                      onChange={(e) =>
                        setNewItem({ ...newItem, name: e.target.value })
                      }
                      className="h-10 border-slate-200 focus:border-violet-500 bg-white"
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-3">
                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Description
                    </Label>
                    <Input
                      placeholder="Details or specifications"
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem({ ...newItem, description: e.target.value })
                      }
                      className="h-10 border-slate-200 focus:border-violet-500 bg-white"
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Unit <span className="text-rose-500">*</span>
                    </Label>
                    <SearchableCombobox
                      value={newItem.unit}
                      onSelect={handleUnitSelect}
                      options={unitOptions}
                      placeholder="Select unit..."
                      searchPlaceholder="Search units..."
                      emptyMessage="No units found."
                      valueKey="unit_id"
                      displayKey="name"
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Qty <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={newItem.quantity || ""}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            quantity: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-10 pl-9 border-slate-200 focus:border-violet-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Est. Unit Price
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                        ₱
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={newItem.unitPrice || ""}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            unitPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-10 pl-7 border-slate-200 focus:border-violet-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <Calculator className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      Line Total:{" "}
                      <span className="font-semibold text-slate-900 font-mono">
                        {formatCurrency(itemTotal)}
                      </span>
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearForm}
                      className="text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddItem}
                      disabled={
                        !newItem.name || !newItem.unit || newItem.quantity <= 0
                      }
                      className="bg-[#2B3A9F] hover:bg-[#2B3A9F]/80 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-slate-200">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">
                        #
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Item / Service
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                        Description
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                        Qty
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                        Unit Price
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                        Total
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-40 text-center">
                          <div className="flex flex-col items-center gap-3 text-slate-400">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-slate-300" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-600">
                                No items added
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                Add materials or labor costs above
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className="group border-slate-100"
                        >
                          <TableCell className="text-sm text-slate-500 font-mono">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900">
                            {item.name}
                          </TableCell>
                          <TableCell className="text-slate-600 hidden md:table-cell max-w-xs truncate">
                            {item.description || "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className="bg-slate-100 text-slate-700 font-mono font-medium"
                            >
                              {item.quantity} {getUnitName(item.unit)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-600">
                            {formatCurrency(item.unitPrice)} /{" "}
                            {getUnitName(item.unit)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-slate-900">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              {items.length > 0 && (
                <div className="flex flex-col items-end gap-3 pt-4 border-t border-slate-100">
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">
                        Subtotal ({items.length} items)
                      </span>
                      <span className="font-mono text-slate-900">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                    <Separator className="bg-slate-200" />
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-base font-semibold text-slate-900">
                        Total Estimated Cost
                      </span>
                      <span className="text-2xl font-bold text-[#2B3A9F] font-mono">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mt-8 pt-6">
          <div className="flex gap-3 w-full sm:w-auto order-1 sm:order-2">
            <Link
              href="/home/finance/service-requests"
              className="flex-1 sm:flex-none"
            >
              <Button
                variant="outline"
                className="w-full h-11 px-6 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                Cancel
              </Button>
            </Link>
            <Button
              onClick={createServiceRequest}
              disabled={isSubmitDisabled}
              className="flex-1 sm:flex-none h-11 px-6 bg-[#2B3A9F] hover:bg-[#2B3A9F]/80 text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Request
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

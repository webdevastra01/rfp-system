import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export interface NavItem {
  icon?: React.ComponentType;
  label: string;
  href?: string;
  badge?: string;
  subsections?: NavItem[]; // Recursive reference
}

export interface TopNavigationProps {
  notifications?: Notifications[];
}

export interface NotificationsProps {
  initialNotifications: Notifications[];
}

export interface Notifications {
  id: number;
  title: string;
  time: string;
  unread: boolean;
}

export interface SelectedRequest {
  id: string;
  title: string;
  purchaseType: string;
  status: string;
  dateSubmitted: string;
  requestor: string;
  department: string;
  amount: string;
  description: string;
}

export interface User {
  id: string;
  username?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  mobile_number?: string;
  address?: string;
  birthday?: string;
  sex: string;
  auth_id: string;
}

export interface Company {
  company_id: string;
  name: string;
}

export interface Branch {
  branch_id: string;
  location: string;
  company?: Company;
}

export interface Department {
  department_id: string;
  name: string;
  branch_id?: string;
  branch_location?: string;
  company_id?: string;
  company_name: string;
}

export interface Role {
  role_id: string;
  name: string;
}

export interface SettingsPageProps {
  users: FlattendUser[];
  companies: Company[];
  branches: Branch[];
  department: Department[];
  roles: Role[];
  designations: Designation[];
  onCreate?: (payload: CreateUserPayload) => Promise<void> | void;
  onEdit?: (
    payload: CreateUserPayload & { user_id: string },
  ) => Promise<void> | void;
}

export interface CompanySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
}

export interface BranchSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  companies: Company[];
}

export interface DepartmentSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
  branches: Branch[];
}

export interface RolesSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
}

export interface FlattendUser {
  user_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  mobile_number: string | null;
  address: string | null;
  birthday: string | null;
  sex: string | null;
  role_id: string;
  role_name: string;
  designation_id: string;
  designation_name: string;
  company_id: string;
  company_name: string;
  branch_id: string;
  branch_location: string;
  department_id: string;
  department_name: string;
}

export type UserAssignmentRow = {
  users: {
    user_id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string | null;
    mobile_number: string | null;
    address: string | null;
    birthday: string | null;
    sex: string | null;
  };
  roles: { role_id: string; name: string };
  designations: { designation_id: string; name: string };
  companies: { company_id: string; name: string };
  branches: { branch_id: string; location: string; company_id: string };
  departments: { department_id: string; name: string; branch_id: string };
};

export interface Designation {
  designation_id: number;
  name: string;
  scope: string;
}

export interface UserAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: FlattendUser[];
  companies: Company[];
  branches: Branch[];
  departments: Department[];
  designations: Designation[];
  roles: Role[];
  onCreate?: (payload: CreateUserPayload) => Promise<void> | void;
  onEdit?: (
    payload: CreateUserPayload & { user_id: string },
  ) => Promise<void> | void;
}

export interface Account {
  account_id: string;
  account_type: string;
  name: string;
}

export interface ChartOfAccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
}

export interface FinanceSettingsProps {
  accounts: Account[];
  types: Type[];
  units: Unit[];
  vehicles: Vehicle[];
  vendors: Vendor[];
  banks: Bank[];
  methods: PaymentMethodInterface[];
}

export interface FinanceCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  count?: string;
  onClick?: () => void;
}

export interface Type {
  type_id: string;
  name: string;
}

export interface TypesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  types: Type[];
  onTypesChange?: (types: Type[]) => void;
}

export interface Unit {
  unit_id: string;
  name: string;
}

export interface UnitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: Unit[];
  onUnitsChange?: (units: Unit[]) => void;
}

export interface Vehicle {
  vehicle_id: string;
  plate_number: string;
  car_type: string;
  owners_first_name: string;
  owners_last_name: string;
}

export interface AssetVehiclesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  onVehiclesChange?: (vehicles: Vehicle[]) => void;
}

export interface Vendor {
  vendor_id: string;
  name: string;
  contact_person?: string;
  payment_terms?: string;
}

export interface SuppliersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: Vendor[];
  onVendorsChange?: (vendors: Vendor[]) => void;
}

export interface Bank {
  bank_id: string;
  name: string;
}

export interface BanksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banks: Bank[];
  onBanksChange?: (banks: Bank[]) => void;
}

export interface PaymentMethodInterface {
  payment_method_id: string;
  name: string;
}

export interface PaymentMethodsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethods: PaymentMethodInterface[];
  onPaymentMethodsChange?: (paymentMethods: PaymentMethodInterface[]) => void;
}

// Permission Types
export interface PermissionAction {
  id: string;
  name: string;
  enabled: boolean;
}

export interface PermissionSubsection {
  id: string;
  name: string;
  enabled: boolean;
  actions?: PermissionAction[];
  section_id?: string;
}

export interface PermissionSection {
  id: string;
  name: string;
  enabled: boolean;
  subsections?: PermissionSubsection[];
  actions?: PermissionAction[];
}

export interface PermissionPage {
  id: string;
  name: string;
  icon?: React.ReactNode;
  enabled: boolean;
  sections: PermissionSection[];
}

export interface RolePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onPermissionsChange?: (permissions: PermissionPage[]) => void;
}

export interface ServiceItem {
  id: number;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CreateServiceRequestFormProps {
  types: Type[];
  companies: Company[];
  departments: Department[];
  vehicles: Vehicle[];
  vendors: Vendor[];
  paymentMethods: PaymentMethod[];
  units: Unit[];
  module: string;
}

export interface Request {
  id: string;
  request_number: string;
  title: string;
  description: string;
  service_category: string;
  priority_level: string;
  company: string;
  department: string;
  preferred_date: string;
  expected_completion: string;
  supporting_documents: string[];
  vehicle: Vehicle;
  preferred_vendor: string;
  contact_person: string;
  required_by: string;
  payment_method: string;
  items: Item[];
  status: string;
  requested_by: string;
  prepared_at?: string;
  created_at?: string;
}

export interface Item {
  name: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
}
export interface ReviewRequestProps {
  requests: Request[];
}

export interface InfoItemProps {
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

export interface ServiceOrderProps {
  requests: Request[];
  orders: Order[];
  units: Unit[];
}

export interface PurchaseOrderProps {
  requests: Request[];
  orders: Order[];
  units: Unit[];
}

export interface RequestDetailsPageProps {
  request: Request;
  accounts: Account[];
  units: Unit[];
}

export interface JournalEntry {
  id: number;
  accountTitle: string;
  amount: number;
  entryType: "debit" | "credit";
}

export interface Order {
  id: string;
  order_number: string;
  title: string;
  description: string;
  service_category: string;
  priority_level: string;
  company: string;
  department: string;
  preferred_date: string;
  expected_completion: string;
  supporting_documents: string[];
  vehicle: Vehicle;
  preferred_vendor: string;
  contact_person: string;
  required_by: string;
  payment_method: string;
  items: Item[];
  status: string;
  requested_by: string;
  order_prepared_by: string;
  journal_entries?: JournalEntry[];
  approved_by?: string;
  approved_on?: string;
}

export interface ReviewOrderProps {
  orders: Order[];
  units: Unit[];
}

export const colors = {
  primary: {
    DEFAULT: "#2B3A9F",
    light: "#3B4DB8",
    dark: "#1E2A7A",
    muted: "#EEF2FF",
  },
  semantic: {
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    },
    approved: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    rejected: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
    },
    for_approval: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
  },
  priority: {
    Low: {
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-200",
    },
    Medium: {
      bg: "bg-[#EEF2FF]",
      text: "text-[#2B3A9F]",
      border: "border-[#2B3A9F]/20",
    },
    High: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
  },
};

export const statusConfig: Record<
  string,
  {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ElementType;
    label: string;
  }
> = {
  submitted: {
    color: "text-[#3B82F6]",
    bgColor: "bg-[#DBEAFE]",
    borderColor: "border-[#93C5FD]",
    icon: AlertCircle,
    label: "Submitted",
  },
  for_review: {
    // ← ADD THIS (snake_case version)
    color: "text-[#8B5CF6]", // Purple for "needs attention"
    bgColor: "bg-[#EDE9FE]",
    borderColor: "border-[#C4B5FD]",
    icon: AlertCircle,
    label: "For Review",
  },
  "for review": {
    // ← ADD THIS (space version, if your data has it this way)
    color: "text-[#8B5CF6]",
    bgColor: "bg-[#EDE9FE]",
    borderColor: "border-[#C4B5FD]",
    icon: AlertCircle,
    label: "For Review",
  },
  forReview: {
    // ← ADD THIS (camelCase version, just in case)
    color: "text-[#8B5CF6]",
    bgColor: "bg-[#EDE9FE]",
    borderColor: "border-[#C4B5FD]",
    icon: AlertCircle,
    label: "For Review",
  },
  approved: {
    color: "text-[#059669]",
    bgColor: "bg-[#D1FAE5]",
    borderColor: "border-[#6EE7B7]",
    icon: CheckCircle2,
    label: "Approved",
  },
  rejected: {
    color: "text-[#DC2626]",
    bgColor: "bg-[#FEE2E2]",
    borderColor: "border-[#FCA5A5]",
    icon: XCircle,
    label: "Rejected",
  },
};

export const priorityConfig: Record<
  string,
  { color: string; bgColor: string; borderColor: string }
> = {
  High: {
    color: "text-[#DC2626]",
    bgColor: "bg-[#FEE2E2]",
    borderColor: "border-[#FCA5A5]",
  },
  Medium: {
    color: "text-[#D97706]",
    bgColor: "bg-[#FEF3C7]",
    borderColor: "border-[#FCD34D]",
  },
  Low: {
    color: "text-[#059669]",
    bgColor: "bg-[#D1FAE5]",
    borderColor: "border-[#6EE7B7]",
  },
};

export interface ServiceRequestPageProps {
  requests: Request[];
  module: string;
}

export interface CreatePurchaseRequestFormProps {
  types: Type[];
  companies: Company[];
  departments: Department[];
  vehicles: Vehicle[];
  vendors: Vendor[];
  paymentMethods: PaymentMethod[];
  units: Unit[];
  module: string;
}

export interface PurchaseItem {
  id: number;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseRequestPageProps {
  requests: Request[];
  module: string;
}

export interface RequestForPaymentProps {
  orders: Order[];
  rfps: RequestForPaymentInterface[];
  rfpExportData?: any[];
  onApprove?: (id: string) => Promise<void> | void;
  onReject?: (id: string) => Promise<void> | void;
  onCancel?: (id: string) => Promise<void> | void;
  module: string;
}

export interface CreateRequestForPaymentPageProps {
  order: Order | null;
  chargeToOptions: ChargeToOptions[];
  module: string;
}

export interface ChargeToOptions {
  label: string;
  value: string;
}

export interface LineItem {
  id: string;
  invoice_number: string;
  particulars: string;
  qty: string;
  price: string;
  totalAmount: string;
  chargeTo: string;
}

export interface RFPLineItem {
  invoice_number: string;
  particulars: string;
  qty: number;
  price: number;
  total_amount: number;
  charge_to: string;
}

export interface RequestForPaymentInterface {
  id: string;
  created_at: string;

  order_id: string;
  order_number: string;

  rfp_number: string;

  description: string;

  payable_to: string;
  payment_method: string;

  due_date: string;
  request_date: string;

  contact_number: string;
  department: string;

  requested_by: string;

  approved_by: string | null;
  approved_date: string | null;

  status: string;

  total_payable: string;

  line_items: RFPLineItem[];
  supporting_documents?: string[];
}

export interface LiquidationPageProps {
  rfps: RequestForPaymentInterface[];
  liquidatedRFPs: LiquidationInterface[];
  onApprove?: (id: string) => Promise<void> | void;
  onReject?: (id: string) => Promise<void> | void;
  module: string;
}

export interface CreateLiquidationPageProps {
  rfp: RequestForPaymentInterface;
  vehicles: Vehicle[];
  accounts: Account[];
  vendors: Vendor[];
  module: string;
}

export type LiquidationEntry = {
  date: string;
  plate_number: string | null;
  car_type: string | null;
  owners_first_name: string | null;
  owners_last_name: string | null;
  supplier: number;
  description: string;
  gl_account: number;
  amount: number;
};

export type LiquidationInterface = {
  id: string;
  created_at: string;
  liquidation_number: string;
  rfp_id: string;
  rfp_number: string;
  requested_by: string;
  department: string;
  payable_to: string;
  payment_method: string;
  original_amount: string;
  total_liquidated: string;
  remaining_balance: string;
  liquidation_entries: LiquidationEntry[];
  status: string;
  approved_date: string | null;
  approved_by: string | null;
};

export interface CreateUserPayload {
  email: string;
  password: string;
  username: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  mobile_number: string;
  address: string;
  birthday: string;
  sex: string;
  company_id: string;
  branch_id: string;
  department_id: string;
  designation_id: string;
  role_id: string;
}

export interface ModuleSummary {
  rfpTotal: number;
  rfpPending: number;
  rfpApproved: number;
  rfpRejected: number;

  liqTotal: number;
  liqPending: number;
  liqApproved: number;
  liqRejected: number;

  SOTotal: number;
  SOPending: number;
  SOApproved: number;
  SORejected: number;

  POTotal: number;
  POPending: number;
  POApproved: number;
  PORejected: number;

  SRTotal: number;
  SRPending: number;
  SRApproved: number;
  SRRejected: number;

  PRTotal: number;
  PRPending: number;
  PRApproved: number;
  PRRejected: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  status: string;
  created_at: string;
  user: string;
}
export interface DashboardProps {
  moduleSummary: ModuleSummary;
  recentActivities: RecentActivity[];
}
export interface HomePageClientProps {
  moduleSummary: ModuleSummary;
  recentActivities: RecentActivity[];
}
export interface Booking {
  id: string;
  reference: string;
  requester: string;
  department: string;
  vehicleType: string;
  vehicleId: string;
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  passengers: number;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  approver?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  variant: "default" | "pending" | "approved" | "rejected";
}

export type ComputationMode = "with-driver" | "without-driver";
export type VehicleCategory =
  | "compact"
  | "sedan"
  | "mpv"
  | "suv"
  | "pickup"
  | "wagon"
  | "van";
export type Timeframe = "8h" | "12h" | "24h";
export type Classification = "primo" | "budget-mile" | "premium";
export type FuelSetup = "all-in" | "renter";
export type TripType = "round-trip" | "pickup-dropoff" | "airport-transfer";
export type EventType = "regular" | "holiday";
export type ClientType = "individual" | "corporate";
export type Coverage = "davao" | "region" | "mindanao";
export type DrivingTerm = "long-term-parking" | "back-forth";
export type FuelType = "diesel" | "gasoline";

export type PaymentMethod = [];

export interface BaseFormState {
  vehicleCategory: VehicleCategory | "";
  timeframe: Timeframe | "";
  classification: Classification | "";
  startDate: string;
  endDate: string;
  additionalHours: number;
  distance: number;

  /** Flat security deposit amount (₱), shown as separate line item */
  deposit: string;

  /** Percentage applied to the main subtotal */
  discountPercent: string;

  /** If card, add 3.5% terminal fee */
  paymentMethod: PaymentMethod;

  beyondOperatingHours: boolean;
  cdw: boolean;
}

export interface WithDriverForm extends BaseFormState {
  fuelSetup: FuelSetup | "";
  tripType: TripType | "";
  eventType: EventType | "";
  clientType: ClientType | "";
  coverage: Coverage | "";
  drivingTerm: DrivingTerm | "";
  accommodationFee: number;
  mealFee: number;
  fuelType: FuelType | "";
  fuelPrice: number;
}

export interface QuotationLineItem {
  label: string;
  value: number;
  isDeduction?: boolean;
  isHighlight?: boolean;
  isSubtotal?: boolean;
  isTotal?: boolean;
  note?: string;
  icon?: React.ReactNode;
}

export interface QuotationResult {
  lineItems: QuotationLineItem[];
  operationalDetails: { label: string; value: string }[];
  mode: ComputationMode;
}

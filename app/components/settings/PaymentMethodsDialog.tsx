"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MoreHorizontal,
  Plus,
  Search,
  CreditCard,
  Trash2,
  Pencil,
  Wallet,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useState, useEffect } from "react";
import {
  PaymentMethodInterface,
  PaymentMethodsDialogProps,
} from "@/lib/interfaces";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function PaymentMethodsDialog({
  open,
  onOpenChange,
  paymentMethods: initialPaymentMethods = [],
  onPaymentMethodsChange,
}: PaymentMethodsDialogProps) {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<
    PaymentMethodInterface[]
  >(initialPaymentMethods);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] =
    useState<PaymentMethodInterface | null>(null);

  // Sync with external paymentMethods prop
  useEffect(() => {
    setPaymentMethods(initialPaymentMethods);
  }, [initialPaymentMethods]);

  // Form state - only name, no ID input
  const [formData, setFormData] = useState<Partial<PaymentMethodInterface>>({
    name: "",
  });

  const filteredMethods = paymentMethods.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.payment_method_id.includes(searchQuery),
  );

  const updatePaymentMethods = (
    newPaymentMethods: PaymentMethodInterface[],
  ) => {
    setPaymentMethods(newPaymentMethods);
    onPaymentMethodsChange?.(newPaymentMethods);
  };

  const handleRemove = async (payment_method_id: string) => {
    // Find payment method details before deletion for the toast message
    const methodToDelete = paymentMethods.find(
      (m) => m.payment_method_id === payment_method_id,
    );
    const methodName = methodToDelete?.name || "Payment Method";

    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("payment_method_id", payment_method_id);

    if (error) {
      console.error("Error deleting payment method:", error);
      toast.error("Failed to delete payment method", {
        description:
          error.message ||
          "An error occurred while deleting the payment method.",
      });
      return;
    }

    const newMethods = paymentMethods.filter(
      (m) => m.payment_method_id !== payment_method_id,
    );

    updatePaymentMethods(newMethods);

    toast.success("Payment method deleted successfully", {
      description: `${methodName} has been removed.`,
    });
  };

  const handleOpenForm = (method?: PaymentMethodInterface) => {
    if (method) {
      setEditingMethod(method);
      setFormData({ name: method.name });
    } else {
      setEditingMethod(null);
      setFormData({ name: "" });
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingMethod(null);
    setFormData({ name: "" });
  };

  async function createPaymentMethod(name: string) {
    const { data, error } = await supabase
      .from("payment_methods")
      .insert({ name })
      .select()
      .single();

    if (error) {
      console.error("Error creating payment method:", error);
      toast.error("Failed to create payment method", {
        description:
          error.message ||
          "An error occurred while creating the payment method.",
      });
      return;
    }

    const newMethods = [...paymentMethods, data];
    updatePaymentMethods(newMethods);

    toast.success("Payment method created successfully", {
      description: `${name} has been added.`,
    });
  }

  async function updatePaymentMethod(name: string) {
    if (!editingMethod) return;

    const previousName = editingMethod.name;

    const { data, error } = await supabase
      .from("payment_methods")
      .update({ name })
      .eq("payment_method_id", editingMethod.payment_method_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating payment method:", error);
      toast.error("Failed to update payment method", {
        description:
          error.message ||
          "An error occurred while updating the payment method.",
      });
      return;
    }

    const newMethods = paymentMethods.map((m) =>
      m.payment_method_id === editingMethod.payment_method_id ? data : m,
    );

    updatePaymentMethods(newMethods);

    // Show different message if name was changed
    const nameChanged = previousName !== name;
    toast.success("Payment method updated successfully", {
      description: nameChanged
        ? `${previousName} has been renamed to ${name}.`
        : `${name} has been updated.`,
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) return;

    if (editingMethod) {
      await updatePaymentMethod(formData.name);
    } else {
      await createPaymentMethod(formData.name);
    }

    handleCloseForm();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] lg:max-w-[800px] w-full max-h-[90vh] overflow-y-auto p-6 border-t-4 border-t-rose-600">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl flex items-center gap-2 text-rose-600">
              <div className="p-2 rounded-lg bg-rose-50">
                <CreditCard className="w-6 h-6 text-rose-600" />
              </div>
              Payment Methods
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Manage payment methods for transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-600" />
                <Input
                  placeholder="Search payment methods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-rose-600 focus:ring-rose-600/20"
                />
              </div>
              <Button
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => handleOpenForm()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </div>

            {/* Payment Methods Table */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                      Payment Methods
                      <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200">
                        {paymentMethods.length}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-slate-500 mt-1">
                      Available payment options for transactions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="text-rose-600 font-semibold">
                        Method ID
                      </TableHead>
                      <TableHead className="text-rose-600 font-semibold">
                        Method Name
                      </TableHead>
                      <TableHead className="w-[100px] text-rose-600 font-semibold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMethods.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-slate-400 py-12"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <CreditCard className="w-8 h-8 text-slate-300" />
                            <p>No payment methods found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMethods.map((method) => (
                        <TableRow
                          key={method.payment_method_id}
                          className="hover:bg-rose-50/50 transition-colors"
                        >
                          <TableCell>
                            <span className="font-mono font-medium text-rose-600">
                              {method.payment_method_id}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                                <Wallet className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-slate-900">
                                {method.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-rose-100 hover:text-rose-600"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuLabel className="text-xs text-slate-500">
                                  Actions
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-slate-700 cursor-pointer hover:bg-rose-50 hover:text-rose-600"
                                  onClick={() => handleOpenForm(method)}
                                >
                                  <Pencil className="w-4 h-4 mr-2 text-rose-600" />
                                  Edit Method
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 cursor-pointer hover:bg-red-50 hover:text-red-700"
                                  onClick={() =>
                                    handleRemove(method.payment_method_id)
                                  }
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Payment Method Form Dialog - Only Name Input */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 border-t-4 border-t-rose-600">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl flex items-center gap-2 text-rose-600">
              <div className="p-2 rounded-lg bg-rose-50">
                {editingMethod ? (
                  <Pencil className="w-5 h-5 text-rose-600" />
                ) : (
                  <Plus className="w-5 h-5 text-rose-600" />
                )}
              </div>
              {editingMethod ? "Edit Payment Method" : "Add Payment Method"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {editingMethod
                ? "Update the payment method name."
                : "Enter a name for the new payment method."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700">
                Method Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., Credit Card, Cash, Bank Transfer"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                className="border-slate-200 focus:border-rose-600 focus:ring-rose-600/20"
                required
                autoFocus
              />
            </div>

            <DialogFooter className="gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseForm}
                className="border-slate-200 hover:bg-slate-50"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {editingMethod ? (
                  <>
                    <Pencil className="w-4 h-4 mr-2" />
                    Update Method
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Method
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

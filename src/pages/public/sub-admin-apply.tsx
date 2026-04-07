import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function SubAdminApply() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contact: "",
    idNumber: "",
    country: "",
    region: "",
    bankName: "",
    accountNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const key in formData) {
      if (!formData[key as keyof typeof formData]) {
        toast({ title: "Error", description: `Please fill in all fields. Missing: ${key}`, variant: "destructive" });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "globiliveSubAdmins"), {
        name: formData.fullName,
        email: formData.email,
        contactNumber: formData.contact,
        idNumber: formData.idNumber,
        country: formData.country,
        region: formData.region,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        status: "Pending",
        sharePercent: 0,
        createdAt: serverTimestamp(),
      });

      toast({ title: "Application Submitted", description: "Your Sub-Admin application has been submitted for review." });

      setFormData({
        fullName: "", email: "", contact: "", idNumber: "", 
        country: "", region: "", bankName: "", accountNumber: "",
      });
    } catch (error) {
      console.error("Error submitting sub-admin application:", error);
      toast({ title: "Error", description: "Failed to submit application.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Sub-Admin Application</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="fullName" placeholder="Full Name" onChange={handleInputChange} value={formData.fullName} />
                <Input name="email" type="email" placeholder="Email" onChange={handleInputChange} value={formData.email} />
                <Input name="contact" placeholder="Contact Number" onChange={handleInputChange} value={formData.contact} />
                <Input name="idNumber" placeholder="ID Card Number" onChange={handleInputChange} value={formData.idNumber} />
                <Input name="country" placeholder="Country" onChange={handleInputChange} value={formData.country} />
                <Input name="region" placeholder="Region" onChange={handleInputChange} value={formData.region} />
                <Input name="bankName" placeholder="Bank Name" onChange={handleInputChange} value={formData.bankName} />
                <Input name="accountNumber" placeholder="Bank Account Number" onChange={handleInputChange} value={formData.accountNumber} />
            </div>

            <Button type="submit" className="w-full">Submit Application</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

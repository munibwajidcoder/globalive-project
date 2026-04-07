import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function ResellerApply() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    country: "",
    region: "",
    associatedAgent: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields: (keyof typeof formData)[] = ["fullName", "email", "contactNumber", "country", "region"];
    for (const key of requiredFields) {
      if (!formData[key]) {
        toast({ title: "Error", description: `Please fill in all required fields. Missing: ${key}`, variant: "destructive" });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "globiliveResellers"), {
        name: formData.fullName,
        email: formData.email,
        contact: formData.contactNumber,
        country: formData.country,
        region: formData.region,
        agent: formData.associatedAgent || "Unassigned",
        status: "Pending",
        totalSales: "$0",
        createdAt: serverTimestamp(),
      });

      toast({ title: "Application Submitted", description: "Your Reseller application has been submitted for review." });

      setFormData({
        fullName: "",
        email: "",
        contactNumber: "",
        country: "",
        region: "",
        associatedAgent: "",
      });
    } catch (error) {
      console.error("Error submitting reseller application:", error);
      toast({ title: "Error", description: "Failed to submit application.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Reseller Application Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="fullName" placeholder="Full Name" onChange={handleInputChange} value={formData.fullName} />
                <Input name="email" type="email" placeholder="Email" onChange={handleInputChange} value={formData.email} />
                <Input name="contactNumber" placeholder="Contact Number" onChange={handleInputChange} value={formData.contactNumber} />
                <Input name="country" placeholder="Country" onChange={handleInputChange} value={formData.country} />
                <Input name="region" placeholder="Region" onChange={handleInputChange} value={formData.region} />
                <Input name="associatedAgent" placeholder="Associated Top-up Agent (Optional)" onChange={handleInputChange} value={formData.associatedAgent} />
            </div>
            <Button type="submit" className="w-full">Submit Application</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

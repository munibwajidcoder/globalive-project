import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AgencyApply() {
  const [formData, setFormData] = useState({
    agencyName: "",
    contactPerson: "",
    email: "",
    contactNumber: "",
    country: "",
    region: "",
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
      await addDoc(collection(db, "globiliveAgencies"), {
        name: formData.agencyName,
        agencyName: formData.agencyName,
        contactPerson: formData.contactPerson,
        contactEmail: formData.email, // using contactEmail for consistency with AuthContext
        contactNumber: formData.contactNumber,
        country: formData.country,
        region: formData.region,
        status: "Pending",
        hosts: 0,
        agencyHosts: [],
        totalRevenue: "0",
        createdAt: serverTimestamp(),
      });

      toast({ title: "Application Submitted", description: "Your agency application has been submitted for review." });

      setFormData({
        agencyName: "", contactPerson: "", email: "", 
        contactNumber: "", country: "", region: "",
      });
    } catch (error) {
      console.error("Error submitting agency application:", error);
      toast({ title: "Error", description: "Failed to submit application.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Agency Application Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="agencyName" placeholder="Agency Name" onChange={handleInputChange} value={formData.agencyName} />
                <Input name="contactPerson" placeholder="Contact Person" onChange={handleInputChange} value={formData.contactPerson} />
                <Input name="email" type="email" placeholder="Official Email" onChange={handleInputChange} value={formData.email} />
                <Input name="contactNumber" placeholder="Contact Number" onChange={handleInputChange} value={formData.contactNumber} />
                <Input name="country" placeholder="Country" onChange={handleInputChange} value={formData.country} />
                <Input name="region" placeholder="Region" onChange={handleInputChange} value={formData.region} />
            </div>
            <Button type="submit" className="w-full">Submit Application</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

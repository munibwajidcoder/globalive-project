import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function SuperAdminApply() {
  const [formData, setFormData] = useState<any>({
    fullName: "",
    email: "",
    contact: "",
    idType: "CNIC",
    idNumber: "",
    country: "",
    region: "",
    bankName: "",
    accountNumber: "",
    faceVerification: null,
    idDocument: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData((prev: any) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    for (const key in formData) {
      if (!formData[key]) {
        toast({ title: "Error", description: `Please fill in all fields. Missing: ${key}`, variant: "destructive" });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Upload files to Firebase Storage with a pseudo-timeout/error check
      let idDocUrl = "";
      let facePhotoUrl = "";

      try {
        if (formData.idDocument) {
          const idRef = ref(storage, `applications/super-admin/id_${Date.now()}_${formData.idDocument.name}`);
          const idSnap = await uploadBytes(idRef, formData.idDocument);
          idDocUrl = await getDownloadURL(idSnap.ref);
        }

        if (formData.faceVerification) {
          const faceRef = ref(storage, `applications/super-admin/face_${Date.now()}_${formData.faceVerification.name}`);
          const faceSnap = await uploadBytes(faceRef, formData.faceVerification);
          facePhotoUrl = await getDownloadURL(faceSnap.ref);
        }
      } catch (storageError: any) {
        console.error("Firebase Storage Error:", storageError);
        // If storage fails, we show a specific message. Often it's because Storage hasn't been "Started" in console.
        throw new Error("Failed to upload documents. Please ensure Firebase Storage is enabled in your console.");
      }

      // 2. Save application to Firestore
      await addDoc(collection(db, "globiliveSuperAdmins"), {
        name: formData.fullName,
        email: formData.email,
        contactNumber: formData.contact,
        idType: formData.idType,
        idNumber: formData.idNumber,
        country: formData.country,
        region: formData.region,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        idDocumentUrl: idDocUrl,
        faceVerificationUrl: facePhotoUrl,
        status: "Pending",
        beans: 0,
        diamonds: 0,
        sharePercent: 0,
        createdAt: serverTimestamp(),
      });

      toast({ title: "Application Submitted", description: "Your Super Admin application has been submitted for review." });
      
      // Reset form
      setFormData({
        fullName: "", email: "", contact: "", idType: "CNIC", idNumber: "", 
        country: "", region: "", bankName: "", accountNumber: "",
        faceVerification: null, idDocument: null,
      });
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({ 
        title: "Submission Failed", 
        description: error.message || "Failed to submit application. Please check your connection or Firebase Storage settings.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Super Admin Application</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="fullName" placeholder="Full Name" onChange={handleInputChange} />
                <Input name="email" type="email" placeholder="Email" onChange={handleInputChange} />
                <Input name="contact" placeholder="Contact Number" onChange={handleInputChange} />
                <Input name="idNumber" placeholder="ID Card Number" onChange={handleInputChange} />
                <Input name="country" placeholder="Country" onChange={handleInputChange} />
                <Input name="region" placeholder="Region" onChange={handleInputChange} />
                <Input name="bankName" placeholder="Bank Name" onChange={handleInputChange} />
                <Input name="accountNumber" placeholder="Bank Account Number" onChange={handleInputChange} />
            </div>

            <div>
              <label className="text-sm font-medium">ID Document (CNIC, Aadhar, etc.)</label>
              <Input name="idDocument" type="file" onChange={handleFileChange} />
            </div>

            <div>
              <label className="text-sm font-medium">Face Verification (Live Photo)</label>
              <Input name="faceVerification" type="file" accept="image/*" capture="user" onChange={handleFileChange} />
            </div>

            <Button type="submit" className="w-full">Submit Application</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

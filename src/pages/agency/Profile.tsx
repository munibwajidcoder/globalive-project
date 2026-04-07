import { DashboardLayout } from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import Loading from "@/components/ui/loading";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query as fbQuery, where, getDocs, doc, updateDoc } from "firebase/firestore";

const STORAGE_KEY = "agency_profile_v1";

export default function AgencyProfile() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [contact, setContact] = useState("");
  const [desc, setDesc] = useState("");
  const { user } = useAuth();
  const [agencyDocId, setAgencyDocId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (user?.username) {
          const q = fbQuery(collection(db, "globiliveAgencies"), where("contactEmail", "==", user.username));
          const snap = await getDocs(q);
          if (!mounted) return;
          if (!snap.empty) {
            const aDoc = snap.docs[0];
            const data: any = aDoc.data();
            setAgencyDocId(aDoc.id);
            setName(data.name || data.agencyName || "");
            setCode(data.code || data.agencyCode || "");
            setContact(data.contactEmail || "");
            setDesc(data.agencyDescription || data.description || "");
          }
        }
      } catch (e) {
        console.error("failed to load agency from Firestore", e);
      }
    };

    load();
    return () => { mounted = false; };
  }, [user?.username]);

  async function save() {
    if (!agencyDocId && !user?.username) {
      toast({ title: "Error", description: "Unexpected error: No user session found.", variant: "destructive" });
      return;
    }

    const payload: any = { 
      name, 
      agencyName: name,
      agencyCode: code, 
      contactEmail: contact, 
      agencyDescription: desc 
    };

    setIsSaving(true);
    try {
      if (agencyDocId) {
        await updateDoc(doc(db, "globiliveAgencies", agencyDocId), payload);
      } else {
        const q = fbQuery(collection(db, "globiliveAgencies"), where("contactEmail", "==", user!.username));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const aDoc = snap.docs[0];
          setAgencyDocId(aDoc.id);
          await updateDoc(doc(db, "globiliveAgencies", aDoc.id), payload);
        }
      }
      toast({ title: "Profile Updated", description: "Your agency details have been saved successfully." });
    } catch (e) {
      console.error("failed to save agency profile", e);
      toast({ title: "Save Failed", description: "Unable to update profile. Please check your connection.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DashboardLayout role="agency">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Agency Profile</h2>
          <p className="text-muted-foreground mt-1">Manage your agency details and contact information</p>
        </div>

        <Card>
          <div className="grid gap-4 p-6">
            <div>
              <label className="text-sm font-medium">Agency Name</label>
              <Input value={name} onChange={(e) => setName((e as any).target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Agency Code</label>
              <Input value={code} onChange={(e) => setCode((e as any).target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Contact Email</label>
              <Input value={contact} onChange={(e) => setContact((e as any).target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea className="w-full rounded border p-2" rows={4} value={desc} onChange={(e) => setDesc((e as any).target.value)} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setName(""); setCode(""); setContact(""); setDesc(""); }} disabled={isSaving}>Reset</Button>
              <Button onClick={save} disabled={isSaving}>{isSaving ? (
                <>
                  <Loading size={16} /> Saving...
                </>
              ) : "Save Profile"}</Button>
            </div>
          </div>
        </Card>
        {isSaving && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-background p-4 rounded shadow flex items-center gap-3">
              <Loading size={24} />
              <div>
                <p className="font-medium">Saving profile...</p>
                <p className="text-sm text-muted-foreground">Please wait</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

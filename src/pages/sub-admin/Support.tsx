import { SupportInbox } from "@/pages/shared/SupportInbox";

// Sub admin uses same viewer permissions as super admin for support
export default function SubAdminSupport() {
  return <SupportInbox role="sub-admin" />;
}

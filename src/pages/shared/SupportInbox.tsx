import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { MessageCircle, Search, Send, ShieldAlert, ShieldCheck, User } from "lucide-react";

type SupportRole = "agency" | "company" | "super-admin" | "sub-admin";
type ParticipantType = "host" | "user" | "agency" | "sub-admin" | "super-admin" | "company";
type ConversationStatus = "Open" | "Waiting" | "Resolved";

type Message = {
  id: string;
  author: string;
  authorType: ParticipantType;
  body: string;
  sentAt: string;
};

type Conversation = {
  id: string;
  subject: string;
  reporterName: string;
  reporterType: "host" | "user";
  reporterContact: string;
  status: ConversationStatus;
  lastMessageAt: string;
  assignedTo: string;
  messages: Message[];
};

const seedConversations: Conversation[] = [
  {
    id: "CONV-2901",
    subject: "Diamond payout delay",
    reporterName: "Sarah Johnson",
    reporterType: "host",
    reporterContact: "+971 55 123 4567",
    status: "Open",
    assignedTo: "Agency Ops Team",
    lastMessageAt: "2025-11-13T21:30:00Z",
    messages: [
      {
        id: "MSG-1",
        author: "Sarah Johnson",
        authorType: "host",
        body: "Hey team, my withdrawal request from yesterday still shows pending. Can someone confirm the processing time?",
        sentAt: "2025-11-13T20:05:00Z",
      },
      {
        id: "MSG-2",
        author: "Agency Support",
        authorType: "agency",
        body: "Thanks Sarah, I see it in the queue with Super Admin Olivia. We'll update you once treasury clears it tonight.",
        sentAt: "2025-11-13T20:42:00Z",
      },
      {
        id: "MSG-3",
        author: "Sarah Johnson",
        authorType: "host",
        body: "Appreciate it! Please keep me posted.",
        sentAt: "2025-11-13T21:30:00Z",
      },
    ],
  },
  {
    id: "CONV-2895",
    subject: "Viewer spam during live",
    reporterName: "Amina Khan",
    reporterType: "user",
    reporterContact: "amina.khan@example.com",
    status: "Waiting",
    assignedTo: "Sub Admin Farah",
    lastMessageAt: "2025-11-13T18:10:00Z",
    messages: [
      {
        id: "MSG-4",
        author: "Amina Khan",
        authorType: "user",
        body: "One of the viewers kept spamming hate speech in the live chat. Reporting the username 'ToxicWave'.",
        sentAt: "2025-11-13T17:58:00Z",
      },
      {
        id: "MSG-5",
        author: "Agency Support",
        authorType: "agency",
        body: "Thank you, Amina. We're escalating this to Sub Admin Farah for moderation. We'll mute and investigate the account.",
        sentAt: "2025-11-13T18:10:00Z",
      },
    ],
  },
  {
    id: "CONV-2870",
    subject: "Host onboarding documents",
    reporterName: "Jason Lee",
    reporterType: "host",
    reporterContact: "+65 8123 9945",
    status: "Resolved",
    assignedTo: "Agency Ops Team",
    lastMessageAt: "2025-11-12T14:25:00Z",
    messages: [
      {
        id: "MSG-6",
        author: "Jason Lee",
        authorType: "host",
        body: "I uploaded the updated passport yesterday. Let me know if anything else is pending for verification.",
        sentAt: "2025-11-12T13:05:00Z",
      },
      {
        id: "MSG-7",
        author: "Agency Support",
        authorType: "agency",
        body: "All good now Jason. Verification is complete and you're clear for the weekend campaign.",
        sentAt: "2025-11-12T14:25:00Z",
      },
    ],
  },
];

const statusVariant: Record<ConversationStatus, "default" | "secondary" | "destructive"> = {
  Open: "default",
  Waiting: "secondary",
  Resolved: "destructive",
};

const roleLabel: Record<SupportRole, string> = {
  agency: "Agency",
  company: "Company",
  "super-admin": "Super Admin",
  "sub-admin": "Sub Admin",
};

const roleDescription: Record<SupportRole, string> = {
  agency: "Respond to host and user conversations escalated from the mobile apps.",
  company: "View agency-to-host communications for transparency.",
  "super-admin": "Monitor escalations handled by agency operations teams.",
  "sub-admin": "View and respond to conversations from your assigned agencies and hosts.",
};

const canReply = (role: SupportRole) => true; // All roles (agency, company, super-admin) can now reply

export function SupportInbox({ role }: { role: SupportRole }) {
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState(seedConversations);
  const [selectedId, setSelectedId] = useState<string>(seedConversations[0]?.id ?? "");
  const [draft, setDraft] = useState("");

  const filteredConversations = useMemo(() => {
    if (!search.trim()) {
      return conversations;
    }
    const query = search.toLowerCase();
    return conversations.filter((conversation) =>
      [
        conversation.subject,
        conversation.reporterName,
        conversation.reporterContact,
        conversation.assignedTo,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [conversations, search]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? filteredConversations[0] ?? null,
    [conversations, filteredConversations, selectedId],
  );

  const handleSelectConversation = (conversationId: string) => {
    setSelectedId(conversationId);
    setDraft("");
  };

  const handleSend = () => {
    if (!selectedConversation || !draft.trim()) {
      return;
    }

    const timestamp = new Date().toISOString();

    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== selectedConversation.id) {
          return conversation;
        }
        const newMessage: Message = {
          id: `MSG-${Math.random().toString(36).slice(2, 8)}`,
          author: `${roleLabel[role]} Support`,
          authorType: role as ParticipantType,
          body: draft.trim(),
          sentAt: timestamp,
        };

        return {
          ...conversation,
          status: conversation.status === "Resolved" ? "Open" : conversation.status,
          lastMessageAt: timestamp,
          messages: [...conversation.messages, newMessage],
        };
      }),
    );

    setDraft("");
    toast({ title: "Reply sent", description: "Your response is now visible to the host/user." });
  };

  const handleMarkResolved = () => {
    if (!selectedConversation) {
      return;
    }

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              status: "Resolved",
            }
          : conversation,
      ),
    );
    toast({ title: "Conversation resolved", description: "Marked as resolved for reporting." });
  };

  const description = roleDescription[role];
  const replyingAllowed = canReply(role);

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Support Inbox</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base font-semibold">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative p-4 pb-2">
                <Search className="absolute left-7 top-5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search hosts, users, or subject..."
                  className="pl-9"
                />
              </div>
              <ScrollArea className="max-h-[540px]">
                <div className="divide-y">
                  {filteredConversations.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No conversations match your search.
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => handleSelectConversation(conversation.id)}
                        className={cn(
                          "flex w-full flex-col gap-2 px-4 py-3 text-left transition",
                          selectedConversation?.id === conversation.id ? "bg-muted" : "hover:bg-muted/60",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{conversation.subject}</span>
                          <Badge variant={statusVariant[conversation.status]}>{conversation.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {conversation.reporterName} ({conversation.reporterType})
                          </span>
                          <span aria-hidden>•</span>
                          <span>{new Date(conversation.lastMessageAt).toLocaleString()}</span>
                        </div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {conversation.messages[conversation.messages.length - 1]?.body}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="min-h-[540px]">
            {selectedConversation ? (
              <div className="flex h-full flex-col">
                <CardHeader className="border-b">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedConversation.subject}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.reporterName} ({selectedConversation.reporterType}) · {selectedConversation.reporterContact}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge variant={statusVariant[selectedConversation.status]}>{selectedConversation.status}</Badge>
                      <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                        <User className="h-3 w-3" /> {selectedConversation.assignedTo}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4 p-4">
                  <ScrollArea className="flex-1 rounded-md border">
                    <div className="space-y-4 p-4">
                      {selectedConversation.messages.map((message) => {
                        const isPrimaryAuthor = message.authorType === role || (role === "company" && (message.authorType === "agency" || message.authorType === "super-admin"));
                        // On the right if it's sent by the current role (or higher for company view)
                        // Actually, let's keep it simple: sent by support (agency, company, super-admin) = right, sent by user/host = left for this inbox.
                        const isSupport = ["agency", "company", "super-admin", "sub-admin"].includes(message.authorType);
                        
                        return (
                          <div key={message.id} className={cn("flex", isSupport ? "justify-end" : "justify-start")}> 
                            <div
                              className={cn(
                                "max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                                isSupport 
                                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                                  : "bg-muted text-muted-foreground rounded-tl-none border-muted-foreground/10"
                              )}
                            >
                              <div className={cn("mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider font-bold", isSupport ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                <span>{message.author}</span>
                                <span className="ml-4 opacity-70">
                                  {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed">{message.body}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldAlert className="h-3 w-3" /> Conversations are synced to {roleLabel["company"]} and {roleLabel["super-admin"]} dashboards (view only).
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t mt-auto">
                    <div className="flex items-center gap-2 sm:gap-3 px-1">
                      <div className="relative flex-1">
                        <Textarea
                          rows={1}
                          placeholder="Type message..."
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          className="min-h-[44px] max-h-[120px] resize-none pr-3 py-3 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary focus-visible:ring-offset-0 bg-background shadow-inner text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {replyingAllowed && selectedConversation.status !== "Resolved" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleMarkResolved}
                            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                            title="Mark as Resolved"
                          >
                            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        )}
                        <Button 
                          onClick={handleSend} 
                          disabled={!draft.trim()}
                          size="sm"
                          className="h-10 sm:h-11 px-4 sm:px-6 rounded-2xl gradient-primary shadow-glow transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 shrink-0 font-semibold"
                        >
                          <Send className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
                          <span className="text-xs sm:text-sm">Send</span>
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-2">
                      <p className="text-[10px] text-muted-foreground font-medium opacity-80">
                        Messages are synced across all admin dashboards.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
                Select a conversation to view the message history.
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query as fbQuery, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Gem, ArrowDownLeft, ArrowUpRight, Activity } from "lucide-react";

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

type TransactionType = "received" | "withdrawn";
type FromRole = "user" | "reseller" | "agency" | "company" | "host" | "sub-admin";

type DiamondRecord = {
  id: string;
  date: string;
  hostId: string;
  host: string;
  agencyId: string;
  agency: string;
  subAdminId: string;
  subAdmin: string;
  type: TransactionType;
  amount: number;
  fromName: string;
  fromRole: FromRole;
  note?: string;
};

// Mock records removed for Firestore integration

type Filters = {
  search: string;
  hostId: string;
  agencyId: string;
  subAdminId: string;
  type: "all" | TransactionType;
  fromRole: "all" | FromRole;
  dateFrom: string;
  dateTo: string;
};

const initialFilters: Filters = {
  search: "",
  hostId: "all",
  agencyId: "all",
  subAdminId: "all",
  type: "all",
  fromRole: "all",
  dateFrom: "",
  dateTo: "",
};

const fromRoleLabels: Record<FromRole, string> = {
  user: "User",
  reseller: "Reseller",
  agency: "Agency",
  company: "Company",
  host: "Host",
  "sub-admin": "Sub Admin",
};

type EntityKey = "host" | "agency" | "subAdmin";

type AggregatedRow = {
  id: string;
  name: string;
  received: number;
  withdrawn: number;
  balance: number;
  lastActivity?: string;
};

// Summarise inflow/outflow per entity for the breakdown tabs.
const aggregateByEntity = (records: DiamondRecord[], key: EntityKey): AggregatedRow[] => {
  const map = new Map<string, AggregatedRow>();

  records.forEach((record) => {
    const idKey =
      key === "host" ? record.hostId : key === "agency" ? record.agencyId : record.subAdminId;
    const name = key === "host" ? record.host : key === "agency" ? record.agency : record.subAdmin;

    if (!idKey) {
      return;
    }

    const entry = map.get(idKey) ?? {
      id: idKey,
      name,
      received: 0,
      withdrawn: 0,
      balance: 0,
      lastActivity: undefined,
    };

    if (record.type === "received") {
      entry.received += record.amount;
    } else {
      entry.withdrawn += record.amount;
    }

    entry.balance = entry.received - entry.withdrawn;

    if (!entry.lastActivity || new Date(record.date) > new Date(entry.lastActivity)) {
      entry.lastActivity = record.date;
    }

    map.set(idKey, entry);
  });

  return Array.from(map.values()).sort((a, b) => b.received - a.received);
};

export default function SuperAdminDiamonds() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [allRecords, setAllRecords] = useState<DiamondRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = fbQuery(collection(db, "globiliveDiamondTransactions"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const records = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: (d.data() as any).date?.toDate?.()?.toISOString() || (d.data() as any).date
      })) as DiamondRecord[];
      setAllRecords(records);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const hostOptions = useMemo(() => {
    const unique = new Map<string, string>();
    allRecords.forEach((record) => unique.set(record.hostId, record.host));
    return Array.from(unique.entries()).map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [allRecords]);

  const agencyOptions = useMemo(() => {
    const unique = new Map<string, string>();
    allRecords.forEach((record) => unique.set(record.agencyId, record.agency));
    return Array.from(unique.entries()).map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [allRecords]);

  const subAdminOptions = useMemo(() => {
    const unique = new Map<string, string>();
    allRecords.forEach((record) => unique.set(record.subAdminId, record.subAdmin));
    return Array.from(unique.entries()).map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [allRecords]);

  const fromRoleOptions = useMemo(() => {
    const unique = new Set<FromRole>();
    allRecords.forEach((record) => unique.add(record.fromRole));
    return Array.from(unique.values()).sort((a, b) => fromRoleLabels[a].localeCompare(fromRoleLabels[b]));
  }, [allRecords]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter((record) => {
      const haystack = `${record.host} ${record.agency} ${record.subAdmin} ${record.fromName}`.toLowerCase();
      const matchesSearch = filters.search ? haystack.includes(filters.search.toLowerCase()) : true;
      if (!matchesSearch) {
        return false;
      }

      if (filters.hostId !== "all" && record.hostId !== filters.hostId) {
        return false;
      }

      if (filters.agencyId !== "all" && record.agencyId !== filters.agencyId) {
        return false;
      }

      if (filters.subAdminId !== "all" && record.subAdminId !== filters.subAdminId) {
        return false;
      }

      if (filters.type !== "all" && record.type !== filters.type) {
        return false;
      }

      if (filters.fromRole !== "all" && record.fromRole !== filters.fromRole) {
        return false;
      }

      if (filters.dateFrom) {
        const fromDate = new Date(`${filters.dateFrom}T00:00:00`);
        if (new Date(record.date) < fromDate) {
          return false;
        }
      }

      if (filters.dateTo) {
        const toDate = new Date(`${filters.dateTo}T23:59:59`);
        if (new Date(record.date) > toDate) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allRecords, filters]);

  const totals = useMemo(() => {
    return filteredRecords.reduce(
      (acc, record) => {
        if (record.type === "received") {
          acc.received += record.amount;
        } else {
          acc.withdrawn += record.amount;
        }
        acc.net = acc.received - acc.withdrawn;
        return acc;
      },
      { received: 0, withdrawn: 0, net: 0 },
    );
  }, [filteredRecords]);

  const uniqueHostCount = useMemo(() => new Set(filteredRecords.map((record) => record.hostId)).size, [filteredRecords]);
  const uniqueSenderCount = useMemo(() => new Set(filteredRecords.map((record) => record.fromName)).size, [filteredRecords]);

  const hostAggregates = useMemo(() => aggregateByEntity(filteredRecords, "host"), [filteredRecords]);
  const agencyAggregates = useMemo(() => aggregateByEntity(filteredRecords, "agency"), [filteredRecords]);
  const subAdminAggregates = useMemo(() => aggregateByEntity(filteredRecords, "subAdmin"), [filteredRecords]);

  const resetFilters = () => setFilters({ ...initialFilters });

  return (
    <DashboardLayout role="super-admin">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Diamond Ledger</h2>
          <p className="text-muted-foreground">
            Monitor every diamond received and withdrawn across agencies, hosts, and sub-admins.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Filters</CardTitle>
              <p className="text-sm text-muted-foreground">Stack filters to drill into specific diamond movements.</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{filteredRecords.length} records</Badge>
              <Badge variant="outline">{uniqueSenderCount} senders</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <Input
                value={filters.search}
                placeholder="Search hosts, agencies, senders"
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              />

              <Select
                value={filters.hostId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, hostId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by host" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All hosts</SelectItem>
                  {hostOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.agencyId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, agencyId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by agency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agencies</SelectItem>
                  {agencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.subAdminId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, subAdminId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by sub admin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sub admins</SelectItem>
                  {subAdminOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.type}
                onValueChange={(value: Filters["type"]) => setFilters((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.fromRole}
                onValueChange={(value: Filters["fromRole"]) => setFilters((prev) => ({ ...prev, fromRole: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sender type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sender types</SelectItem>
                  {fromRoleOptions.map((role) => (
                    <SelectItem key={role} value={role}>
                      {fromRoleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
              />

              <Input
                type="date"
                value={filters.dateTo}
                onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total diamonds received"
            value={numberFormatter.format(totals.received)}
            icon={ArrowDownLeft}
            variant="success"
          />
          <MetricCard
            title="Total diamonds withdrawn"
            value={numberFormatter.format(totals.withdrawn)}
            icon={ArrowUpRight}
            variant="warning"
          />
          <MetricCard
            title="Net diamonds"
            value={numberFormatter.format(totals.net)}
            icon={Gem}
            variant="primary"
          />
          <MetricCard
            title="Active hosts"
            value={uniqueHostCount}
            icon={Activity}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Diamond activity</CardTitle>
            <p className="text-sm text-muted-foreground">
              Every record shows who moved diamonds, the amount, and the exact timestamp.
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Sub admin</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No diamond history matches your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{formatDateTime(record.date)}</span>
                            <span className="text-xs text-muted-foreground">{record.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>{record.host}</TableCell>
                        <TableCell>{record.agency}</TableCell>
                        <TableCell>{record.subAdmin}</TableCell>
                        <TableCell>
                          <Badge variant={record.type === "received" ? "secondary" : "destructive"}>
                            {record.type === "received" ? "Received" : "Withdrawn"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{numberFormatter.format(record.amount)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{record.fromName}</span>
                            <Badge variant="outline" className="w-fit">
                              {fromRoleLabels[record.fromRole]}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                          {record.note ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entity breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              Compare diamond inflows and outflows by host, agency, and sub admin.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hosts">
              <TabsList>
                <TabsTrigger value="hosts">Hosts</TabsTrigger>
                <TabsTrigger value="agencies">Agencies</TabsTrigger>
                <TabsTrigger value="sub-admins">Sub admins</TabsTrigger>
              </TabsList>

              <TabsContent value="hosts">
                <ScrollArea className="h-[320px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Host</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Withdrawn</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Last activity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hostAggregates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No host data available for the current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        hostAggregates.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{numberFormatter.format(row.received)}</TableCell>
                            <TableCell>{numberFormatter.format(row.withdrawn)}</TableCell>
                            <TableCell className="font-semibold">{numberFormatter.format(row.balance)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {row.lastActivity ? formatDateTime(row.lastActivity) : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="agencies">
                <ScrollArea className="h-[320px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agency</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Withdrawn</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Last activity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agencyAggregates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No agency data available for the current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        agencyAggregates.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{numberFormatter.format(row.received)}</TableCell>
                            <TableCell>{numberFormatter.format(row.withdrawn)}</TableCell>
                            <TableCell className="font-semibold">{numberFormatter.format(row.balance)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {row.lastActivity ? formatDateTime(row.lastActivity) : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="sub-admins">
                <ScrollArea className="h-[320px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sub admin</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Withdrawn</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Last activity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subAdminAggregates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No sub-admin data available for the current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        subAdminAggregates.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{numberFormatter.format(row.received)}</TableCell>
                            <TableCell>{numberFormatter.format(row.withdrawn)}</TableCell>
                            <TableCell className="font-semibold">{numberFormatter.format(row.balance)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {row.lastActivity ? formatDateTime(row.lastActivity) : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetAdminStats, useListRequests, getListRequestsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Eye, Search, CreditCard, Clock, CheckCircle2, UserCheck, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { adminToken } = useAuth();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Redirect if not logged in
  if (adminToken === null) {
    setLocation("/admin/login");
    return null;
  }

  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  
  const listParams = {
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(searchQuery ? { search: searchQuery } : {}),
  };
  
  const { data: requests, isLoading: requestsLoading } = useListRequests(listParams, {
    query: { queryKey: getListRequestsQueryKey(listParams) }
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey(listParams) });
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-muted/10">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage and track student ID reissue requests.</p>
          </div>
          <Button variant="outline" onClick={handleRefresh} className="shrink-0">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white dark:bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-400">Pending</CardTitle>
              <Clock className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900 dark:text-amber-300">{stats?.pending || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-400">Approved</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-300">{stats?.approved || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-400">Ready</CardTitle>
              <UserCheck className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 dark:text-green-300">{stats?.readyToCollect || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-400">Awaiting Pay</CardTitle>
              <CreditCard className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-300">{stats?.paymentPending || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Table */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="px-6 py-4 border-b bg-muted/20">
            <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
              <CardTitle className="text-lg">Recent Requests</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, register no..."
                    className="pl-9 w-full sm:w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="payment_pending">Payment Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="ready_to_collect">Ready to Collect</SelectItem>
                    <SelectItem value="collected">Collected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[120px]">Req No.</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Register No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Loading requests...
                      </TableCell>
                    </TableRow>
                  ) : requests && requests.length > 0 ? (
                    requests.map((req) => (
                      <TableRow key={req.id} className="group hover:bg-muted/20 transition-colors">
                        <TableCell className="font-mono text-sm font-medium">{req.requestNumber}</TableCell>
                        <TableCell className="font-medium">{req.studentName}</TableCell>
                        <TableCell>{req.registerNumber}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={req.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/requests/${req.id}`}>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No requests found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

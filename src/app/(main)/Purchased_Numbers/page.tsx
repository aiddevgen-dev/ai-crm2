'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://ai-crm2-backend2.onrender.com'
  : 'http://127.0.0.1:5000';

interface MongoDate {
  $date: string;
}

interface PurchasedNumber {
  _id: string;
  phone_number: string;
  status: 'available' | 'assigned';
  monthly_cost: number;
  ordered_date: MongoDate;
  assigned_to_user_id: string | null;
  // 👇 add these
  assigned_agent_name?: string | null;
  assigned_agent_type?: string | null;
}

interface OrderHistory {
  _id: string;
  status: 'completed' | 'failed';
  fulfilled_numbers: string[];
  failed_numbers: string[];
  ordered_at: MongoDate;
  ordered_by_user_id: string;
  ordered_by_name?: string;
}

interface RegisteredTenant {
  _id: string;
  email: string;
  name: string;
}

export default function InventoryPage() {
  const [purchasedNumbers, setPurchasedNumbers] = useState<PurchasedNumber[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [availableTenants, setAvailableTenants] = useState<RegisteredTenant[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isFetchingTenants, setIsFetchingTenants] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [selectedNumber, setSelectedNumber] = useState<PurchasedNumber | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication token not found.');

      const [numbersResponse, ordersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/telnyx-numbers`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/telnyx-numbers/orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      if (!numbersResponse.ok || !ordersResponse.ok) throw new Error('Failed to fetch data.');

      const numbersData = await numbersResponse.json();
      const ordersData = await ordersResponse.json();

      setPurchasedNumbers(numbersData);
      setOrderHistory(ordersData);
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: `Failed to load inventory: ${err.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  const fetchAgents = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/agents`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.ok) {
      const data = await response.json();
      setAvailableAgents(data.agents || []);
    }
  } catch (err) {
    console.error('Failed to fetch agents:', err);
  }
};
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchTenants = async () => {
    setIsFetchingTenants(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/register-tenants`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch tenants.');
      const data = await response.json();
      setAvailableTenants(data.tenants || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsFetchingTenants(false);
    }
  };

  const handleOpenAssignModal = (number: PurchasedNumber) => {
  setSelectedNumber(number);
  setSelectedTenantId(null);
  setSelectedAgentId(''); // Add this line
  setIsAssignModalOpen(true);
  fetchTenants();
  fetchAgents(); // Add this line
};

  const handleConfirmAssignment = async () => {
    if (!selectedNumber || !selectedTenantId) {
      toast({ title: "Selection Missing", description: "Please select a tenant to assign the number to.", variant: "destructive" });
      return;
    }
    setIsAssigning(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/telnyx-numbers/${selectedNumber._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_id: selectedTenantId,
        agent_id: selectedAgentId || null }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign number.');
      }

      toast({ title: "Success", description: `Number successfully assigned.` });
      setIsAssignModalOpen(false);
      fetchData(); // Refresh the main data view
    } catch (err: any) {
      toast({ title: "Assignment Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsAssigning(false);
    }
  };

  const formatDate = (dateObject: MongoDate) => {
    if (!dateObject?.$date) return 'Invalid Date';
    return new Date(dateObject.$date).toLocaleString();
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center py-12 text-red-600"><p>{error}</p></div>;

  return (
    <>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>My Phone Number Inventory</CardTitle>
            <CardDescription>A list of all phone numbers your company has purchased and their assignment status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                   <TableHead>Assigned Agent</TableHead>
                  <TableHead className="text-right">Monthly Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchasedNumbers.map((num) => (
                  <TableRow key={num._id}>
                    <TableCell className="font-mono font-medium">{num.phone_number}</TableCell>

                    <TableCell>
                      <Badge variant={num.status === 'available' ? 'default' : 'secondary'}>{num.status.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {num.assigned_to_user_id ? String(num.assigned_to_user_id) : 'Unassigned'}
                    </TableCell>

                    <TableCell>
                    {num.assigned_agent_name ? (
                      <div className="text-sm">
                        <div className="font-medium">{num.assigned_agent_name}</div>
                        <div className="text-muted-foreground">{num.assigned_agent_type}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No agent</span>
                    )}
                  </TableCell>
                    <TableCell className="text-right font-mono">${num.monthly_cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {num.status === 'available' && (
                        <Button variant="outline" size="sm" onClick={() => handleOpenAssignModal(num)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>A log of all phone number purchase transactions.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Numbers</TableHead>
                  <TableHead>Purchased By</TableHead>
                  <TableHead className="text-right">Order Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderHistory.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      <Badge variant={order.status === 'completed' ? 'default' : 'destructive'} className={order.status === 'completed' ? 'bg-green-100 text-green-800' : ''}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {order.fulfilled_numbers.map(n => <span key={n} className="font-mono text-xs">{n}</span>)}
                        {order.failed_numbers.map(n => <span key={n} className="font-mono text-xs text-red-500 line-through">{n}</span>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{order.ordered_by_name || order.ordered_by_user_id}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatDate(order.ordered_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Phone Number</DialogTitle>
            <DialogDescription>
              Assign the number <span className="font-mono font-bold">{selectedNumber?.phone_number}</span> to a tenant.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
  <div>
    <label className="text-sm font-medium">Select Tenant *</label>
    {isFetchingTenants ? (
      <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
    ) : (
      <Select onValueChange={setSelectedTenantId} value={selectedTenantId || ''}>
        <SelectTrigger>
          <SelectValue placeholder="Select a tenant..." />
        </SelectTrigger>
        <SelectContent>
          {availableTenants.map(tenant => (
            <SelectItem key={tenant._id} value={tenant._id}>
              {tenant.name} ({tenant.email})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  </div>
          
          <div>
            <label className="text-sm font-medium">Assign Agent (Optional)</label>
            <Select onValueChange={setSelectedAgentId} value={selectedAgentId || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent (optional)..." />
              </SelectTrigger>
              <SelectContent>
                {availableAgents.map(agent => (
                  <SelectItem key={agent.agent_id} value={agent.agent_id}>
                    {agent.name} ({agent.agent_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmAssignment} disabled={isAssigning || !selectedTenantId}>
              {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, Phone, MapPin, DollarSign, Settings2, ShoppingCart, PlusCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define the base URL for the API, consistent with your project
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://ai-crm2-backend2.onrender.com'
  : 'http://127.0.0.1:5000';

// Define the structure of a Telnyx number based on your new API response
interface RegionInfo {
  region_type: string;
  region_name: string;
}
interface TelnyxNumber {
  phone_number: string;
  cost_information: {
    monthly_cost: string;
    upfront_cost: string;
    currency: string;
  };
  features: { name: string }[];
  region_information: RegionInfo[];
}

// Define the structure of the API response
interface ApiResponse {
  available_numbers: TelnyxNumber[];
  count: number;
}

export default function TelnyxNumbersPage() {
  const [availableNumbers, setAvailableNumbers] = useState<TelnyxNumber[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({ areaCode: '', state: '' });
  const { toast } = useToast();

  // Function to fetch numbers from the backend
  const fetchNumbers = useCallback(async (params: { areaCode: string; state: string }) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const query = new URLSearchParams();
      if (params.areaCode) query.append('area_code', params.areaCode);
      if (params.state) query.append('state', params.state);

      const response = await fetch(`${API_BASE_URL}/api/telnyx-numbers/search?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setAvailableNumbers(data.available_numbers);
    } catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  setError(message);
  toast({
    title: "Error",
    description: `Failed to fetch numbers: ${message}`,
    variant: "destructive",
  });
}
 finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch numbers on initial component load
  useEffect(() => {
    fetchNumbers({ areaCode: '', state: '' });
  }, [fetchNumbers]);

  const handleSearch = () => {
    fetchNumbers(searchParams);
  };

  const handleSelectNumber = (phoneNumber: string) => {
    setSelectedNumbers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phoneNumber)) {
        newSet.delete(phoneNumber);
      } else {
        newSet.add(phoneNumber);
      }
      return newSet;
    });
  };
  
  const handleOrderNumbers = async () => {
    if (selectedNumbers.size === 0) {
      toast({
        title: "No Numbers Selected",
        description: "Please select at least one number to purchase.",
        variant: "destructive",
      });
      return;
    }

    setIsOrdering(true);
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/api/telnyx-numbers/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ phone_numbers: Array.from(selectedNumbers),connection_id: "2771041327389869899" ,messaging_profile_id: "400198ea-6b87-4fa8-be44-208213fdfe57"  }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to place order.");
        }

        const result = await response.json();
        toast({
            title: "Order Successful",
            description: `${result.ordered_numbers.length} number(s) purchased successfully.`,
        });
        setSelectedNumbers(new Set()); // Clear selection after successful order
        fetchNumbers(searchParams); // Refresh the list of available numbers
   } catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  setError(message);
  toast({
    title: "Error",
    description: `Failed to fetch numbers: ${message}`,
    variant: "destructive",
  });
}
 finally {
        setIsOrdering(false);
    }
  };

  // Helper to extract location from region_information
  const getLocation = (regions: RegionInfo[]) => {
    const state = regions.find(r => r.region_type === 'state')?.region_name || 'N/A';
    const city = regions.find(r => r.region_type === 'location')?.region_name || 'N/A';
    return `${city}, ${state}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phone Number Marketplace</CardTitle>
          <CardDescription>Search for and purchase new phone numbers for your tenants.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 border rounded-lg bg-muted/40">
            <div className="space-y-2">
              <Label htmlFor="areaCode">Area Code</Label>
              <Input
                id="areaCode"
                placeholder="e.g., 512"
                value={searchParams.areaCode}
                onChange={(e) => setSearchParams({ ...searchParams, areaCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="e.g., TX"
                value={searchParams.state}
                onChange={(e) => setSearchParams({ ...searchParams, state: e.target.value })}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="w-full md:w-auto">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>

          {/* Results Table */}
          <Card>
            <CardHeader>
                <CardTitle>Available Numbers</CardTitle>
                <CardDescription>
                    {loading ? "Searching for numbers..." : `Found ${availableNumbers.length} numbers matching your criteria.`}
                </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">
                  <p>{error}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><Phone className="inline-block h-4 w-4 mr-2" />Phone Number</TableHead>
                      <TableHead><MapPin className="inline-block h-4 w-4 mr-2" />Location</TableHead>
                      <TableHead><Settings2 className="inline-block h-4 w-4 mr-2" />Features</TableHead>
                      <TableHead className="text-right"><DollarSign className="inline-block h-4 w-4 mr-2" />Pricing (Upfront / Monthly)</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableNumbers.length > 0 ? availableNumbers.map((num) => (
                      <TableRow key={num.phone_number}>
                        <TableCell className="font-mono font-medium">{num.phone_number}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {getLocation(num.region_information)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {num.features.map(f => <Badge key={f.name} variant="secondary">{f.name.toUpperCase()}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${parseFloat(num.cost_information.upfront_cost).toFixed(2)} / ${parseFloat(num.cost_information.monthly_cost).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant={selectedNumbers.has(num.phone_number) ? "destructive" : "outline"} 
                            size="sm"
                            onClick={() => handleSelectNumber(num.phone_number)}
                          >
                            {selectedNumbers.has(num.phone_number) 
                              ? <XCircle className="h-4 w-4 mr-2" /> 
                              : <PlusCircle className="h-4 w-4 mr-2" />}
                            {selectedNumbers.has(num.phone_number) ? "Remove" : "Select"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          No numbers found. Try adjusting your search criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Purchase Summary Section */}
      {selectedNumbers.size > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>Purchase Summary</CardTitle>
                <CardDescription>You have selected {selectedNumbers.size} number(s) to purchase.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    {Array.from(selectedNumbers).map(num => (
                        <Badge key={num} variant="outline" className="font-mono text-sm p-2">{num}</Badge>
                    ))}
                </div>
                <Button size="lg" onClick={handleOrderNumbers} disabled={isOrdering}>
                    {isOrdering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                    Purchase {selectedNumbers.size} Number(s)
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

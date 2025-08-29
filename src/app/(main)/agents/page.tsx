'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Phone, Trash2, Edit, Bot, Unlink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://ai-crm2-backend2.onrender.com'
  : 'http://127.0.0.1:5000';

interface Tool {
  id: string;
  name: string;
  description: string;
}

interface Agent {
  id: string;
  agent_id: string;
  name: string;
  description: string;
  system_prompt: string;
  assigned_tools: string[];
  agent_type: string;
  status: string;
  assigned_to_phone_number: string | null;
  phone_number_details?: {
    phone_number: string;
    status: string;
  };
  created_at: string;
  updated_at: string;
}

interface AvailablePhone {
  phone_number: string;
  status: string;
  assigned_to_user_id: string;
}

const AGENT_TYPES = [
  { value: 'general', label: 'General Assistant' },
  { value: 'sales', label: 'Sales Agent' },
  { value: 'support', label: 'Customer Support' },
  { value: 'appointment', label: 'Appointment Scheduler' },
  { value: 'technical', label: 'Technical Support' },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [availablePhones, setAvailablePhones] = useState<AvailablePhone[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignPhoneModalOpen, setIsAssignPhoneModalOpen] = useState(false);
  
  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>('');
  
  // Create/Edit form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
    assigned_tools: [] as string[],
    agent_type: 'general'
  });

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication token not found.');

      const [agentsResponse, toolsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/agents`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }),
        fetch(`${API_BASE_URL}/api/agents/tools`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
      ]);

      if (!agentsResponse.ok || !toolsResponse.ok) {
        throw new Error('Failed to fetch data.');
      }

      const agentsData = await agentsResponse.json();
      const toolsData = await toolsResponse.json();

      setAgents(agentsData.agents || []);
      setAvailableTools(toolsData.tools || []);
    } catch (err: any) {
      setError(err.message);
      toast({ 
        title: "Error", 
        description: `Failed to load agents: ${err.message}`, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchAvailablePhones = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/agents/available-phones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailablePhones(data.available_phones || []);
      }
    } catch (err) {
      console.error('Failed to fetch available phones:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      system_prompt: '',
      assigned_tools: [],
      agent_type: 'general'
    });
  };

  const handleCreateAgent = async () => {
    if (!formData.name.trim() || !formData.system_prompt.trim() || formData.assigned_tools.length === 0) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill in all required fields and select at least one tool.", 
        variant: "destructive" 
      });
      return;
    }

    setIsCreating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create agent.');
      }

      toast({ title: "Success", description: "Agent created successfully." });
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast({ 
        title: "Creation Failed", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description,
      system_prompt: agent.system_prompt,
      assigned_tools: agent.assigned_tools,
      agent_type: agent.agent_type
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/agents/${selectedAgent.agent_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update agent.');
      }

      toast({ title: "Success", description: "Agent updated successfully." });
      setIsEditModalOpen(false);
      setSelectedAgent(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast({ 
        title: "Update Failed", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    if (!confirm(`Are you sure you want to delete agent "${agent.name}"?`)) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/agents/${agent.agent_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete agent.');
      }

      toast({ title: "Success", description: "Agent deleted successfully." });
      fetchData();
    } catch (err: any) {
      toast({ 
        title: "Deletion Failed", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignPhone = (agent: Agent) => {
    setSelectedAgent(agent);
    setSelectedPhoneNumber('');
    setIsAssignPhoneModalOpen(true);
    fetchAvailablePhones();
  };

  const handleConfirmPhoneAssignment = async () => {
    if (!selectedAgent || !selectedPhoneNumber) {
      toast({ 
        title: "Selection Missing", 
        description: "Please select a phone number.", 
        variant: "destructive" 
      });
      return;
    }

    setIsAssigning(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/agents/${selectedAgent.agent_id}/assign-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone_number: selectedPhoneNumber })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign phone number.');
      }

      toast({ title: "Success", description: "Agent assigned to phone number successfully." });
      setIsAssignPhoneModalOpen(false);
      setSelectedAgent(null);
      setSelectedPhoneNumber('');
      fetchData();
    } catch (err: any) {
      toast({ 
        title: "Assignment Failed", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignPhone = async (agent: Agent) => {
    if (!confirm(`Are you sure you want to unassign agent "${agent.name}" from phone number ${agent.assigned_to_phone_number}?`)) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/agents/${agent.agent_id}/unassign-phone`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign phone number.');
      }

      toast({ title: "Success", description: "Agent unassigned from phone number successfully." });
      fetchData();
    } catch (err: any) {
      toast({ 
        title: "Unassignment Failed", 
        description: err.message, 
        variant: "destructive" 
      });
    }
  };

  const handleToolToggle = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_tools: prev.assigned_tools.includes(toolId)
        ? prev.assigned_tools.filter(id => id !== toolId)
        : [...prev.assigned_tools, toolId]
    }));
  };

  const getToolNames = (toolIds: string[]) => {
    return toolIds.map(id => {
      const tool = availableTools.find(t => t.id === id);
      return tool ? tool.name : id;
    }).join(', ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">AI Agents</h1>
            <p className="text-muted-foreground">
              Create and manage AI agents for your phone numbers
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>

        {/* Agents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your AI Agents</CardTitle>
            <CardDescription>
              Manage AI agents that handle calls on your phone numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Tools</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {agent.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {AGENT_TYPES.find(t => t.value === agent.agent_type)?.label || agent.agent_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agent.status === 'active' ? 'default' : 'destructive'}>
                          {agent.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getToolNames(agent.assigned_tools)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {agent.assigned_to_phone_number ? (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-green-500" />
                            <span className="font-mono text-sm">
                              {agent.assigned_to_phone_number}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAgent(agent)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {agent.assigned_to_phone_number ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnassignPhone(agent)}
                            >
                              <Unlink className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignPhone(agent)}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAgent(agent)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Create Agent Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>
                Create an AI agent that can handle calls on your phone numbers.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Agent Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    placeholder="e.g., Sales Assistant"
                  />
                </div>
                <div>
                  <Label htmlFor="agent_type">Agent Type</Label>
                  <Select 
                    value={formData.agent_type} 
                    onValueChange={(value) => setFormData(prev => ({...prev, agent_type: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  placeholder="Brief description of the agent's purpose"
                />
              </div>

              {/* System Prompt */}
              <div>
                <Label htmlFor="system_prompt">System Prompt *</Label>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData(prev => ({...prev, system_prompt: e.target.value}))}
                  placeholder="Enter the system prompt that defines how the agent should behave..."
                  rows={6}
                />
              </div>

              {/* Tools Selection */}
              <div>
                <Label>Available Tools * (Select at least one)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {availableTools.map(tool => (
                    <div key={tool.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={tool.id}
                        checked={formData.assigned_tools.includes(tool.id)}
                        onCheckedChange={() => handleToolToggle(tool.id)}
                      />
                      <div className="flex flex-col">
                        <Label htmlFor={tool.id} className="text-sm font-medium">
                          {tool.name}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {tool.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateAgent} disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Agent Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Agent</DialogTitle>
              <DialogDescription>
                Update the agent configuration and settings.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Agent Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-agent_type">Agent Type</Label>
                  <Select 
                    value={formData.agent_type} 
                    onValueChange={(value) => setFormData(prev => ({...prev, agent_type: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                />
              </div>

              {/* System Prompt */}
              <div>
                <Label htmlFor="edit-system_prompt">System Prompt *</Label>
                <Textarea
                  id="edit-system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData(prev => ({...prev, system_prompt: e.target.value}))}
                  rows={6}
                />
              </div>

              {/* Tools Selection */}
              <div>
                <Label>Available Tools *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {availableTools.map(tool => (
                    <div key={tool.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`edit-${tool.id}`}
                        checked={formData.assigned_tools.includes(tool.id)}
                        onCheckedChange={() => handleToolToggle(tool.id)}
                      />
                      <div className="flex flex-col">
                        <Label htmlFor={`edit-${tool.id}`} className="text-sm font-medium">
                          {tool.name}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {tool.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditModalOpen(false);
                setSelectedAgent(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAgent} disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Phone Modal */}
        <Dialog open={isAssignPhoneModalOpen} onOpenChange={setIsAssignPhoneModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Phone Number</DialogTitle>
              <DialogDescription>
                Assign agent <span className="font-bold">{selectedAgent?.name}</span> to a phone number.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Label htmlFor="phone-select">Select Phone Number</Label>
              <Select value={selectedPhoneNumber} onValueChange={setSelectedPhoneNumber}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a phone number..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePhones.map(phone => (
                    <SelectItem key={phone.phone_number} value={phone.phone_number}>
                      {phone.phone_number} ({phone.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignPhoneModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmPhoneAssignment} 
                disabled={isAssigning || !selectedPhoneNumber}
              >
                {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Phone Number
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
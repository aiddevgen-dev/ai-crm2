'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar as CalendarIcon, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://ai-crm2-backend2.onrender.com'
    : 'http://127.0.0.1:5000';

type GEvent = {
  id?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

export default function CalendarIntegrationPage() {
  const { toast } = useToast();

  const [integrated, setIntegrated] = useState<boolean>(false);
  const [calendarEmail, setCalendarEmail] = useState<string>('');
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);

  const [events, setEvents] = useState<GEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null), []);

  // 1) On mount: check integration; if integrated, fetch events
  useEffect(() => {
    (async () => {
      await checkStatus();
      // Optionally auto-refresh after OAuth success flag in URL (?calendar_integrated=success)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('calendar_integrated') === 'success') {
          // Clear the flag from URL for cleanliness
          params.delete('calendar_integrated');
          const newUrl =
            window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
          window.history.replaceState({}, '', newUrl);
          toast({ title: 'Google Calendar connected', description: 'Fetching your events…' });
          await fetchEvents();
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch(`${API_BASE_URL}/auth/google/calendar/status`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to check status');

      const data = await res.json();
      setIntegrated(!!data.integrated);
      setCalendarEmail(data.email || '');

      if (data.integrated) {
        await fetchEvents();
      } else {
        setEvents([]);
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not check integration.' });
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await fetch(`${API_BASE_URL}/auth/google/calendar/events`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        credentials: 'include',
      });

      // Backend returns whole Calendar API payload; normalize to items[]
      const json = await res.json();
      if (!res.ok) {
        const msg = json?.error || 'Failed to fetch Google Calendar events';
        throw new Error(msg);
      }

      const items: GEvent[] = Array.isArray(json?.items) ? json.items : [];
      setEvents(items);
    } catch (e: unknown) {
      const errorMessage =
        typeof e === 'object' && e !== null && 'message' in e
          ? (e as { message?: string }).message
          : 'Could not fetch events.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const startIntegration = () => {
    if (!token) {
      toast({ variant: 'destructive', title: 'Not signed in', description: 'Please log in first.' });
      return;
    }
    // Open the OAuth flow in the same tab (or use window.open for a popup)
    // Requires tiny backend fallback: accept ?token= to authenticate this redirect-init.
    const url = `${API_BASE_URL}/auth/google/calendar/integrate?token=${encodeURIComponent(token)}`;
    window.location.href = url;
  };

  const disconnect = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google/calendar/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to disconnect');
      }

      toast({ title: 'Disconnected', description: 'Google Calendar has been disconnected.' });
      setIntegrated(false);
      setCalendarEmail('');
      setEvents([]);
    } catch (e: unknown) {
      const errorMessage =
        typeof e === 'object' && e !== null && 'message' in e
          ? (e as { message?: string }).message
          : 'Could not disconnect.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    }
  };

  const formatWhen = (ev: GEvent) => {
    const start = ev.start?.dateTime || ev.start?.date;
    if (!start) return 'No start time';
    const d = new Date(start);
    return isNaN(d.getTime()) ? start : d.toLocaleString();
    // (You can format better if you like.)
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">Connect your Google Calendar and view upcoming events.</p>
        </div>

        <div className="flex items-center gap-2">
          {loadingStatus ? (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking…
            </Button>
          ) : integrated ? (
            <>
              <Badge variant="default">Connected</Badge>
              {calendarEmail && (
                <span className="text-xs text-muted-foreground">as {calendarEmail}</span>
              )}
              <Button variant="outline" onClick={fetchEvents} disabled={loadingEvents}>
                {loadingEvents ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                  </>
                )}
              </Button>
              <Button variant="destructive" onClick={disconnect}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button onClick={startIntegration}>Integrate Google Calendar</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Loaded</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">From your primary Google Calendar</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Your next events from Google Calendar</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEvents ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !integrated ? (
            <p className="text-sm text-muted-foreground">Connect Google Calendar to see events.</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events found.</p>
          ) : (
            <div className="space-y-3">
              {events.map((ev, idx) => (
                <div
                  key={ev.id ?? `${idx}-${ev.summary ?? 'event'}`}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{ev.summary || '(No title)'}</div>
                    {ev.description && (
                      <div className="text-sm text-muted-foreground line-clamp-2">{ev.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground">{formatWhen(ev)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

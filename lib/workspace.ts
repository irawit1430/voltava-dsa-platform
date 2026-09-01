import { getAccessToken } from './firebase';

export async function createCalendarEvent(title: string, description: string, startTime: string, endTime: string) {
  const token = await getAccessToken();
  if (!token) throw new Error("No Google access token. Please sign in again.");

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: title,
      description: description,
      start: { dateTime: startTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: { dateTime: endTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error("Failed to communicate with Calendar API.");
  }
  return response.json();
}

export async function createGoogleTask(title: string, notes: string, due: string) {
  const token = await getAccessToken();
  if (!token) throw new Error("No Google access token. Please sign in again.");

  const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!listsRes.ok) throw new Error("Could not fetch task lists");
  const listsData = await listsRes.json();
  const defaultList = listsData.items?.[0]?.id || '@default';

  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${defaultList}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      notes,
      due: due,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error("Failed to communicate with Tasks API.");
  }
  return response.json();
}

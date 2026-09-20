self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const data = event.notification.data || {};
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    let client = allClients.find(c => c.url.includes(self.location.origin)) || null;
    if (!client && clients.openWindow) {
      try { client = await clients.openWindow(data.url || '/'); } catch(e) {}
    }
    if (client) {
      try { await client.focus(); } catch(e) {}
      // Post message to client to trigger corresponding action
      try { client.postMessage({ type: 'notification-action', action, actionType: data.actionType }); } catch(e) {}
    }
  })());
});
self.addEventListener('notificationclose', (event) => {
  // no-op
});

import { supabase, isSupabaseConfigured } from './supabaseClient';

const CHANNEL_NAME = 'realynk_enterprise_live_v1';
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

let listeners = [];

function handleIncomingPayload(payload) {
  if (!payload) return;
  try {
    const notifs = JSON.parse(localStorage.getItem('realynk_admin_notifications')) || [];
    if (!notifs.some(n => n.id === payload.id)) {
      notifs.unshift(payload);
      localStorage.setItem('realynk_admin_notifications', JSON.stringify(notifs.slice(0, 50)));
    }

    if (payload.userId) {
      const activeUsers = JSON.parse(localStorage.getItem('realynk_live_online_users')) || {};
      if (payload.isActive || payload.type === 'LOGIN' || payload.type === 'CLOCK_IN') {
        activeUsers[payload.userId] = {
          userId: payload.userId,
          name: payload.userName || payload.userId,
          department: payload.department || 'Shared Services',
          loginTime: Date.now()
        };
      } else if (payload.isActive === false || payload.type === 'LOGOUT') {
        delete activeUsers[payload.userId];
      }
      localStorage.setItem('realynk_live_online_users', JSON.stringify(activeUsers));
    }

    if (payload.type === 'CLOCK_IN' && payload.userId) {
      const shifts = JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {};
      shifts[payload.userId] = {
        startTime: Date.now(),
        userName: payload.userName || payload.userId,
        userId: payload.userId,
        department: payload.department || 'Shared Services'
      };
      localStorage.setItem('realynk_live_active_shifts', JSON.stringify(shifts));
    } else if (payload.type === 'CLOCK_OUT' && payload.userId) {
      const shifts = JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {};
      delete shifts[payload.userId];
      localStorage.setItem('realynk_live_active_shifts', JSON.stringify(shifts));
    }
  } catch (err) {
    console.error('Payload processing error:', err);
  }

  listeners.forEach(cb => {
    try { cb(payload); } catch (e) {}
  });
}

let supaChannel = null;
if (isSupabaseConfigured && supabase) {
  supaChannel = supabase.channel(CHANNEL_NAME, {
    config: { broadcast: { self: true } }
  })
  .on('broadcast', { event: 'realynk_alert' }, (res) => {
    handleIncomingPayload(res.payload);
  })
  .subscribe();
}

if (bc) {
  bc.addEventListener('message', (e) => {
    if (e.data) handleIncomingPayload(e.data);
  });
}

export const realtimeBus = {
  broadcast: (eventData) => {
    // 1. Process locally first
    handleIncomingPayload(eventData);

    // 2. BroadcastChannel (cross-tab in same browser profile)
    if (bc) {
      try { bc.postMessage(eventData); } catch (e) {}
    }

    // 3. Supabase Cloud Broadcast (cross-browser / cross-device across internet)
    if (supaChannel && isSupabaseConfigured) {
      supaChannel.send({
        type: 'broadcast',
        event: 'realynk_alert',
        payload: eventData
      }).catch(err => console.error('Supabase broadcast send failed:', err));
    }
  },

  subscribe: (callback) => {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter(cb => cb !== callback);
    };
  }
};

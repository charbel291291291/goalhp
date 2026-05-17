import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { useTranslation } from 'react-i18next';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export type NotificationState = 'unsupported' | 'denied' | 'granted' | 'prompt';

type MatchTeamLite = { name_en?: string; name_ar?: string; flag_emoji?: string };
type UpcomingMatch = { id: string; kickoff_at: string; team_a?: MatchTeamLite | null; team_b?: MatchTeamLite | null };

export function usePushNotifications() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [permission, setPermission] = useState<NotificationState>('prompt');
  const [enabled, setEnabled] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscriptionJSON | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedMatches = useRef<Set<string>>(new Set());

  const loadSubscription = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) setSubscription(sub.toJSON());
    } catch (error: unknown) {
      console.error('Load subscription failed:', getErrorMessage(error));
    }
  }, []);

  const checkUpcomingMatches = useCallback(async () => {
    try {
      const now = new Date();
      const in30Min = new Date(now.getTime() + 30 * 60000);

      const { data, error } = await supabase
        .from('matches')
        .select('id, kickoff_at, team_a:team_a_id(name_en, name_ar, flag_emoji), team_b:team_b_id(name_en, name_ar, flag_emoji)')
        .gte('kickoff_at', now.toISOString())
        .lte('kickoff_at', in30Min.toISOString())
        .eq('status', 'scheduled');

      if (error) throw new Error(error.message);
      const matches = (data ?? []) as unknown as UpcomingMatch[];

      for (const match of matches) {
        if (notifiedMatches.current.has(match.id)) continue;

        const minutesUntil = Math.round((new Date(match.kickoff_at).getTime() - now.getTime()) / 60000);
        if (minutesUntil <= 30 && minutesUntil > 0) {
          notifiedMatches.current.add(match.id);

          const teamA = match.team_a?.name_en || '';
          const teamB = match.team_b?.name_en || '';

          showLocalNotification(
            lang === 'ar'
              ? `المباراة على وشك البدء! ${teamA} vs ${teamB}`
              : `Match starting soon! ${teamA} vs ${teamB}`,
            lang === 'ar'
              ? `${minutesUntil} دقائق حتى البداية`
              : `${minutesUntil} minutes to kickoff`
          );
        }
      }
    } catch (error: unknown) {
      console.error('Upcoming matches check failed:', getErrorMessage(error));
    }
  }, [lang]);

  const subscribePush = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      console.error('Missing VAPID public key (VITE_VAPID_PUBLIC_KEY).');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON();
      setSubscription(subJson);

      await supabase.rpc('save_push_subscription', {
        p_endpoint: subJson.endpoint,
        p_p256dh: subJson.keys?.p256dh || '',
        p_auth: subJson.keys?.auth || '',
      });
    } catch (error: unknown) {
      console.error('Push subscription failed:', getErrorMessage(error));
    }
  }, []);

  // Check initial state
  useEffect(() => {
    if (!('Notification' in window)) {
      queueMicrotask(() => setPermission('unsupported'));
      return;
    }

    queueMicrotask(() => setPermission(Notification.permission as NotificationState));

    if (Notification.permission === 'granted') {
      queueMicrotask(() => setEnabled(true));
      queueMicrotask(() => {
        void loadSubscription();
      });
    }
  }, [loadSubscription]);

  // Poll for upcoming matches when enabled
  useEffect(() => {
    if (!enabled) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = setInterval(() => {
      void checkUpcomingMatches();
    }, 60000);

    void checkUpcomingMatches();

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [enabled, checkUpcomingMatches]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;

    const result = await Notification.requestPermission();
    setPermission(result as NotificationState);

    if (result === 'granted') {
      setEnabled(true);
      await subscribePush();
      return true;
    }

    return false;
  }, [subscribePush]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      setSubscription(null);
      setEnabled(false);

      await supabase.rpc('remove_push_subscription');
    } catch (error: unknown) {
      console.error('Unsubscribe failed:', getErrorMessage(error));
    }
  }, []);

  const toggleNotifications = useCallback(async () => {
    if (enabled) {
      await unsubscribe();
      return false;
    }

    if (permission === 'denied') return false;
    return requestPermission();
  }, [enabled, permission, requestPermission, unsubscribe]);

  return {
    permission,
    enabled,
    subscription,
    requestPermission,
    toggleNotifications,
    unsubscribe,
  };
}

// Show a local notification (when app is open or as fallback)
export function showLocalNotification(title: string, body?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const options: NotificationOptions = {
    body,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: 'quizgoal-notification',
  };

  navigator.serviceWorker.ready
    .then((reg) => reg.showNotification(title, options))
    .catch((error: unknown) => {
      console.error('Show notification failed:', getErrorMessage(error));
      try {
        new Notification(title, { body, icon: '/icon-192.svg' });
      } catch (fallbackError: unknown) {
        console.error('Notification fallback failed:', getErrorMessage(fallbackError));
      }
    });
}

// Check predictions and notify on resolution
export async function checkPredictionResults(userId: string) {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('id, created_at, points_awarded, match:match_id(*)')
      .eq('user_id', userId)
      .eq('resolved', true)
      .gt('points_awarded', 0)
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) throw new Error(error.message);
    const predictions = (data ?? []) as unknown as Array<{ created_at: string; points_awarded: number }>;

    const lastChecked = localStorage.getItem('quizgoal_prediction_check');
    const lastCheckTime = lastChecked ? new Date(lastChecked).getTime() : 0;

    for (const prediction of predictions) {
      const createdAt = new Date(prediction.created_at).getTime();
      if (createdAt > lastCheckTime && prediction.points_awarded > 0) {
        showLocalNotification('Prediction Result!', `You earned ${prediction.points_awarded} points from your prediction!`);
      }
    }

    localStorage.setItem('quizgoal_prediction_check', new Date().toISOString());
  } catch (error: unknown) {
    console.error('Prediction results check failed:', getErrorMessage(error));
  }
}

import { useNotifications } from './context.ts';
import { NotificationItem } from './NotificationItem.tsx';

// Yeni bildirimlerin köşede kısa süre görünmesi
export function Toasts() {
  const { items, toastIds, hideToast } = useNotifications();
  const visible = items.filter((n) => toastIds.includes(n.id));
  if (visible.length === 0) return null;

  return (
    <div className="toasts" role="status" aria-live="polite">
      {visible.map((item) => (
        <NotificationItem key={item.id} item={item} onDismiss={() => hideToast(item.id)} />
      ))}
    </div>
  );
}

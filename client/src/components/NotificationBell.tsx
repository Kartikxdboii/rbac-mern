import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck } from "lucide-react";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: notifications } = trpc.user.notifications.useQuery(
    { unreadOnly: false },
    { refetchInterval: 10000 }
  );

  const markReadMutation = trpc.user.markNotificationRead.useMutation({
    onSuccess: () => utils.user.notifications.invalidate(),
  });

  const markAllReadMutation = trpc.user.markAllNotificationsRead.useMutation({
    onSuccess: () => utils.user.notifications.invalidate(),
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border ${
                    notif.read ? "bg-background" : "bg-muted"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notif.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          markReadMutation.mutate({ notificationId: notif.id })
                        }
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No notifications
            </p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

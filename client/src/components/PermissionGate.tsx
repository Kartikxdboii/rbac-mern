import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
interface PermissionGateProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
  showTooltip?: boolean;
  tooltipText?: string;
}
export function PermissionGate({
  children,
  permission,
  fallback = null,
  showTooltip = false,
  tooltipText = "You don't have permission to perform this action",
}: PermissionGateProps) {
  const { hasPermission } = usePermissions();
  if (!hasPermission(permission)) {
    return fallback ? <>{fallback}</> : null;
  }
  return <>{children}</>;
}
interface PermissionGateWrapperProps {
  children: React.ReactNode;
  permission: string;
  disabled?: boolean;
  tooltipText?: string;
}
export function PermissionGateWrapper({
  children,
  permission,
  disabled = false,
  tooltipText = "You don't have permission to perform this action",
}: PermissionGateWrapperProps) {
  const { hasPermission } = usePermissions();
  const hasPermissionFlag = hasPermission(permission);
  const isDisabled = disabled || !hasPermissionFlag;
  if (!hasPermissionFlag) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block opacity-50 cursor-not-allowed">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  disabled: true,
                });
              }
              return child;
            })}
          </div>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    );
  }
  return <>{children}</>;
}


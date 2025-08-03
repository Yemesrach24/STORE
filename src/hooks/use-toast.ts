import { toast } from "sonner";

export const useToast = () => {
  return {
    toast: (message: string, options?: any) => toast(message, options),
    error: (message: string, options?: any) => toast.error(message, options),
    success: (message: string, options?: any) => toast.success(message, options),
    warning: (message: string, options?: any) => toast.warning(message, options),
    info: (message: string, options?: any) => toast.info(message, options),
  };
}; 
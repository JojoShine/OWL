import './styles.css';
import { ThemeProvider } from '@/components/layout/theme/theme-provider';
import { AuthProvider } from '@/lib/utils/auth';
import { OwlAppearanceProvider } from '@/components/layout/theme/appearance-provider';
import { ToastProvider } from '@/components/ui/toast';

export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <OwlAppearanceProvider>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </OwlAppearanceProvider>
    </ThemeProvider>
  );
}

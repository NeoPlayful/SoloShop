import { useTranslation } from "react-i18next";

interface LoadingStateProps {
  text?: string;
  fullScreen?: boolean;
}

export function LoadingState({ text, fullScreen = false }: LoadingStateProps) {
  const { t } = useTranslation();
  const label = text || t("loading");
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500" />
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  );

  if (fullScreen) {
    return <div className="flex min-h-screen items-center justify-center bg-page">{content}</div>;
  }

  return <div className="flex items-center justify-center py-12">{content}</div>;
}

export function PageLoading() {
  const { t } = useTranslation();
  return <LoadingState fullScreen text={t("pageLoading")} />;
}

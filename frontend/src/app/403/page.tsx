import ErrorPage from "@/components/ErrorPage";

export default function ForbiddenPage() {
  return (
    <ErrorPage
      code={403}
      icon="block"
      title="Ruxsat berilmagan"
      message="Sizda bu sahifa yoki amalni bajarish uchun huquq yo'q."
      actionHref="/dashboard"
      actionLabel="Asosiy panelga qaytish"
    />
  );
}

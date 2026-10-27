import ErrorPage from "@/components/ErrorPage";

export default function UnauthorizedPage() {
  return (
    <ErrorPage
      code={401}
      icon="lock"
      title="Avtorizatsiyadan o'tilmagan"
      message="Bu sahifani ko'rish uchun avval tizimga login va parol bilan kiring."
      actionHref="/login"
      actionLabel="Tizimga kirish"
    />
  );
}

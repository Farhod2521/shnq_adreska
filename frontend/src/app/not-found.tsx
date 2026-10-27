import ErrorPage from "@/components/ErrorPage";

export default function NotFound() {
  return (
    <ErrorPage
      code={404}
      icon="search_off"
      title="Sahifa topilmadi"
      message="Siz qidirayotgan sahifa mavjud emas yoki o'chirilgan."
      actionHref="/login"
      actionLabel="Bosh sahifaga"
    />
  );
}

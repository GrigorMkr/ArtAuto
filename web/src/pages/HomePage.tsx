import { Helmet } from "react-helmet-async";
import { useGetCatalogQuery } from "../store/apiSlice";
import { HomeHero } from "../components/home/HomeHero";
import { HomeProcess } from "../components/home/HomeProcess";
import { HomePreview } from "../components/home/HomePreview";

export function HomePage() {
  const { data } = useGetCatalogQuery({ limit: 6, offset: 0 });
  const preview = data?.items || [];

  return (
    <>
      <Helmet>
        <title>АртАвто — авто из Кореи и Китая под ключ</title>
        <meta
          name="description"
          content="Каталог автомобилей из Южной Кореи и Китая с прозрачным расчётом цены до вашего города."
        />
      </Helmet>
      <HomeHero />
      <HomeProcess />
      <HomePreview vehicles={preview} />
    </>
  );
}

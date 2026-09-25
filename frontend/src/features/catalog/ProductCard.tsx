import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Price } from "@/components/ui/price";
import type { ProductCard as ProductCardData } from "@/lib/api/types";
import { localized } from "@/lib/utils";

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("product");
  const name = localized(product.name, locale);
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-2">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        )}
        {product.hoverImageUrl && (
          <Image
            src={product.hoverImageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover opacity-0 transition duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute start-3 top-3 flex gap-1.5">
          {onSale && <span className="rounded-full bg-danger px-2.5 py-1 text-[11px] font-semibold text-white">{t("sale")}</span>}
          {!product.inStock && (
            <span className="rounded-full bg-fg/80 px-2.5 py-1 text-[11px] font-semibold text-bg">{t("soldOut")}</span>
          )}
        </div>
      </div>
      <div className="mt-3 space-y-1.5 px-0.5">
        <h3 className="line-clamp-1 text-sm font-medium text-fg">{name}</h3>
        <Price value={product.price} compareAt={product.compareAtPrice} className="text-sm" />
        {product.colorHexes.length > 0 && (
          <div className="flex gap-1.5 pt-0.5">
            {product.colorHexes.slice(0, 5).map((hex) => (
              <span key={hex} className="size-3.5 rounded-full border border-border" style={{ backgroundColor: hex }} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}

"use client";

import Image from "next/image";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { useCart } from "@/features/cart/cart-store";
import type { ProductDetail } from "@/lib/api/types";
import { cn, localized } from "@/lib/utils";

/**
 * Gallery + variant picker + add-to-bag. Picking a color swaps the gallery to that color's photos
 * (when tagged) and greys out sizes with no stock in that color.
 */
export function ProductPurchase({ product }: { product: ProductDetail }) {
  const t = useTranslations("product");
  const locale = useLocale();
  const add = useCart((s) => s.add);

  const firstAvailable = product.variants.find((v) => v.stock > 0);
  const [colorId, setColorId] = useState<number | null>(firstAvailable?.colorId ?? product.colors[0]?.id ?? null);
  const [sizeId, setSizeId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const images = useMemo(() => {
    // Photos tagged with the selected color first, then untagged ones; no tagged photos -> whole gallery.
    const forColor = product.images.filter((i) => i.colorId === colorId);
    if (forColor.length === 0) return product.images;
    return [...forColor, ...product.images.filter((i) => i.colorId === null)];
  }, [product.images, colorId]);

  const variant = product.variants.find((v) => v.colorId === colorId && v.sizeId === sizeId);
  const stockFor = (sid: number) => product.variants.find((v) => v.colorId === colorId && v.sizeId === sid)?.stock ?? 0;
  const color = product.colors.find((c) => c.id === colorId);
  const size = product.sizes.find((s) => s.id === sizeId);
  const price = variant?.price ?? product.basePrice;
  const name = localized(product.name, locale);

  const addToCart = () => {
    if (!variant || !color || !size) return;
    add({
      variantId: variant.id,
      productSlug: product.slug,
      name: product.name,
      imageUrl: images[0]?.url ?? null,
      colorName: color.name,
      colorHex: color.hexCode,
      sizeCode: size.code,
      unitPrice: variant.price,
      quantity,
      maxStock: variant.stock,
    });
    toast.success(t("added"), { description: `${name} · ${localized(color.name, locale)} · ${size.code}` });
  };

  return (
    <div className="grid gap-6 sm:gap-10 lg:grid-cols-2 lg:gap-14">
      {/* Gallery */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-col sm:gap-3 sm:overflow-visible sm:px-0">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActiveImage(i)}
              className={cn("relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition sm:w-20", i === activeImage ? "ring-primary" : "ring-transparent opacity-70 hover:opacity-100")}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
        <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-3xl bg-surface-2">
          {images[activeImage] && (
            <Image src={images[activeImage].url} alt={name} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-6 sm:space-y-7">
        <div className="space-y-3">
          <p className="text-sm text-muted">{localized(product.category.name, locale)}</p>
          <h1 className="heading-display text-3xl leading-tight text-primary sm:text-4xl">{name}</h1>
          <Price value={price} compareAt={product.compareAtPrice} className="text-xl" />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">
            {t("color")}: <span className="text-muted">{color ? localized(color.name, locale) : ""}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((c) => (
              <button
                key={c.id}
                type="button"
                title={localized(c.name, locale)}
                aria-pressed={c.id === colorId}
                onClick={() => {
                  setColorId(c.id);
                  setActiveImage(0);
                  if (sizeId && (product.variants.find((v) => v.colorId === c.id && v.sizeId === sizeId)?.stock ?? 0) === 0) setSizeId(null);
                }}
                className={cn("size-10 rounded-full border border-border ring-2 ring-offset-2 ring-offset-bg transition", c.id === colorId ? "ring-fg" : "ring-transparent hover:ring-border")}
                style={{ backgroundColor: c.hexCode }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">{t("size")}</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const stock = stockFor(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={stock === 0}
                  aria-pressed={s.id === sizeId}
                  onClick={() => {
                    setSizeId(s.id);
                    setQuantity(1);
                  }}
                  className={cn(
                    "h-11 min-w-14 rounded-full border px-4 text-sm font-medium transition",
                    s.id === sizeId ? "border-primary bg-primary text-primary-fg" : "border-border hover:border-fg",
                    stock === 0 && "cursor-not-allowed text-muted line-through opacity-50",
                  )}
                >
                  {s.code}
                </button>
              );
            })}
          </div>
          {variant && variant.stock > 0 && variant.stock <= 3 && (
            <p className="text-sm font-medium text-danger">{t("onlyLeft", { count: variant.stock })}</p>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex h-13 items-center rounded-full border border-border">
            <button type="button" className="grid size-12 place-items-center disabled:opacity-40" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)} aria-label="-">
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center font-medium tabular-nums">{quantity}</span>
            <button
              type="button"
              className="grid size-12 place-items-center disabled:opacity-40"
              disabled={!variant || quantity >= variant.stock}
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="+"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <Button size="lg" className="flex-1" disabled={!variant || variant.stock === 0} onClick={addToCart}>
            <ShoppingBag className="size-5" />
            {!sizeId ? t("selectOptions") : variant && variant.stock > 0 ? t("addToCart") : t("outOfStock")}
          </Button>
        </div>

        <div className="space-y-2 border-t border-border pt-6">
          <h2 className="font-semibold">{t("description")}</h2>
          <p className="whitespace-pre-line leading-relaxed text-muted">{localized(product.description, locale)}</p>
        </div>
      </div>
    </div>
  );
}

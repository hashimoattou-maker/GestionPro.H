import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Barcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { products, categories } from "@/lib/api";
import { useTranslation } from "@/i18n/LanguageContext";
import type { Product, Category } from "@/types";

const UNITS = ["Pièce", "Kg", "Litre", "Mètre", "Boîte", "Carton", "Palette", "Rouleau", "Set"];

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { t } = useTranslation();
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    reference: "",
    name: "",
    description: "",
    categoryId: "",
    barcode: "",
    purchasePrice: "0",
    sellingPrice: "0",
    wholesalePrice: "0",
    stock: "0",
    minStock: "0",
    unit: "Pièce",
    active: true,
  });

  useEffect(() => {
    categories.getCategories().then(setAllCategories).catch(() => {});
    if (isEdit && id) {
      products
        .getProduct(id)
        .then((product) => {
          setForm({
            reference: product.reference,
            name: product.name,
            description: product.description || "",
            categoryId: product.categoryId ? String(product.categoryId) : "",
            barcode: product.barcode || "",
            purchasePrice: String(product.purchasePrice),
            sellingPrice: String(product.sellingPrice),
            wholesalePrice: String(product.wholesalePrice),
            stock: String(product.stock),
            minStock: String(product.minStock),
            unit: product.unit,
            active: product.active,
          });
        })
        .catch(() => navigate("/stock/products"));
    }
  }, [id, isEdit, navigate]);

  const handleGenerateBarcode = async () => {
    try {
      const result = await products.generateBarcode();
      setForm((f) => ({ ...f, barcode: result.barcode }));
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data: Partial<Product> = {
        reference: form.reference,
        name: form.name,
        description: form.description,
        categoryId: form.categoryId ? String(form.categoryId) : undefined,
        barcode: form.barcode,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        wholesalePrice: Number(form.wholesalePrice),
        stock: Number(form.stock),
        minStock: Number(form.minStock),
        unit: form.unit,
        active: form.active,
      };
      if (isEdit && id) {
        await products.updateProduct(id, data);
      } else {
        await products.createProduct(data);
      }
      navigate("/stock/products");
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/stock/products")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">{isEdit ? t("common.edit") : t("products.new")}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("common.generalInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("common.reference")} *</Label>
                <Input
                  value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.name")} *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.description")}</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("products.category")}</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("products.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("products.barcode")}</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.barcode}
                    onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                  />
                  <Button type="button" variant="outline" onClick={handleGenerateBarcode}>
                    <Barcode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("common.unit")}</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
                />
                <Label>{t("products.activeProduct")}</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("products.priceAndStock")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("products.purchasePrice")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("products.sellingPrice")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("products.wholesalePrice")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.wholesalePrice}
                  onChange={(e) => setForm((f) => ({ ...f, wholesalePrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("products.currentStock")}</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("products.minStock")}</Label>
                <Input
                  type="number"
                  value={form.minStock}
                  onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/stock/products")}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}

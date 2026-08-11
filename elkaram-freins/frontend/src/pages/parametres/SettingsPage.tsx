import React, { useEffect, useRef, useState } from "react";
import { Save, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { settings as settingsApi } from "@/lib/api";
import { useTheme, THEMES } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n/LanguageContext";

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { appTheme, setAppTheme } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [logo, setLogo] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    fiscalId: "",
    ice: "",
    currency: "MAD",
    taxRate: "20",
    logoWidth: "200",
    logoHeight: "100",
  });

  useEffect(() => {
    settingsApi.getCompany()
      .then((company) => {
        setForm({
          name: company.name,
          address: company.address || "",
          phone: company.phone || "",
          email: company.email || "",
          website: company.website || "",
          fiscalId: company.fiscalId || "",
          ice: company.ice || "",
          currency: company.currency,
          taxRate: String(company.taxRate),
          logoWidth: String(company.logoWidth),
          logoHeight: String(company.logoHeight),
        });
        setLogo(company.logo || "");
      })
      .catch(() => { })
      .finally(() => setInitialLoading(false));
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus({ type: "error", msg: t("settings.selectImage") });
      return;
    }
    setUploading(true);
    setStatus(null);
    try {
      const result = await settingsApi.uploadLogo(file);
      setLogo(result.logoPath);
      setStatus({ type: "success", msg: t("settings.logoUpdated") });
    } catch (err: any) {
      console.error("Upload error:", err);
      const msg = err?.response?.data?.error || err?.message || t("settings.logoUploadError");
      setStatus({ type: "error", msg: `${t("common.error")}: ${msg}` });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      await settingsApi.updateCompany({
        name: form.name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        website: form.website,
        fiscalId: form.fiscalId,
        ice: form.ice,
        currency: form.currency,
        taxRate: Number(form.taxRate),
        logoWidth: Number(form.logoWidth),
        logoHeight: Number(form.logoHeight),
      });
      setStatus({ type: "success", msg: t("settings.saved") });
    } catch (err: any) {
      console.error("Save error:", err);
      const msg = err?.response?.data?.error || err?.message || t("settings.saveError");
      setStatus({ type: "error", msg: `${t("common.error")}: ${msg}` });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {status && (
        <div className={`p-3 rounded-md text-sm ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {status.msg}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.companyInfo")}</CardTitle>
              <CardDescription>
                {t("settings.companyInfoDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("common.companyName")} *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.address")}</Label>
                <Textarea
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.phone")}</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.email")}</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.website")}</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.nif")}</Label>
                <Input
                  value={form.fiscalId}
                  onChange={(e) => setForm((f) => ({ ...f, fiscalId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.ice")}</Label>
                <Input
                  value={form.ice}
                  onChange={(e) => setForm((f) => ({ ...f, ice: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.logoAndConfig")}</CardTitle>
                <CardDescription>
                  {t("settings.logoAndConfigDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>{t("settings.companyLogo")}</Label>
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                    {logo ? (
                      <img
                        src={logo}
                        alt="Logo"
                        style={{ width: Number(form.logoWidth), height: Number(form.logoHeight) }}
                        className="object-contain border rounded"
                      />
                    ) : (
                      <div className="flex items-center justify-center border rounded bg-white" style={{ width: Number(form.logoWidth), height: Number(form.logoHeight) }}>
                        <p className="text-xs text-muted-foreground">{t("settings.noLogo")}</p>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? "Upload..." : t("settings.chooseLogo")}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("settings.width")}</Label>
                    <Input
                      type="number"
                      min="50"
                      value={form.logoWidth}
                      onChange={(e) => setForm((f) => ({ ...f, logoWidth: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.height")}</Label>
                    <Input
                      type="number"
                      min="30"
                      value={form.logoHeight}
                      onChange={(e) => setForm((f) => ({ ...f, logoHeight: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("common.currency")}</Label>
                  <Input
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.taxRate")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.taxRate}
                    onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("settings.appTheme")}</CardTitle>
                <CardDescription>
                  {t("settings.appThemeDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {THEMES.map((themeItem) => (
                    <button
                      key={themeItem.value}
                      type="button"
                      onClick={() => setAppTheme(themeItem.value)}
                      className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: themeItem.color }} />
                      <span className="flex-1 text-left">{themeItem.label}</span>
                      {appTheme === themeItem.value && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Save, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { settings as settingsApi } from "@/lib/api";
import type { DocumentDesign } from "@/types";
import { useTranslation } from "@/i18n/LanguageContext";

const FONTS = ["Inter", "Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia"];

export default function DocumentDesignsPage() {
  const { t } = useTranslation();
  const [designs, setDesigns] = useState<DocumentDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<DocumentDesign | null>(null);
  const [form, setForm] = useState({
    name: "",
    primaryColor: "#1e40af",
    secondaryColor: "#f59e0b",
    fontFamily: "Inter",
    showLogo: true,
    showBorders: true,
    headerStyle: "modern" as "modern" | "classic" | "professional" | "minimal",
  });

  const fetchDesigns = () => {
    setLoading(true);
    settingsApi.getDesigns()
      .then(setDesigns)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({
      name: "",
      primaryColor: "#1e40af",
      secondaryColor: "#f59e0b",
      fontFamily: "Inter",
      showLogo: true,
      showBorders: true,
      headerStyle: "modern",
    });
    setDialogOpen(true);
  };

  const openEdit = (design: DocumentDesign) => {
    setEditItem(design);
    setForm({
      name: design.name,
      primaryColor: design.primaryColor,
      secondaryColor: design.secondaryColor,
      fontFamily: design.fontFamily,
      showLogo: design.showLogo,
      showBorders: design.showBorders,
      headerStyle: design.headerStyle,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        await settingsApi.updateDesign(editItem.id, form);
      } else {
        await settingsApi.createDesign(form);
      }
      setDialogOpen(false);
      fetchDesigns();
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await settingsApi.deleteDesign(deleteId);
      setDeleteId(null);
      fetchDesigns();
    } catch {
      // ignore
    }
  };

  const setAsDefault = async (id: number) => {
    try {
      await settingsApi.updateDesign(id, { isDefault: true });
      fetchDesigns();
    } catch {
      // ignore
    }
  };

  const getHeaderPreview = (style: string) => {
    switch (style) {
      case "modern": return t("settings.modernHeader");
      case "classic": return t("settings.classicHeader");
      case "professional": return t("settings.professionalHeader");
      case "minimal": return t("settings.minimalHeader");
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("settings.documentDesign")}</CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("settings.newTemplate")}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {designs.map((design) => (
              <Card key={design.id} className="relative overflow-hidden">
                <div
                  className="h-2"
                  style={{ background: `linear-gradient(90deg, ${design.primaryColor}, ${design.secondaryColor})` }}
                />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {design.name}
                    {design.isDefault && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: design.primaryColor }}
                    />
                    <span className="text-muted-foreground">{t("common.primary")}</span>
                    <div
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: design.secondaryColor }}
                    />
                    <span className="text-muted-foreground">{t("common.secondary")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("common.font")}: {design.fontFamily} | {getHeaderPreview(design.headerStyle)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{t("common.logo")}: {design.showLogo ? t("common.yes") : t("common.no")}</span>
                    <span>|</span>
                    <span>{t("common.borders")}: {design.showBorders ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-1 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(design)}>
                      <Edit className="h-4 w-4 mr-1" />
                      {t("common.edit")}
                    </Button>
                    {!design.isDefault && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setAsDefault(design.id)}>
                          <Star className="h-4 w-4 mr-1" />
                          {t("common.default")}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleteId(design.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {designs.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                {t("settings.noTemplatesCreated")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? t("settings.editTemplate") : t("settings.newTemplate")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("common.name")} *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("common.primaryColor")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={form.primaryColor}
                    onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("common.secondaryColor")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={form.secondaryColor}
                    onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={form.secondaryColor}
                    onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("common.font")}</Label>
              <Select value={form.fontFamily} onValueChange={(v) => setForm((f) => ({ ...f, fontFamily: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((font) => (
                    <SelectItem key={font} value={font}>{font}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("settings.headerStyle")}</Label>
              <Select value={form.headerStyle} onValueChange={(v) => setForm((f) => ({ ...f, headerStyle: v as "modern" | "classic" | "professional" | "minimal" }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">{t("settings.modern")}</SelectItem>
                  <SelectItem value="classic">{t("settings.classic")}</SelectItem>
                  <SelectItem value="professional">{t("settings.professional")}</SelectItem>
                  <SelectItem value="minimal">{t("settings.minimal")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.showLogo} onCheckedChange={(v) => setForm((f) => ({ ...f, showLogo: v }))} />
              <Label>{t("settings.showLogo")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.showBorders} onCheckedChange={(v) => setForm((f) => ({ ...f, showBorders: v }))} />
              <Label>{t("settings.showBorders")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("settings.confirmDeleteTemplate")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

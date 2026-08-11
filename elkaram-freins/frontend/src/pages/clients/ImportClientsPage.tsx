import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clients as clientsApi } from "@/lib/api";
import * as XLSX from "xlsx";
import { useTranslation } from "@/i18n/LanguageContext";

interface ImportRow {
  code?: string;
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  _rawKeys?: string;
}

export default function ImportClientsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false });
        const mapped = raw.map((row) => ({
          code: row.code || row.Code || row.CODE || "",
          name: row.name || row.Name || row.Nom || row.nom || "",
          company: row.company || row.Company || row.Société || row.societe || row["Societe"] || "",
          phone: row.phone || row.Phone || row.Téléphone || row.telephone || row.Tel || "",
          _rawKeys: Object.keys(row).join(", "),
        }));
        setPreview(mapped.slice(0, 10));
      } catch {
        setError(t("common.fileReadError"));
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError("");
    try {
      const res = await clientsApi.importExcel(file);
      setResult(res);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Erreur lors de l'importation";
      setError(msg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">{t("pageTitle.importClients")}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t("common.excelFile")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              {file ? file.name : t("common.clickToSelectExcel")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("common.acceptedFormats")}
            </p>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {preview.length > 0 && (
            <>
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                {t("common.detectedColumns")}: {preview[0]._rawKeys}
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">{t("common.preview")} ({preview.length} {t("common.firstRows")})</h3>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-3 py-2 text-left">{t("common.code")}</th>
                        <th className="px-3 py-2 text-left">{t("common.name")}</th>
                        <th className="px-3 py-2 text-left">{t("common.company")}</th>
                        <th className="px-3 py-2 text-left">{t("common.phone")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">{row.code || "-"}</td>
                          <td className="px-3 py-2">{row.name || row.company || "-"}</td>
                          <td className="px-3 py-2">{row.company || "-"}</td>
                          <td className="px-3 py-2">{row.phone || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {importing ? t("common.importing") : t("common.import")}
              </Button>
            </>
          )}

          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{t("common.importComplete")}</span>
              </div>
              <div className="text-sm space-y-1">
                <p>{t("common.imported")}: {result.imported}</p>
                <p>{t("common.skipped")}: {result.errors}</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/clients")}>
                {t("clients.viewClientsList")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

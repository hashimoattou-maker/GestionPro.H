import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stock as stockApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";
import type { StockMovement } from "@/types";

export default function StockMovementsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (search) params.search = search;
      if (typeFilter !== "all") params.type = typeFilter;
      const result = await stockApi.getMovements(params);
      setMovements(result.data);
      setTotalPages(result.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleExport = () => {
    stockApi.getStockReport().then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rapport_stock.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    }).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">{t("stock.title")}</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("stock.movementsHistory")}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              {t("common.report")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search") + "..."}
                className="pl-8"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t("common.type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="entrée">{t("stock.entry")}</SelectItem>
                <SelectItem value="sortie">{t("stock.exit")}</SelectItem>
                <SelectItem value="ajustement">{t("stock.adjustment")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead>{t("stock.product")}</TableHead>
                  <TableHead>{t("common.reference")}</TableHead>
                  <TableHead>{t("common.type")}</TableHead>
                  <TableHead>{t("common.quantity")}</TableHead>
                  <TableHead>{t("stock.stockBefore")}</TableHead>
                  <TableHead>{t("stock.stockAfter")}</TableHead>
                  <TableHead>{t("stock.reason")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t("stock.noMovements")}
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>{formatDate(mov.createdAt)}</TableCell>
                      <TableCell>{mov.productName || "-"}</TableCell>
                      <TableCell>{mov.productReference || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            mov.type === "entrée"
                              ? "success"
                              : mov.type === "sortie"
                              ? "destructive"
                              : "warning"
                          }
                        >
                          {mov.type === "entrée"
                            ? t("stock.entry")
                            : mov.type === "sortie"
                            ? t("stock.exit")
                            : t("stock.adjustment")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{mov.quantity}</TableCell>
                      <TableCell>{mov.beforeStock}</TableCell>
                      <TableCell>{mov.afterStock}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{mov.reason || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {t("common.previous")}
              </Button>
              <span className="text-sm text-muted-foreground">{t("common.pageOf", { page, totalPages })}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {t("common.next")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

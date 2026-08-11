import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Eye, Edit, Trash2, CheckCircle, RefreshCw, FileDown } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { documents as documentsApi } from "@/lib/api";
import { formatCurrency, formatDate, getStatusBadge, getDocTypeLabel } from "@/lib/utils";
import type { Document, DocumentType } from "@/types";
import { useTranslation } from "@/i18n/LanguageContext";

const DOC_TYPE_MAP: Record<string, DocumentType> = {
  "/achats/bc": "bon_commande",
  "/achats/ba": "bon_achat",
  "/achats/factures": "facture_achat",
  "/achats/avoirs": "avoir_achat",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  bon_commande: "Nouveau Bon de Commande",
  bon_achat: "Nouveau Bon d'Arrivage",
  facture_achat: "Nouvelle Facture Achat",
  avoir_achat: "Nouvel Avoir Achat",
};

export default function PurchaseDocumentListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname;
  const docType = DOC_TYPE_MAP[basePath];
  const { t } = useTranslation();

  const [docList, setDocList] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    if (!docType) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { docType, page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      const result = await documentsApi.getDocuments(params);
      setDocList(result.data);
      setTotalPages(result.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [docType, page, search, statusFilter]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleValidate = async (id: string) => {
    try {
      await documentsApi.validateDocument(id);
      fetchDocs();
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await documentsApi.deleteDocument(deleteId);
      fetchDocs();
    } catch {
      // ignore
    }
    setDeleteId(null);
  };

  const handleConvert = async (doc: Document) => {
    try {
      const targetTypeMap: Record<string, DocumentType> = {
        bon_commande: "bon_achat",
        bon_achat: "facture_achat",
        facture_achat: "avoir_achat",
      };
      const targetType = targetTypeMap[doc.docType];
      if (!targetType) return;
      const newDoc = await documentsApi.convertDocument(doc.id, targetType);
      navigate(`${basePath}/${newDoc.id}/edit`);
    } catch {
      // ignore
    }
  };

  const handleView = (id: string) => {
    navigate(`${basePath}/${id}`);
  };

  const DOC_TYPE_KEYS = {
    bon_commande: "doc.newBonCommande" as const,
    bon_achat: "doc.newBonArrivage" as const,
    facture_achat: "doc.newFactureAchat" as const,
    avoir_achat: "doc.newAvoirAchat" as const,
  };

  function getPaymentStatus(doc: Document) {
    const paid = doc.paidAmount || 0;
    const total = doc.total || 0;
    if (paid <= 0) return t("payment.unpaid");
    if (paid >= total - 0.01) return t("payment.paid");
    return t("payment.partial");
  }

  function getPaymentStatusKey(doc: Document) {
    const paid = doc.paidAmount || 0;
    const total = doc.total || 0;
    if (paid <= 0) return "unpaid";
    if (paid >= total - 0.01) return "paid";
    return "partial";
  }

  function getPaymentStatusStyle(doc: Document) {
    const statusKey = getPaymentStatusKey(doc);
    if (statusKey === "paid") return "bg-green-100 text-green-700 border border-green-300";
    if (statusKey === "partial") return "bg-yellow-100 text-yellow-700 border border-yellow-300";
    return "bg-red-100 text-red-700 border border-red-300";
  }

  if (!docType) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{getDocTypeLabel(docType)}</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => navigate(`${basePath}/new`)}>
              <Plus className="mr-2 h-4 w-4" />
              {t(DOC_TYPE_KEYS[docType as keyof typeof DOC_TYPE_KEYS])}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Input
                placeholder={t("common.search")}
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="brouillon">{t("filter.brouillon")}</SelectItem>
                <SelectItem value="confirmé">{t("filter.confirmed")}</SelectItem>
                <SelectItem value="annule">{t("filter.cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Document</TableHead>
                  <TableHead>{t("suppliers.supplier")}</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("payment.modePayment")}</TableHead>
                  <TableHead>{t("common.total")}</TableHead>
                  <TableHead>{t("payment.totalPaid")}</TableHead>
                  <TableHead>{t("payment.remainingAmount")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : docList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {t("common.noResults")}
                    </TableCell>
                  </TableRow>
                ) : (
                  docList.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.docNumber}</TableCell>
                      <TableCell>{doc.supplier?.name || "-"}</TableCell>
                      <TableCell>{formatDate(doc.date)}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getPaymentStatusStyle(doc)}`}>
                          {getPaymentStatus(doc)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{doc.lastPaymentMethod || "-"}</TableCell>
                      <TableCell>{formatCurrency(doc.total)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(doc.paidAmount || 0)}</TableCell>
                      <TableCell className={doc.total - (doc.paidAmount || 0) > 0 ? "text-red-600 font-medium" : ""}>
                        {formatCurrency(Math.max(0, doc.total - (doc.paidAmount || 0)))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`${basePath}/${doc.id}`)} title={t("common.view")}>
                            <Eye className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleView(doc.id)} title={t("common.pdf")}>
                            <FileDown className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`${basePath}/${doc.id}/edit`)} title={t("common.edit")}>
                            <Edit className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleteId(doc.id)} title={t("common.delete")}>
                            <Trash2 className="h-5 w-5" />
                          </Button>
                          {doc.status === "brouillon" && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:text-green-700" onClick={() => handleValidate(doc.id)} title={t("common.validate")}>
                              <CheckCircle className="h-5 w-5" />
                            </Button>
                          )}
                          {doc.status === "confirmé" && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleConvert(doc)} title={t("common.convert")}>
                              <RefreshCw className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("common.confirmDeleteDoc")}
            </AlertDialogDescription>
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

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Building2, CreditCard, FileText, Wallet, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { clients as clientsApi, documents as documentsApi } from "@/lib/api";
import { formatCurrency, formatDate, getStatusBadge, getDocTypeLabel } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";
import type { Client, Document } from "@/types";

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [client, setClient] = useState<Client | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDoc, setPaymentDoc] = useState<Document | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("espece");
  const [paymentRef, setPaymentRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      clientsApi.getClient(id),
      documentsApi.getDocuments({ clientId: id, limit: 50 }),
    ])
      .then(([c, docs]) => {
        setClient(c);
        setDocuments(docs.data);
      })
      .catch(() => navigate("/clients"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const totalDue = documents
    .filter((d) => d.status !== "brouillon" && d.docType !== "avoir_vente" && d.docType !== "avoir_achat")
    .reduce((s, d) => s + d.total, 0);

  const totalPaid = documents
    .filter((d) => d.status !== "brouillon")
    .reduce((s, d) => s + (d.paidAmount || 0), 0);

  const restantDu = totalDue - totalPaid;

  const handlePayment = async () => {
    if (!paymentDoc || !paymentAmount) return;
    setSubmitting(true);
    try {
      await documentsApi.recordPayment(paymentDoc.id, {
        amount: Number(paymentAmount),
        paymentMethod: paymentMethod,
        paymentDate: new Date().toISOString(),
        note: paymentRef || undefined,
      });
      setPaymentDoc(null);
      setPaymentAmount("");
      setPaymentRef("");
      fetchData();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const openPayment = (doc: Document) => {
    setPaymentDoc(doc);
    setPaymentAmount(String(doc.total - (doc.paidAmount || 0)));
    setPaymentMethod("espece");
    setPaymentRef("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{client.name}</h2>
          <p className="text-muted-foreground">{t("common.code")}: {client.code}</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" onClick={() => navigate(`/clients/${id}/edit`)}>
            {t("common.edit")}
          </Button>
        </div>
      </div>

      {/* Situation Client */}
      <Card className="border-l-4" style={{ borderLeftColor: restantDu > 0 ? "#dc2626" : "#16a34a" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t("clients.situation")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("clients.totalDocuments")}</p>
              <p className="text-2xl font-bold">{formatCurrency(totalDue)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("clients.totalPaid")}</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("clients.remainingBalance")}</p>
              <p className={`text-2xl font-bold ${restantDu > 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(restantDu)}
              </p>
            </div>
          </div>
          {totalDue > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm mb-1">
                <span className="text-muted-foreground">{t("clients.paymentProgress")}</span>
                <span className="font-medium">{Math.round((totalPaid / totalDue) * 100)}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((totalPaid / totalDue) * 100, 100)}%`,
                    backgroundColor: restantDu > 0 ? "#dc2626" : "#16a34a",
                  }}
                />
              </div>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            {restantDu <= 0 ? (
              <Badge className="bg-green-600 text-white flex items-center gap-1 text-sm px-3 py-1">
                <CheckCircle className="h-4 w-4" /> {t("clients.accountSettled")}
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1 text-sm px-3 py-1">
                <XCircle className="h-4 w-4" /> {t("clients.unpaidBalance")} {formatCurrency(restantDu)}
              </Badge>
            )}
            {client.balance > 0 && (
              <span className="text-sm text-muted-foreground">
                ({t("clients.accountingBalance")}: {formatCurrency(client.balance)})
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t("common.company")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{client.company || "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t("clients.accountingBalance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold ${client.balance > 0 ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(client.balance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("clients.documents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{documents.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("clients.contactInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone || t("common.notProvided")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{client.email || t("common.notProvided")}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{client.address || t("common.notProvided")}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("common.fiscalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("common.taxId")}</span>
              <span className="font-medium">{client.fiscalId || "-"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("common.commercialId")}</span>
              <span className="font-medium">{client.commercialId || "-"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("common.articleId")}</span>
              <span className="font-medium">{client.articleId || "-"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("common.creditLimit")}</span>
              <span className="font-medium">{formatCurrency(client.creditLimit)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("clients.documentHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.documentNumber")}</TableHead>
                  <TableHead>{t("common.type")}</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead>{t("common.total")}</TableHead>
                  <TableHead>{t("common.paid")}</TableHead>
                  <TableHead>{t("common.remaining")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t("clients.noDocuments")}
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => {
                    const restant = doc.total - (doc.paidAmount || 0);
                    const isUnpaid = doc.status !== "brouillon" && restant > 0;
                    return (
                      <TableRow key={doc.id} className={isUnpaid ? "bg-red-50 dark:bg-red-950/20" : ""}>
                        <TableCell className="font-medium">{doc.docNumber}</TableCell>
                        <TableCell>{getDocTypeLabel(doc.docType)}</TableCell>
                        <TableCell>{formatDate(doc.date)}</TableCell>
                        <TableCell>{formatCurrency(doc.total)}</TableCell>
                        <TableCell className="text-green-600 font-medium">{formatCurrency(doc.paidAmount || 0)}</TableCell>
                        <TableCell className={restant > 0 ? "text-red-600 font-medium" : "font-medium"}>
                          {formatCurrency(restant)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(doc.status) as "default" | "secondary" | "destructive" | "outline" | "success" | "warning"}>
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const base = doc.docType.includes("achat") ? "/achats" : "/ventes";
                                const paths: Record<string, string> = {
                                  devis: "devis", commande_client: "commandes", bon_livraison: "bl",
                                  facture_vente: "factures", avoir_vente: "avoirs",
                                  bon_commande: "bc", bon_achat: "ba", facture_achat: "factures", avoir_achat: "avoirs",
                                };
                                navigate(`${base}/${paths[doc.docType] || doc.docType}/${doc.id}`);
                              }}
                            >
                              {t("common.view")}
                            </Button>
                            {isUnpaid && (
                              <Button variant="outline" size="sm" className="text-green-600" onClick={() => openPayment(doc)}>
                                <DollarSign className="h-3 w-3 mr-1" /> {t("common.pay")}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!paymentDoc} onOpenChange={() => setPaymentDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              {t("clients.recordPayment")}
            </DialogTitle>
          </DialogHeader>
          {paymentDoc && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex justify-between">
                  <span>{t("common.document")}:</span>
                  <span className="font-medium">{paymentDoc.docNumber}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>{t("common.total")}:</span>
                  <span className="font-medium">{formatCurrency(paymentDoc.total)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>{t("common.paid")}:</span>
                  <span className="font-medium text-green-600">{formatCurrency(paymentDoc.paidAmount || 0)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span>{t("common.remainingToPay")}:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(paymentDoc.total - (paymentDoc.paidAmount || 0))}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("common.paymentAmount")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.paymentMethod")}</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="espece">{t("common.cash")}</SelectItem>
                    <SelectItem value="cheque">{t("common.check")}</SelectItem>
                    <SelectItem value="virement">{t("common.bankTransfer")}</SelectItem>
                    <SelectItem value="carte">{t("common.bankCard")}</SelectItem>
                    <SelectItem value="traite">{t("common.billOfExchange")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("common.referenceOptional")}</Label>
                <Input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder={t("common.checkNumberPlaceholder")}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDoc(null)}>
              {t("common.cancel")}
            </Button>
            <Button className="bg-green-600" onClick={handlePayment} disabled={submitting || !paymentAmount || Number(paymentAmount) <= 0}>
              {submitting ? t("common.saving") : t("common.confirmPayment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

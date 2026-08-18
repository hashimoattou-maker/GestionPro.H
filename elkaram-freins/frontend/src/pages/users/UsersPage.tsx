import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Save, UserCog, History } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { users as usersApi } from "@/lib/api";
import { useTranslation } from "@/i18n/LanguageContext";
import type { User } from "@/types";

interface LoginRecord {
  id: number;
  user_id: string;
  username: string;
  fullName: string;
  action: string;
  details: string;
  created_at: string;
}

export default function UsersPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"users" | "logins">("users");
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
    role: "user" as "admin" | "manager" | "user",
    active: true,
  });

  const [logins, setLogins] = useState<LoginRecord[]>([]);
  const [loginsLoading, setLoginsLoading] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    usersApi.getUsers()
      .then(setUserList)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchLogins = () => {
    setLoginsLoading(true);
    usersApi.getLogins(100)
      .then(setLogins)
      .catch(() => {})
      .finally(() => setLoginsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "logins") fetchLogins();
  }, [activeTab]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ username: "", email: "", fullName: "", password: "", role: "user", active: true });
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditItem(user);
    setForm({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      password: "",
      role: user.role,
      active: user.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data: Partial<User> & { password?: string } = {
        username: form.username,
        email: form.email,
        fullName: form.fullName,
        role: form.role,
        active: form.active,
      };
      if (form.password) data.password = form.password;
      if (editItem) {
        await usersApi.updateUser(editItem.id, data);
      } else {
        await usersApi.createUser(data);
      }
      setDialogOpen(false);
      fetchUsers();
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await usersApi.deleteUser(deleteId);
      setDeleteId(null);
      fetchUsers();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={activeTab === "users" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("users")}
        >
          <UserCog className="mr-2 h-4 w-4" />
          {t("users.title")}
        </Button>
        <Button
          variant={activeTab === "logins" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("logins")}
        >
          <History className="mr-2 h-4 w-4" />
          Historique des connexions
        </Button>
      </div>

      {activeTab === "users" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              {t("users.title")}
            </CardTitle>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("users.new")}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("users.username")}</TableHead>
                    <TableHead>{t("users.fullName")}</TableHead>
                    <TableHead>{t("common.email")}</TableHead>
                    <TableHead>{t("users.role")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : userList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t("users.noUsers")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    userList.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : user.role === "manager" ? "secondary" : "outline"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            user.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {user.active ? t("common.active") : t("common.inactive")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setDeleteId(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "logins" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des connexions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Nom complet</TableHead>
                    <TableHead>Détails</TableHead>
                    <TableHead>Date et heure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : logins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Aucune connexion enregistrée
                      </TableCell>
                    </TableRow>
                  ) : (
                    logins.map((login) => (
                      <TableRow key={login.id}>
                        <TableCell className="font-medium">{login.username || "—"}</TableCell>
                        <TableCell>{login.fullName || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{login.details}</Badge>
                        </TableCell>
                        <TableCell>{new Date(login.created_at).toLocaleString("fr-FR")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? t("common.edit") : t("users.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("users.username")} *</Label>
              <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("users.fullName")} *</Label>
              <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("common.email")} *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("users.password")} {editItem ? `(${t("users.leaveEmptyToKeep")})` : "*"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("users.role")}</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as "admin" | "manager" | "user" }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t("users.admin")}</SelectItem>
                  <SelectItem value="manager">{t("users.manager")}</SelectItem>
                  <SelectItem value="user">{t("users.user")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
              <Label>{t("users.activeAccount")}</Label>
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
            <AlertDialogDescription>{t("users.deleteConfirmation")}</AlertDialogDescription>
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

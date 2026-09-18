import { useState, useEffect, useMemo } from "react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Search,
  Plus,
  Filter,
  Scissors,
  MapPin,
  Phone,
  Trash2,
  Edit2,
  ArrowUpDown,
  MoreVertical,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
export default function Costureiras() {
  const { user } = useAuth();
  const [costureiras, setCostureiras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmNome, setDeleteConfirmNome] = useState("");
  /*  Table State */ const [sortField, setSortField] = useState("nome");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    especialidade: "",
    endereco: "",
    observacoes: "",
    status: "ativo",
  });
  const fetchCostureiras = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "prod_costureiras"),
        where("userId", "==", user.uid),
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCostureiras(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "prod_costureiras");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCostureiras();
  }, [user]);
  const handleSave = async () => {
    if (!user) return;
    if (!formData.nome || !formData.telefone) {
      toast.error("Preencha os campos obrigatórios (Nome e Telefone)");
      return;
    }
    try {
      const costureiraData: any = {
        ...formData,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      };
      if (editingId) {
        await updateDoc(doc(db, "prod_costureiras", editingId), costureiraData);
        toast.success("Costureira atualizada!");
      } else {
        const newId = doc(collection(db, "prod_costureiras")).id;
        await setDoc(doc(db, "prod_costureiras", newId), {
          id: newId,
          ...costureiraData,
          createdAt: serverTimestamp(),
        });
        toast.success("Costureira cadastrada!");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchCostureiras();
    } catch (error) {
      toast.error("Erro ao salvar");
      handleFirestoreError(error, OperationType.WRITE, "prod_costureiras");
    }
  };
  const handleDelete = async (id: string, nome: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmNome(nome);
  };
  const confirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await deleteDoc(doc(db, "prod_costureiras", deleteConfirmId));
        toast.success("Costureira excluída");
        fetchCostureiras();
      } catch (error) {
        toast.error("Erro ao excluir");
        handleFirestoreError(
          error,
          OperationType.DELETE,
          `prod_costureiras/${deleteConfirmId}`,
        );
      } finally {
        setDeleteConfirmId(null);
        setDeleteConfirmNome("");
      }
    }
  };
  const openEdit = (c: any) => {
    setEditingId(c.id);
    setFormData({
      nome: c.nome,
      telefone: c.telefone,
      especialidade: c.especialidade || "",
      endereco: c.endereco || "",
      observacoes: c.observacoes || "",
      status: c.status || "ativo",
    });
    setIsDialogOpen(true);
  };
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nome: "",
      telefone: "",
      especialidade: "",
      endereco: "",
      observacoes: "",
      status: "ativo",
    });
  };
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };
  const filteredAndSortedCostureiras = useMemo(() => {
    let result = costureiras.filter(
      (c) =>
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        (c.especialidade &&
          c.especialidade.toLowerCase().includes(search.toLowerCase())),
    );
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return 0; /* fallback */
    });
    return result;
  }, [costureiras, search, sortField, sortOrder]);
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full max-w-none mx-auto p-4 md:p-8 pb-10">
      {" "}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {" "}
        <div>
          {" "}
          <h2 className="text-[28px] font-semibold tracking-tight text-foreground">
            Equipe de Costura
          </h2>{" "}
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Gerencie costureiras e parceiros de confecção.
          </p>{" "}
        </div>{" "}
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all outline-none rounded-xl px-6 h-11 font-bold border-none shrink-0"
        >
          {" "}
          <Plus size={18} className="mr-2" strokeWidth={3} /> Nova
          Costureira{" "}
        </Button>{" "}
      </div>{" "}
      <Card className="glass-card rounded-[24px] border border-border/50 shadow-sm overflow-hidden flex flex-col">
        {" "}
        <CardHeader className="bg-muted pb-4 pt-6 px-6 border-b border-border/50 shrink-0">
          {" "}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {" "}
            <div className="relative group w-full md:w-96">
              {" "}
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
                size={18}
              />{" "}
              <input
                type="text"
                placeholder="Pesquisar por nome ou especialidade..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-border focus:border-primary rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />{" "}
            </div>{" "}
            <div className="flex items-center gap-2">
              {" "}
              <Button
                variant="outline"
                className="rounded-xl font-bold bg-background border-border text-foreground"
              >
                {" "}
                <Filter size={16} className="mr-2" /> Filtros{" "}
              </Button>{" "}
            </div>{" "}
          </div>{" "}
        </CardHeader>{" "}
        <CardContent className="p-0 flex-1 overflow-x-auto hide-scrollbar">
          {" "}
          {loading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse font-bold">
              Carregando equipe...
            </div>
          ) : filteredAndSortedCostureiras.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center bg-background">
              {" "}
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                {" "}
                <Users size={32} className="text-muted-foreground" />{" "}
              </div>{" "}
              <h3 className="text-lg font-bold text-foreground">
                Nenhuma costureira encontrada
              </h3>{" "}
              <p className="text-sm text-muted-foreground mt-1">
                Ajuste a pesquisa ou cadastre uma nova.
              </p>{" "}
            </div>
          ) : (
            <table className="w-full text-sm text-left">
<thead className="bg-muted text-muted-foreground font-bold text-[11px] uppercase tracking-wider sticky top-0 z-10 border-b border-border/50 shadow-sm">
<tr>
<th
                    className="px-6 py-4 cursor-pointer hover:bg-background/50 transition-colors"
                    onClick={() => handleSort("nome")}
                  >
                    
                    <div className="flex items-center gap-2">
                      Nome <ArrowUpDown size={12} />
                    </div>
                  </th>
<th
                    className="px-6 py-4 cursor-pointer hover:bg-background/50 transition-colors"
                    onClick={() => handleSort("especialidade")}
                  >
                    
                    <div className="flex items-center gap-2">
                      Especialidade <ArrowUpDown size={12} />
                    </div>
                  </th>
<th className="px-6 py-4">Localização</th>
<th className="px-6 py-4">Telefone</th>
<th
                    className="px-6 py-4 text-center cursor-pointer hover:bg-background/50 transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    
                    <div className="flex items-center justify-center gap-2">
                      Status <ArrowUpDown size={12} />
                    </div>
                  </th>
<th className="px-6 py-4 text-right">Ações</th>
</tr>
</thead>
<tbody className="divide-y divide-border/50">
                
                <AnimatePresence>
                  
                  {filteredAndSortedCostureiras.map((c) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => openEdit(c)}
                    >
<td className="px-6 py-4">
                        
                        <div className="flex items-center gap-3">
                          
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black text-lg flex items-center justify-center shrink-0">
                            
                            {c.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-foreground">
                            {c.nome}
                          </span>
                        </div>
                      </td>
<td className="px-6 py-4">
                        
                        <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                          
                          <Scissors
                            size={14}
                            className="text-muted-foreground/70"
                          />
                          {c.especialidade || "-"}
                        </div>
                      </td>
<td className="px-6 py-4">
                        
                        <div className="flex items-center gap-2 text-muted-foreground font-medium">
                          
                          <MapPin
                            size={14}
                            className="text-muted-foreground/70"
                          />
                          <span
                            className="truncate max-w-[200px]"
                            title={c.endereco}
                          >
                            {c.endereco || "-"}
                          </span>
                        </div>
                      </td>
<td className="px-6 py-4">
                        
                        <div className="flex items-center gap-2 font-mono text-xs font-bold text-muted-foreground">
                          
                          <Phone
                            size={14}
                            className="text-muted-foreground/70"
                          />
                          {c.telefone || "-"}
                        </div>
                      </td>
<td className="px-6 py-4 text-center">
                        
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex ${c.status === "ativo" ? "bg-success/10 text-success dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground border border-border/50"}`}
                        >
                          
                          {c.status === "ativo" ? "Ativa" : "Inativa"}
                        </span>
                      </td>
<td className="px-6 py-4 text-right">
                        
                        <DropdownMenu>
                          
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical size={16} />
                              </Button>
                            }
                          />
                          <DropdownMenuContent
                            align="end"
                            className="w-[160px] rounded-xl border-border"
                          >
                            
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(c);
                              }}
                              className="hover:bg-muted font-semibold cursor-pointer"
                            >
                              
                              <Edit2 size={14} className="mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(c.id, c.nome);
                              }}
                              className="hover:bg-destructive/10 text-destructive focus:text-destructive font-semibold cursor-pointer"
                            >
                              
                              <Trash2 size={14} className="mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
</motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
</table>
          )}{" "}
        </CardContent>{" "}
      </Card>{" "}
      {/* Modal */}{" "}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {" "}
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 glass-card border border-border shadow-2xl overflow-hidden">
          {" "}
          <div className="bg-muted px-8 pt-6 pb-4 border-b border-border/50">
            {" "}
            <DialogTitle className="text-2xl font-black text-foreground tracking-tight">
              {editingId ? "Editar Costureira" : "Nova Costureira"}
            </DialogTitle>{" "}
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Detalhes do profissional de confecção.
            </p>{" "}
          </div>{" "}
          <div className="grid gap-5 px-8 py-6">
            {" "}
            <div className="space-y-2">
              {" "}
              <Label className="font-bold text-muted-foreground text-xs uppercase tracking-wider ml-1">
                Nome *
              </Label>{" "}
              <Input
                placeholder="Nome completo"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                className="rounded-2xl h-12 bg-background border-border/50 focus:border-primary transition-all shadow-sm font-medium"
              />{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label className="font-bold text-muted-foreground text-xs uppercase tracking-wider ml-1">
                Telefone *
              </Label>{" "}
              <Input
                placeholder="(11) 99999-9999"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                className="rounded-2xl h-12 bg-background border-border/50 focus:border-primary transition-all shadow-sm font-medium"
              />{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label className="font-bold text-muted-foreground text-xs uppercase tracking-wider ml-1">
                Especialidade
              </Label>{" "}
              <Input
                placeholder="Ex: Moda Praia, Fitness"
                value={formData.especialidade}
                onChange={(e) =>
                  setFormData({ ...formData, especialidade: e.target.value })
                }
                className="rounded-2xl h-12 bg-background border-border/50 focus:border-primary transition-all shadow-sm font-medium"
              />{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label className="font-bold text-muted-foreground text-xs uppercase tracking-wider ml-1">
                Endereço / Cidade
              </Label>{" "}
              <Input
                placeholder="Ex: São Paulo, SP"
                value={formData.endereco}
                onChange={(e) =>
                  setFormData({ ...formData, endereco: e.target.value })
                }
                className="rounded-2xl h-12 bg-background border-border/50 focus:border-primary transition-all shadow-sm font-medium"
              />{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label className="font-bold text-muted-foreground text-xs uppercase tracking-wider ml-1">
                Status
              </Label>{" "}
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData({ ...formData, status: val })
                }
              >
                {" "}
                <SelectTrigger className="rounded-2xl h-12 bg-background border-border/50 shadow-sm font-medium px-4">
                  {" "}
                  <SelectValue placeholder="Selecione..." />{" "}
                </SelectTrigger>{" "}
                <SelectContent className="rounded-2xl border-border">
                  {" "}
                  <SelectItem
                    value="ativo"
                    className="rounded-xl py-2 cursor-pointer focus:bg-muted font-bold"
                  >
                    Ativa
                  </SelectItem>{" "}
                  <SelectItem
                    value="inativo"
                    className="rounded-xl py-2 cursor-pointer focus:bg-destructive/10 text-destructive focus:text-destructive font-bold"
                  >
                    Inativa
                  </SelectItem>{" "}
                </SelectContent>{" "}
              </Select>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex justify-end gap-3 px-8 py-5 border-t border-border bg-muted/30">
            {" "}
            <Button
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-xl font-bold hover:bg-background h-11 px-6 border border-transparent"
            >
              Cancelar
            </Button>{" "}
            <Button
              onClick={handleSave}
              className="premium-btn-primary bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 font-bold px-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all border-none"
            >
              {" "}
              {editingId ? "Atualizar Costureira" : "Salvar Costureira"}{" "}
            </Button>{" "}
          </div>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        {" "}
        <DialogContent className="max-w-sm rounded-[2.5rem] p-8 border border-border shadow-2xl text-center">
          {" "}
          <div className="w-20 h-20 bg-destructive/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-destructive/20 shadow-inner">
            {" "}
            <Trash2
              size={32}
              className="text-destructive"
              strokeWidth={1.5}
            />{" "}
          </div>{" "}
          <DialogTitle className="text-2xl font-black mb-2 text-foreground">
            Excluir Costureira?
          </DialogTitle>{" "}
          <p className="text-muted-foreground text-sm mb-8 font-medium">
            Deseja realmente remover {deleteConfirmNome} da sua equipe?
          </p>{" "}
          <DialogFooter className="flex gap-3 sm:justify-center w-full">
            {" "}
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-2xl flex-1 h-12 font-bold border-border bg-background"
            >
              Cancelar
            </Button>{" "}
            <Button
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-2xl flex-1 h-12 font-bold shadow-lg shadow-destructive/20 border-none"
            >
              Sim, Excluir
            </Button>{" "}
          </DialogFooter>{" "}
        </DialogContent>{" "}
      </Dialog>{" "}
    </div>
  );
}

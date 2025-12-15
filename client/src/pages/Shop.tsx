import { useState } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { LiquidCard } from "@/components/ui/LiquidCard";
import { useGame } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Shop() {
  const { wishlist, points, redeemItem, addWishlistItem, updateWishlistItem, deleteWishlistItem } = useGame();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [itemName, setItemName] = useState("");
  const [itemCost, setItemCost] = useState("");
  const [itemImage, setItemImage] = useState<string | undefined>(undefined);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setItemName("");
    setItemCost("");
    setItemImage(undefined);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setIsEditing(true);
    setEditingId(item.id);
    setItemName(item.name);
    setItemCost(item.cost.toString());
    setItemImage(item.image);
    setIsDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 600;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL("image/jpeg", 0.72);
          setItemImage(compressed);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveItem = () => {
    if (!itemName) return;

    if (isEditing && editingId) {
        updateWishlistItem(editingId, {
            name: itemName,
            cost: parseInt(itemCost) || 1000,
            image: itemImage
        });
    } else {
        addWishlistItem({
            name: itemName,
            cost: parseInt(itemCost) || 1000,
            image: itemImage
        });
    }
    setIsDialogOpen(false);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this item?")) {
        deleteWishlistItem(id);
    }
  };

  return (
    <MobileShell>
      <div className="flex justify-between items-center mb-6 pt-2 px-1">
        <div>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Wishlist</h2>
            <div className="flex items-center gap-2">
                 <p className="text-[#8E8E93] text-sm">Goals worth working for.</p>
                 <span className="bg-[#0A84FF]/10 text-[#0A84FF] px-2 py-0.5 rounded-full text-xs font-bold border border-[#0A84FF]/20">
                    My Balance: {points.toLocaleString()} PTS
                 </span>
            </div>
        </div>
        <Button onClick={handleOpenAdd} size="icon" className="rounded-full bg-[#1C1C1E] text-[#0A84FF] hover:bg-[#2C2C2E] border border-[#0A84FF]/30">
            <Plus size={20} />
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="bg-[#1C1C1E] border-white/10 text-white sm:max-w-[425px] rounded-[20px] shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-bold text-white text-xl">{isEditing ? "Edit Item" : "Add Item"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-[#8E8E93] font-medium text-xs uppercase tracking-wide">Item Name</Label>
                <Input id="name" value={itemName} onChange={(e) => setItemName(e.target.value)} className="bg-[#2C2C2E] border-transparent text-white rounded-[12px] h-12" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost" className="text-[#8E8E93] font-medium text-xs uppercase tracking-wide">Cost (PTS)</Label>
                <Input id="cost" type="number" value={itemCost} onChange={(e) => setItemCost(e.target.value)} className="bg-[#2C2C2E] border-transparent text-white rounded-[12px] h-12" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image" className="text-[#8E8E93] font-medium text-xs uppercase tracking-wide">Item Image</Label>
                <Input id="image" type="file" accept="image/*" onChange={handleImageUpload} className="bg-[#2C2C2E] border-transparent text-white rounded-[12px] h-12 pt-2.5 file:bg-[#0A84FF] file:text-white file:border-0 file:rounded-md file:mr-4 file:px-2 file:text-xs" />
                {itemImage && <img src={itemImage} alt="Preview" className="w-full h-32 object-cover rounded-[12px] mt-2 border border-white/10" />}
              </div>
            </div>
            <Button onClick={handleSaveItem} className="w-full bg-[#0A84FF] text-white hover:bg-[#007AFF] font-bold rounded-[12px] h-12 text-base">
              {isEditing ? "Save Changes" : "Add Item"}
            </Button>
          </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 gap-4">
        {wishlist.map((item) => {
            const canAfford = points >= item.cost;
            const percentage = Math.min(100, (points / item.cost) * 100);

            return (
                <LiquidCard 
                    key={item.id}
                    className={cn(
                        "group relative flex flex-col justify-between p-4 h-full bg-[#111112] border border-white/10 rounded-[24px] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] gap-3",
                        item.redeemed && "opacity-60"
                    )}
                >
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm rounded-full p-1 border border-white/10">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-white hover:text-white hover:bg-white/10"
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                        >
                            <Pencil size={14} />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-[#FF453A] hover:text-[#FF453A] hover:bg-[#FF453A]/10"
                            onClick={(e) => handleDeleteItem(item.id, e)}
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>

                    {/* Placeholder/Real Image Area */}
                    <div className="w-full aspect-square rounded-[18px] flex items-center justify-center border border-white/5 relative overflow-hidden bg-gradient-to-br from-[#1f1f21] via-[#1a1a1c] to-[#0f0f10]">
                        {item.image ? (
                             <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[#8E8E93] text-xs font-semibold tracking-wide uppercase">{item.name || "Item"}</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="text-base font-bold text-white leading-tight">{item.name}</h3>
                                <div className="text-sm font-semibold text-[#0A84FF]">{item.cost.toLocaleString()} PTS</div>
                            </div>
                            <div className="flex gap-1">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 text-white hover:text-white hover:bg-white/10"
                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                                >
                                    <Pencil size={14} />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 text-[#FF453A] hover:text-[#FF453A] hover:bg-[#FF453A]/10"
                                    onClick={(e) => handleDeleteItem(item.id, e)}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {!item.redeemed && (
                        <div className="mb-2 space-y-2">
                            <div className="flex justify-between text-[11px] font-bold uppercase text-[#8E8E93]">
                                <span>Savings</span>
                                <span>{percentage.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-[#2C2C2E] rounded-full overflow-hidden">
                                <div 
                                    className={cn(
                                        "h-full transition-all duration-500 rounded-full",
                                        canAfford ? "bg-[#30D158]" : "bg-[#0A84FF]"
                                    )}
                                    style={{ width: `${percentage}%` }} 
                                />
                            </div>
                        </div>
                    )}

                    <Button 
                        onClick={() => redeemItem(item.id)}
                        disabled={!canAfford || item.redeemed}
                        size="lg"
                        className={cn(
                            "w-full font-bold text-sm h-11 rounded-[12px]",
                            canAfford 
                                ? "bg-[#0A84FF] text-white hover:bg-[#007AFF] shadow-lg shadow-blue-900/20" 
                                : "bg-[#2C2C2E] text-[#8E8E93] border border-white/5"
                        )}
                    >
                        {item.redeemed ? "Owned" : canAfford ? "Buy Now" : "Locked"}
                    </Button>
                </LiquidCard>
            );
        })}
      </div>
    </MobileShell>
  );
}

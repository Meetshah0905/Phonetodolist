import { useState } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { LiquidCard } from "@/components/ui/LiquidCard";
import { useGame } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CheckCircle, Pencil, Trash2, Plus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Library() {
  const { books, updateBookProgress, addBook, updateBook, deleteBook } = useGame();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookPages, setBookPages] = useState("");
  const [bookDeadline, setBookDeadline] = useState("");
  const [bookImage, setBookImage] = useState<string | undefined>(undefined);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setBookTitle("");
    setBookAuthor("");
    setBookPages("");
    setBookDeadline("");
    setBookImage(undefined);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (book: any) => {
    setIsEditing(true);
    setEditingId(book.id);
    setBookTitle(book.title);
    setBookAuthor(book.author);
    setBookPages(book.totalPages.toString());
    setBookDeadline(book.deadline);
    setBookImage(book.image);
    setIsDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setBookImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSaveBook = () => {
    if (!bookTitle) return;

    if (isEditing && editingId) {
        updateBook(editingId, {
            title: bookTitle,
            author: bookAuthor,
            totalPages: parseInt(bookPages) || 100,
            deadline: bookDeadline,
            image: bookImage
        });
    } else {
        // AI Simulation for points
        const totalPoints = (parseInt(bookPages) || 100) > 300 ? 1000 : 500;
        
        addBook({
            title: bookTitle,
            author: bookAuthor,
            totalPoints: totalPoints,
            deadline: bookDeadline || "2025-12-31",
            totalPages: parseInt(bookPages) || 100,
            image: bookImage
        });
    }
    setIsDialogOpen(false);
  };

  const handleDeleteBook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this book?")) {
        deleteBook(id);
    }
  };

  return (
    <MobileShell>
      <div className="flex justify-between items-center mb-6 pt-2 px-1">
        <div>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Library</h2>
            <p className="text-[#8E8E93] text-sm">Knowledge assimilation.</p>
        </div>
        <Button onClick={handleOpenAdd} size="icon" className="rounded-full bg-[#1C1C1E] text-[#0A84FF] hover:bg-[#2C2C2E] border border-[#0A84FF]/30">
            <Plus size={20} />
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="bg-[#1C1C1E] border-white/10 text-white sm:max-w-[425px] rounded-[20px] shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-bold text-white text-xl">{isEditing ? "Edit Book" : "Add Book"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-[#8E8E93] font-medium text-xs uppercase tracking-wide">Title</Label>
                <Input id="title" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} className="bg-[#2C2C2E] border-transparent text-white rounded-[12px] h-12" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="author" className="text-[#8E8E93] font-medium text-xs uppercase tracking-wide">Author</Label>
                <Input id="author" value={bookAuthor} onChange={(e) => setBookAuthor(e.target.value)} className="bg-[#2C2C2E] border-transparent text-white rounded-[12px] h-12" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pages" className="text-[#8E8E93] font-medium text-xs uppercase tracking-wide">Total Pages</Label>
                <Input id="pages" type="number" value={bookPages} onChange={(e) => setBookPages(e.target.value)} className="bg-[#2C2C2E] border-transparent text-white rounded-[12px] h-12" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deadline" className="text-[#8E8E93] font-medium text-xs uppercase tracking-wide">Deadline</Label>
                <Input id="deadline" type="date" value={bookDeadline} onChange={(e) => setBookDeadline(e.target.value)} className="bg-[#2C2C2E] border-transparent text-white rounded-[12px] h-12" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image" className="text-[#8E8E93] font-medium text-xs uppercase tracking-wide">Cover Image</Label>
                <Input id="image" type="file" accept="image/*" onChange={handleImageUpload} className="bg-[#2C2C2E] border-transparent text-white rounded-[12px] h-12 pt-2.5 file:bg-[#0A84FF] file:text-white file:border-0 file:rounded-md file:mr-4 file:px-2 file:text-xs" />
                {bookImage && <img src={bookImage} alt="Preview" className="w-full h-32 object-cover rounded-[12px] mt-2 border border-white/10" />}
              </div>
            </div>
            <Button onClick={handleSaveBook} className="w-full bg-[#0A84FF] text-white hover:bg-[#007AFF] font-bold rounded-[12px] h-12 text-base">
              {isEditing ? "Save Changes" : "Add Book"}
            </Button>
          </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 gap-4">
        {books.map((book) => (
          <LiquidCard 
            key={book.id}
            className="p-0 overflow-hidden group flex flex-col h-full bg-[#121214] border border-white/10 rounded-[26px] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]"
          >
            {/* Cover Image Area - 60% Height */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#2C2C2E]">
                {book.image ? (
                    <img src={book.image} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#8E8E93] gap-2">
                        <span className="text-4xl">📚</span>
                        <span className="text-xs uppercase font-bold">No Cover</span>
                    </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                     <span className={cn(
                        "px-2 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wide backdrop-blur-md shadow-lg border border-white/10",
                        book.status === "completed" ? "bg-[#30D158]/80 text-white" : "bg-[#0A84FF]/80 text-white"
                     )}>
                        {book.status === "completed" ? "Completed" : "Reading"}
                     </span>
                </div>

                 {/* Top Actions */}
                <div className="absolute top-2 left-2 flex gap-1">
                    <Button variant="secondary" size="icon" className="h-6 w-6 rounded-full bg-black/60 hover:bg-black/70 text-white backdrop-blur-sm" onClick={() => handleOpenEdit(book)}>
                        <Pencil size={10} />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-6 w-6 rounded-full bg-black/60 hover:bg-black/70 text-[#FF453A] backdrop-blur-sm" onClick={(e) => handleDeleteBook(book.id, e)}>
                        <Trash2 size={10} />
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-3 flex flex-col flex-1 gap-2">
                <div className="flex-1">
                    <div className="inline-block bg-[#E5D0AC] text-[#5C4033] text-[8px] font-bold px-1.5 py-0.5 rounded-[4px] mb-1.5 uppercase tracking-wider">
                        Perfect for Designers
                    </div>
                    <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 mb-0.5">{book.title}</h3>
                    <p className="text-[#8E8E93] text-xs line-clamp-1">{book.author}</p>
                </div>

                <div className="space-y-2 mt-2">
                     <div className="flex items-center gap-2 text-[10px] text-[#8E8E93] font-mono">
                        <span>📄 {book.currentPage}/{book.totalPages}</span>
                        <span>•</span>
                        <span>{book.progress}%</span>
                     </div>
                     <Slider 
                        value={[book.currentPage]} 
                        max={book.totalPages} 
                        step={1}
                        onValueChange={(val) => updateBookProgress(book.id, val[0])}
                        className="h-2 [&>.relative>.absolute]:bg-[#0A84FF] [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:bg-white [&_[role=slider]]:border [&_[role=slider]]:border-[#0A84FF]"
                    />
                </div>
            </div>
          </LiquidCard>
        ))}
      </div>
    </MobileShell>
  );
}

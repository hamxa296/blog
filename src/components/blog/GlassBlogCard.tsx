import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BookOpen, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface GlassBlogCardProps {
  title?: string;
  excerpt?: string;
  image?: string;
  author?: {
    name: string;
    avatar: string;
  };
  date?: string;
  readTime?: string;
  tags?: string[];
  className?: string;
  href?: string;
}

const defaultPost = {
  title: "The Future of UI Design",
  excerpt:
    "Exploring the latest trends in glassmorphism, 3D elements, and micro-interactions.",
  image:
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
  author: {
    name: "Moumen Soliman",
    avatar: "https://github.com/shadcn.png",
  },
  date: "Dec 2, 2025",
  readTime: "5 min read",
  tags: ["Design", "UI/UX"],
};

export function GlassBlogCard({
  title = defaultPost.title,
  excerpt = defaultPost.excerpt,
  image = defaultPost.image,
  author = defaultPost.author,
  date = defaultPost.date,
  readTime = defaultPost.readTime,
  tags = defaultPost.tags,
  className,
  href,
}: GlassBlogCardProps) {
  const inner = (
    <Card className="group relative h-full overflow-hidden rounded-xl sm:rounded-2xl border-border/50 bg-card/30 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
      <div className="relative aspect-[4/3] sm:aspect-[16/9] overflow-hidden">
        <motion.img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />

        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex flex-wrap gap-1 sm:gap-2">
          {tags?.slice(0, 3).map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-background/50 backdrop-blur-sm hover:bg-background/80 text-[10px] sm:text-xs px-1.5 sm:px-2.5"
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <motion.span
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-primary px-3 py-1.5 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25"
          >
            <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Read Article</span>
            <span className="sm:hidden">Read</span>
          </motion.span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:gap-4 p-3 sm:p-5">
        <div className="space-y-1 sm:space-y-2">
          <h3 className="text-sm sm:text-xl font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-2">
            {title}
          </h3>
          <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground hidden sm:block">{excerpt}</p>
        </div>

        <div className="flex items-center justify-between border-t border-border/50 pt-2 sm:pt-4">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border border-border/50 shrink-0">
              <AvatarImage src={author.avatar} alt={author.name} />
              <AvatarFallback>{author.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-[10px] sm:text-xs min-w-0">
              <span className="font-medium text-foreground truncate">{author.name}</span>
              <span className="text-muted-foreground truncate hidden sm:block">{date}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            <span>{readTime}</span>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("w-full", className)}
    >
      {href ? (
        <Link to={href} className="block h-full">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </motion.div>
  );
}

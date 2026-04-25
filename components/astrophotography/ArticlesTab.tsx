import { motion } from "framer-motion";
import AstroSessionCard from "@/components/AstroSessionCard";
import type { Article } from "@/lib/schema";

interface ArticlesTabProps {
  articles: Article[];
  isLoading: boolean;
}

export default function ArticlesTab({ articles, isLoading }: ArticlesTabProps) {
  if (isLoading) {
    return <p className="font-mono text-xs text-[#edd382]/30">Loading…</p>;
  }

  if (articles.length === 0) {
    return (
      <p className="font-mono text-sm text-[#edd382]/30 py-16 text-center">
        No sessions published yet.
      </p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {articles.map((article, index) => (
        <motion.div
          key={article.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06, duration: 0.4 }}
        >
          <AstroSessionCard article={article} />
        </motion.div>
      ))}
    </div>
  );
}

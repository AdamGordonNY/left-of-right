import { ArticleContent } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

interface ArticleCardProps {
  article: ArticleContent;
  viewMode?: "grid" | "list";
}

export function ArticleCard({ article, viewMode = "grid" }: ArticleCardProps) {
  if (viewMode === "list") {
    return (
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <div className="flex gap-4 p-4">
          {article.coverImage ? (
            <div className="relative w-48 flex-shrink-0 aspect-video overflow-hidden bg-muted rounded-md">
              <img
                src={article.coverImage}
                alt={article.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <Badge className="absolute left-2 top-2 bg-blue-600 hover:bg-blue-700">
                Article
              </Badge>
            </div>
          ) : (
            <div className="relative w-48 flex-shrink-0 aspect-video flex items-center justify-center bg-gradient-to-br from-blue-50 to-muted rounded-md">
              <FileText className="h-16 w-16 text-blue-200" />
              <Badge className="absolute left-2 top-2 bg-blue-600 hover:bg-blue-700">
                Article
              </Badge>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-2 mb-2">
              {article.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <span className="font-medium">{article.creator}</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {format(new Date(article.publishedAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
            {article.excerpt && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {article.excerpt}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      {article.coverImage ? (
        <div className="relative aspect-video overflow-hidden bg-slate-100">
          <img
            src={article.coverImage}
            alt={article.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <Badge className="absolute left-3 top-3 bg-blue-600 hover:bg-blue-700">
            Article
          </Badge>
        </div>
      ) : (
        <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
          <FileText className="h-20 w-20 text-blue-200" />
          <Badge className="absolute left-3 top-3 bg-blue-600 hover:bg-blue-700">
            Article
          </Badge>
        </div>
      )}
      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="line-clamp-2 text-lg leading-snug">
          {article.title}
        </CardTitle>
        <div className="flex items-center justify-between text-sm">
          <CardDescription className="font-medium">
            {article.creator}
          </CardDescription>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs">
              {format(new Date(article.publishedAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {article.excerpt}
        </p>
      </CardContent>
    </Card>
  );
}
